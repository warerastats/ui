<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import CountryFlag from "$lib/components/CountryFlag.svelte";
    import EntityFilter from "$lib/components/EntityFilter.svelte";
    import ItemImage from "$lib/components/ItemImage.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import {
        buildBattleSideReportSummary,
        formatCompactNumber,
        formatMoney,
    } from "$lib/helpers";
    import type { BattleSideReportSummary } from "$lib/helpers";
    import type { DamageReportsApiResponse } from "$lib";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    function formatDate(iso: string): string {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
        });
    }

    let isAttackerWinner = $derived(data.battle?.winnerSide === "attacker");
    let isDefenderWinner = $derived(data.battle?.winnerSide === "defender");
    let sideReportSummary = $derived(
        data.battle
            ? buildBattleSideReportSummary(data.battle.damageReports)
            : null,
    );

    // Easy future switch for smaller devices:
    // set to true (or wire to viewport logic) to use 10-minute windows.
    const USE_COMPACT_TIMELINE = false;
    const DEFAULT_TIMELINE_WINDOW_MINUTES = 4;
    const COMPACT_TIMELINE_WINDOW_MINUTES = 10;

    let timelineWindowMinutes = $derived(
        USE_COMPACT_TIMELINE
            ? COMPACT_TIMELINE_WINDOW_MINUTES
            : DEFAULT_TIMELINE_WINDOW_MINUTES,
    );

    type TimelineBucket = {
        intervalStart: string;
        attackerDamage: number;
        defenderDamage: number;
    };

    function getBucketStartIso(iso: string, bucketMinutes: number): string {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) {
            return iso;
        }

        const ms = bucketMinutes * 60 * 1000;
        const bucketStartMs = Math.floor(date.getTime() / ms) * ms;
        return new Date(bucketStartMs).toISOString();
    }

    function buildBucketedTimeline(
        points: Array<{
            intervalStart: string;
            attackerDamage: number;
            defenderDamage: number;
        }>,
        bucketMinutes: number,
    ): TimelineBucket[] {
        const buckets = new Map<string, TimelineBucket>();

        for (const point of points) {
            const bucketStart = getBucketStartIso(
                point.intervalStart,
                bucketMinutes,
            );
            const bucket = buckets.get(bucketStart);

            if (bucket) {
                bucket.attackerDamage += point.attackerDamage;
                bucket.defenderDamage += point.defenderDamage;
                continue;
            }

            buckets.set(bucketStart, {
                intervalStart: bucketStart,
                attackerDamage: point.attackerDamage,
                defenderDamage: point.defenderDamage,
            });
        }

        return [...buckets.values()].sort((a, b) =>
            a.intervalStart.localeCompare(b.intervalStart),
        );
    }

    let bucketedTimeline = $derived(
        sideReportSummary
            ? buildBucketedTimeline(
                  sideReportSummary.timeline,
                  timelineWindowMinutes,
              )
            : [],
    );

    let bucketedMaxTimelineDamage = $derived(
        bucketedTimeline.reduce((max, point) => {
            return Math.max(max, point.attackerDamage, point.defenderDamage);
        }, 0),
    );

    function timelineBarHeight(value: number, max: number): number {
        if (value <= 0 || max <= 0) {
            return 0;
        }

        return Math.max((value / max) * 100, 6);
    }

    // --- Filter state ---
    type SelectedEntity = {
        kind: "USER" | "COUNTRY" | "PARTY" | "MU" | "ALLIANCE";
        id: string;
        name: string;
    };

    type BattleContentTab = "damageReports" | "orderChanges" | "topDamage";

    type TopDamageUserDetails = {
        loading: boolean;
        error: string | null;
        summary: BattleSideReportSummary | null;
    };

    type TopDamageGearItem = {
        side: "attacker" | "defender";
        itemCode: string;
        itemName: string;
        count: number;
        value: number;
    };

    let activeBattleTab = $state<BattleContentTab>("damageReports");
    let topDamageDetailsByUser = $state<Record<string, TopDamageUserDetails>>(
        {},
    );
    let topDamageRequested = $state(false);

    let filterEntity = $state<SelectedEntity | null>(null);
    let filterSummary = $state<BattleSideReportSummary | null>(null);
    let filterLoading = $state(false);
    let topDamageEntries = $derived(data.battle?.topDamage ?? []);

    let filteredBucketedTimeline = $derived(
        filterSummary
            ? buildBucketedTimeline(
                  filterSummary.timeline,
                  timelineWindowMinutes,
              )
            : [],
    );

    // Build a lookup map from intervalStart → bucket for filtered data
    let filteredBucketMap = $derived.by(() => {
        const map = new Map<string, TimelineBucket>();
        for (const bucket of filteredBucketedTimeline) {
            map.set(bucket.intervalStart, bucket);
        }
        return map;
    });

    // Build lookup maps for filtered equipment by itemCode per side
    let filteredEquipmentMap = $derived.by(() => {
        const attacker = new Map<string, { count: number; value: number }>();
        const defender = new Map<string, { count: number; value: number }>();
        if (filterSummary) {
            for (const eq of filterSummary.equipmentBySide.attacker) {
                attacker.set(eq.itemCode, { count: eq.count, value: eq.value });
            }
            for (const eq of filterSummary.equipmentBySide.defender) {
                defender.set(eq.itemCode, { count: eq.count, value: eq.value });
            }
        }
        return { attacker, defender };
    });

    $effect(() => {
        const entity = filterEntity;

        if (!entity || !data.id) {
            filterSummary = null;
            return;
        }

        filterLoading = true;

        const url = `/api/battle/${data.id}/damage-reports?entityKind=${encodeURIComponent(entity.kind)}&entityIds=${encodeURIComponent(entity.id)}`;

        fetch(url)
            .then((res) => res.json() as Promise<DamageReportsApiResponse>)
            .then((body) => {
                if (body.error) {
                    filterSummary = null;
                    return;
                }
                filterSummary = buildBattleSideReportSummary(body.reports);
            })
            .catch(() => {
                filterSummary = null;
            })
            .finally(() => {
                filterLoading = false;
            });
    });

    $effect(() => {
        if (!data.id || activeBattleTab !== "topDamage" || topDamageRequested) {
            return;
        }

        const entries = topDamageEntries;
        if (entries.length === 0) {
            topDamageRequested = true;
            return;
        }

        topDamageRequested = true;

        const initialState = { ...topDamageDetailsByUser };
        for (const entry of entries) {
            initialState[entry.user.id] = {
                loading: true,
                error: null,
                summary: null,
            };
        }
        topDamageDetailsByUser = initialState;

        Promise.all(
            entries.map(async (entry) => {
                const userId = entry.user.id;
                try {
                    const response = await fetch(
                        `/api/battle/${data.id}/damage-reports?entityKind=USER&entityIds=${encodeURIComponent(userId)}`,
                    );
                    const body =
                        (await response.json()) as DamageReportsApiResponse;
                    if (!response.ok || body.error) {
                        return {
                            userId,
                            error:
                                body.error ??
                                "Failed to load user damage reports",
                            summary: null,
                        };
                    }

                    return {
                        userId,
                        error: null,
                        summary: buildBattleSideReportSummary(body.reports),
                    };
                } catch (error) {
                    return {
                        userId,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                        summary: null,
                    };
                }
            }),
        ).then((results) => {
            const next = { ...topDamageDetailsByUser };
            for (const result of results) {
                next[result.userId] = {
                    loading: false,
                    error: result.error,
                    summary: result.summary,
                };
            }
            topDamageDetailsByUser = next;
        });
    });

    function buildTopDamageGear(
        summary: BattleSideReportSummary,
        limit = 8,
    ): TopDamageGearItem[] {
        const merged: TopDamageGearItem[] = [];
        for (const item of summary.equipmentBySide.attacker) {
            merged.push({
                side: "attacker",
                itemCode: item.itemCode,
                itemName: item.itemName,
                count: item.count,
                value: item.value,
            });
        }
        for (const item of summary.equipmentBySide.defender) {
            merged.push({
                side: "defender",
                itemCode: item.itemCode,
                itemName: item.itemName,
                count: item.count,
                value: item.value,
            });
        }

        return merged
            .sort(
                (a, b) =>
                    b.value - a.value ||
                    b.count - a.count ||
                    a.itemName.localeCompare(b.itemName),
            )
            .slice(0, limit);
    }

    function getOrderChangeSide(
        value: string,
    ): "attacker" | "defender" | "other" {
        const lower = value.toLowerCase();
        if (lower.includes("attacker")) {
            return "attacker";
        }
        if (lower.includes("defender")) {
            return "defender";
        }
        return "other";
    }

    function getOrderChangeSideInfo(value: string): {
        tone: "attacker" | "defender" | "other";
        sideLabel: string;
        countryName: string;
        countryCode: string | null;
    } {
        const tone = getOrderChangeSide(value);
        if (tone === "attacker") {
            return {
                tone,
                sideLabel: "Attacker",
                countryName: data.battle?.attackerCountry?.name ?? "Unknown",
                countryCode: data.battle?.attackerCountry?.code ?? null,
            };
        }
        if (tone === "defender") {
            return {
                tone,
                sideLabel: "Defender",
                countryName: data.battle?.defenderCountry?.name ?? "Unknown",
                countryCode: data.battle?.defenderCountry?.code ?? null,
            };
        }

        return {
            tone,
            sideLabel: value,
            countryName: "Unknown",
            countryCode: null,
        };
    }
</script>

{#if data.ok && data.battle}
    <div class="battle-hero">
        <div class="hero-content">
            <div class="battle-title">
                <h1>
                    Battle for
                    {#if data.battle.defenderRegion}
                        <a
                            class="region-link"
                            href={"/region/" + data.battle.defenderRegion.id}
                        >
                            {data.battle.defenderRegion.name}
                        </a>
                    {:else}
                        Unknown Region
                    {/if}
                </h1>
                {#if data.battle.endedAt}
                    <p class="date">{formatDate(data.battle.endedAt)}</p>
                {:else}
                    <p class="date">Active</p>
                {/if}
            </div>

            <div class="battle-matchup">
                <div
                    class="matchup-side attacker"
                    class:winner={isAttackerWinner}
                >
                    <a
                        class="side-header"
                        href={data.battle.attackerCountry
                            ? "/country/" + data.battle.attackerCountry.id
                            : undefined}
                    >
                        <CountryFlag
                            code={data.battle.attackerCountry?.code ?? ""}
                            alt={data.battle.attackerCountry?.name ??
                                "Attacker"}
                            height="28px"
                        />
                        <div class="side-name">
                            <span class="label">Attacker</span>
                            <span class="country"
                                >{data.battle.attackerCountry?.name ??
                                    "Unknown"}</span
                            >
                        </div>
                    </a>
                    <div class="damage">
                        {formatCompactNumber(data.battle.attackerDamages)}
                    </div>
                    {#if isAttackerWinner}
                        <div class="winner-badge">Winner</div>
                    {/if}
                </div>

                <div class="matchup-divider">vs</div>

                <div
                    class="matchup-side defender"
                    class:winner={isDefenderWinner}
                >
                    <a
                        class="side-header"
                        href={data.battle.defenderCountry
                            ? "/country/" + data.battle.defenderCountry.id
                            : undefined}
                    >
                        <CountryFlag
                            code={data.battle.defenderCountry?.code ?? ""}
                            alt={data.battle.defenderCountry?.name ??
                                "Defender"}
                            height="28px"
                        />
                        <div class="side-name">
                            <span class="label">Defender</span>
                            <span class="country"
                                >{data.battle.defenderCountry?.name ??
                                    "Unknown"}</span
                            >
                        </div>
                    </a>
                    <div class="damage">
                        {formatCompactNumber(data.battle.defenderDamages)}
                    </div>
                    {#if isDefenderWinner}
                        <div class="winner-badge">Winner</div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<div class="page-content">
    <Wrapper>
        {#if data.ok}
            {#if data.battle}
                <Card title="Battle Activity" headerBorder={false}>
                    <div
                        class="battle-tabs"
                        role="tablist"
                        aria-label="Battle content tabs"
                    >
                        <button
                            type="button"
                            class="battle-tab"
                            class:active={activeBattleTab === "damageReports"}
                            onclick={() => {
                                activeBattleTab = "damageReports";
                            }}
                        >
                            Damage Reports
                        </button>
                        <button
                            type="button"
                            class="battle-tab"
                            class:active={activeBattleTab === "orderChanges"}
                            onclick={() => {
                                activeBattleTab = "orderChanges";
                            }}
                        >
                            Order Changes
                        </button>
                        <button
                            type="button"
                            class="battle-tab"
                            class:active={activeBattleTab === "topDamage"}
                            onclick={() => {
                                activeBattleTab = "topDamage";
                            }}
                        >
                            Top Damage
                        </button>
                    </div>

                    {#if activeBattleTab === "damageReports"}
                        {#if data.battle.damageReports.length === 0}
                            <p class="empty-state">No damage reports.</p>
                        {:else if sideReportSummary}
                            <div class="battle-damage-viz">
                                <div class="viz-header">
                                    <div class="side-label attacker">
                                        Attacker
                                    </div>
                                    <div class="center-label">
                                        Damage Timeline ({timelineWindowMinutes}m)
                                    </div>
                                    <div class="side-label defender">
                                        Defender
                                    </div>
                                </div>

                                <div class="metric-values">
                                    <span class="attacker"
                                        >{formatCompactNumber(
                                            sideReportSummary.damageTotals
                                                .attacker,
                                        )}</span
                                    >
                                    <span class="defender"
                                        >{formatCompactNumber(
                                            sideReportSummary.damageTotals
                                                .defender,
                                        )}</span
                                    >
                                </div>

                                {#if filterSummary && filterEntity}
                                    <div class="metric-values filter-row">
                                        <span class="filter-value">
                                            {#if filterSummary.damageTotals.attacker > 0}
                                                {filterEntity.name}: {formatCompactNumber(
                                                    filterSummary.damageTotals
                                                        .attacker,
                                                )}
                                            {/if}
                                        </span>
                                        <span class="filter-value">
                                            {#if filterSummary.damageTotals.defender > 0}
                                                {filterEntity.name}: {formatCompactNumber(
                                                    filterSummary.damageTotals
                                                        .defender,
                                                )}
                                            {/if}
                                        </span>
                                    </div>
                                {/if}

                                <div class="compact-timeline">
                                    {#each bucketedTimeline as point (point.intervalStart)}
                                        {@const filtered =
                                            filteredBucketMap.get(
                                                point.intervalStart,
                                            )}
                                        <div
                                            class="timeline-point"
                                            title={`Attacker ${formatCompactNumber(point.attackerDamage)} vs Defender ${formatCompactNumber(point.defenderDamage)}${filtered ? ` | Filter: A ${formatCompactNumber(filtered.attackerDamage)} D ${formatCompactNumber(filtered.defenderDamage)}` : ""}`}
                                        >
                                            {#if point.attackerDamage >= point.defenderDamage}
                                                <div
                                                    class="bar attacker back"
                                                    style={`height: ${timelineBarHeight(point.attackerDamage, bucketedMaxTimelineDamage)}%`}
                                                ></div>
                                                <div
                                                    class="bar defender front"
                                                    style={`height: ${timelineBarHeight(point.defenderDamage, bucketedMaxTimelineDamage)}%`}
                                                ></div>
                                            {:else}
                                                <div
                                                    class="bar defender back"
                                                    style={`height: ${timelineBarHeight(point.defenderDamage, bucketedMaxTimelineDamage)}%`}
                                                ></div>
                                                <div
                                                    class="bar attacker front"
                                                    style={`height: ${timelineBarHeight(point.attackerDamage, bucketedMaxTimelineDamage)}%`}
                                                ></div>
                                            {/if}
                                            {#if filtered}
                                                {#if filtered.attackerDamage > 0}
                                                    <div
                                                        class="bar filter filter-attacker"
                                                        style={`height: ${timelineBarHeight(filtered.attackerDamage, bucketedMaxTimelineDamage)}%`}
                                                    ></div>
                                                {/if}
                                                {#if filtered.defenderDamage > 0}
                                                    <div
                                                        class="bar filter filter-defender"
                                                        style={`height: ${timelineBarHeight(filtered.defenderDamage, bucketedMaxTimelineDamage)}%`}
                                                    ></div>
                                                {/if}
                                            {/if}
                                        </div>
                                    {/each}
                                </div>

                                <div class="filter-section">
                                    <EntityFilter
                                        bind:selected={filterEntity}
                                        placeholder="Filter by player, country, MU..."
                                    />
                                    {#if filterLoading}
                                        <span class="filter-status"
                                            >Loading...</span
                                        >
                                    {/if}
                                </div>

                                <div class="equipment-totals">
                                    <div class="total attacker">
                                        <span class="label"
                                            >Attacker equipment value</span
                                        >
                                        <span class="value"
                                            >{formatMoney(
                                                sideReportSummary
                                                    .equipmentValueTotals
                                                    .attacker,
                                                0,
                                            )}
                                            btc</span
                                        >
                                        {#if filterSummary && filterEntity && filterSummary.equipmentValueTotals.attacker > 0}
                                            <span class="filter-sub"
                                                >{filterEntity.name}: {formatMoney(
                                                    filterSummary
                                                        .equipmentValueTotals
                                                        .attacker,
                                                    0,
                                                )}
                                                btc</span
                                            >
                                        {/if}
                                    </div>
                                    <div class="total defender">
                                        <span class="label"
                                            >Defender equipment value</span
                                        >
                                        <span class="value"
                                            >{formatMoney(
                                                sideReportSummary
                                                    .equipmentValueTotals
                                                    .defender,
                                                0,
                                            )}
                                            btc</span
                                        >
                                        {#if filterSummary && filterEntity && filterSummary.equipmentValueTotals.defender > 0}
                                            <span class="filter-sub"
                                                >{filterEntity.name}: {formatMoney(
                                                    filterSummary
                                                        .equipmentValueTotals
                                                        .defender,
                                                    0,
                                                )}
                                                btc</span
                                            >
                                        {/if}
                                    </div>
                                </div>

                                <div class="equipment-grid">
                                    <div class="equipment-side attacker">
                                        <h3>Attacker Equipment</h3>
                                        {#if sideReportSummary.equipmentBySide.attacker.length === 0}
                                            <p class="empty">
                                                No equipment used.
                                            </p>
                                        {:else}
                                            <ul>
                                                {#each sideReportSummary.equipmentBySide.attacker as eq (eq.itemCode)}
                                                    {@const fEq =
                                                        filteredEquipmentMap.attacker.get(
                                                            eq.itemCode,
                                                        )}
                                                    <li>
                                                        <ItemImage
                                                            itemCode={eq.itemCode}
                                                            size={20}
                                                        />
                                                        <span class="item-name"
                                                            >{eq.itemName}</span
                                                        >
                                                        <span class="item-count"
                                                            >{eq.count}x</span
                                                        >
                                                        <span class="item-value"
                                                            >{formatMoney(
                                                                eq.value,
                                                                0,
                                                            )}
                                                            btc</span
                                                        >
                                                    </li>
                                                    {#if fEq && filterEntity}
                                                        <li class="filter-row">
                                                            <span></span>
                                                            <span
                                                                class="filter-name"
                                                                >{filterEntity.name}</span
                                                            >
                                                            <span
                                                                class="filter-count"
                                                                >{fEq.count}x</span
                                                            >
                                                            <span
                                                                class="filter-value"
                                                                >{formatMoney(
                                                                    fEq.value,
                                                                    0,
                                                                )}
                                                                btc</span
                                                            >
                                                        </li>
                                                    {/if}
                                                {/each}
                                            </ul>
                                        {/if}
                                    </div>

                                    <div class="equipment-side defender">
                                        <h3>Defender Equipment</h3>
                                        {#if sideReportSummary.equipmentBySide.defender.length === 0}
                                            <p class="empty">
                                                No equipment used.
                                            </p>
                                        {:else}
                                            <ul>
                                                {#each sideReportSummary.equipmentBySide.defender as eq (eq.itemCode)}
                                                    {@const fEq =
                                                        filteredEquipmentMap.defender.get(
                                                            eq.itemCode,
                                                        )}
                                                    <li>
                                                        <ItemImage
                                                            itemCode={eq.itemCode}
                                                            size={20}
                                                        />
                                                        <span class="item-name"
                                                            >{eq.itemName}</span
                                                        >
                                                        <span class="item-count"
                                                            >{eq.count}x</span
                                                        >
                                                        <span class="item-value"
                                                            >{formatMoney(
                                                                eq.value,
                                                                0,
                                                            )}
                                                            btc</span
                                                        >
                                                    </li>
                                                    {#if fEq && filterEntity}
                                                        <li class="filter-row">
                                                            <span></span>
                                                            <span
                                                                class="filter-name"
                                                                >{filterEntity.name}</span
                                                            >
                                                            <span
                                                                class="filter-count"
                                                                >{fEq.count}x</span
                                                            >
                                                            <span
                                                                class="filter-value"
                                                                >{formatMoney(
                                                                    fEq.value,
                                                                    0,
                                                                )}
                                                                btc</span
                                                            >
                                                        </li>
                                                    {/if}
                                                {/each}
                                            </ul>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {:else if activeBattleTab === "orderChanges"}
                        <div class="order-changes-panel">
                            {#if data.battle.orderChanges.length === 0}
                                <p class="empty-state">No order changes.</p>
                            {:else}
                                <ul class="order-changes-list">
                                    {#each data.battle.orderChanges as change, index (`${change.at}-${change.side}-${change.kind}-${change.action}-${index}`)}
                                        {@const sideInfo =
                                            getOrderChangeSideInfo(change.side)}
                                        <li class="order-change-row">
                                            <div class="order-change-time">
                                                {formatDate(change.at)}
                                            </div>

                                            <div class="order-change-main">
                                                <div
                                                    class="order-change-entity"
                                                >
                                                    {#if change.entity.__typename === "Country"}
                                                        <a
                                                            class="entity-link"
                                                            href={`/country/${change.entity.id}`}
                                                        >
                                                            <CountryFlag
                                                                code={change
                                                                    .entity
                                                                    .code}
                                                                alt={change
                                                                    .entity
                                                                    .name}
                                                                width="18px"
                                                                height="18px"
                                                            />
                                                            <span
                                                                class="entity-name"
                                                                >{change.entity
                                                                    .name}</span
                                                            >
                                                        </a>
                                                    {:else if change.entity.__typename === "Mu"}
                                                        <a
                                                            class="entity-link"
                                                            href={`/mu/${change.entity.id}`}
                                                        >
                                                            <UserAvatar
                                                                src={change
                                                                    .entity
                                                                    .avatarUrl}
                                                                alt={`${change.entity.name} avatar`}
                                                                width="18px"
                                                                height="18px"
                                                            />
                                                            {#if change.entity.region?.initialCountry?.code}
                                                                <CountryFlag
                                                                    code={change
                                                                        .entity
                                                                        .region
                                                                        .initialCountry
                                                                        .code}
                                                                    alt={`${change.entity.name} country`}
                                                                    width="12px"
                                                                    height="12px"
                                                                />
                                                            {/if}
                                                            <span
                                                                class="entity-name"
                                                                >{change.entity
                                                                    .name}</span
                                                            >
                                                        </a>
                                                    {/if}
                                                </div>
                                                <span
                                                    class="order-change-action"
                                                >
                                                    {change.action.toLowerCase()}
                                                </span>
                                            </div>

                                            <div
                                                class="order-change-side-country"
                                            >
                                                <span
                                                    class="order-change-side"
                                                    class:attacker={sideInfo.tone ===
                                                        "attacker"}
                                                    class:defender={sideInfo.tone ===
                                                        "defender"}
                                                    class:other={sideInfo.tone ===
                                                        "other"}
                                                >
                                                    {sideInfo.sideLabel}
                                                </span>
                                                {#if sideInfo.countryCode}
                                                    <CountryFlag
                                                        code={sideInfo.countryCode}
                                                        alt={sideInfo.countryName}
                                                        width="14px"
                                                        height="14px"
                                                    />
                                                {/if}
                                                <span
                                                    class="order-change-country-name"
                                                    >{sideInfo.countryName}</span
                                                >
                                            </div>
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    {:else}
                        <div class="top-damage-panel">
                            {#if topDamageEntries.length === 0}
                                <p class="empty-state">No top damage data.</p>
                            {:else}
                                <ul class="top-damage-list">
                                    {#each topDamageEntries as entry, index (`${entry.user.id}-${index}`)}
                                        {@const detail =
                                            topDamageDetailsByUser[
                                                entry.user.id
                                            ]}
                                        <li class="top-damage-row">
                                            <div class="top-damage-rank">
                                                #{index + 1}
                                            </div>

                                            <a
                                                class="top-damage-user"
                                                href={`/user/${entry.user.id}`}
                                            >
                                                <UserAvatar
                                                    src={entry.user.avatarUrl}
                                                    alt={`${entry.user.username} avatar`}
                                                    width="22px"
                                                    height="22px"
                                                />
                                                {#if entry.user.country?.code}
                                                    <CountryFlag
                                                        code={entry.user.country
                                                            .code}
                                                        alt={`${entry.user.username} country`}
                                                        width="14px"
                                                        height="14px"
                                                    />
                                                {/if}
                                                <span class="name"
                                                    >{entry.user.username}</span
                                                >
                                            </a>

                                            <div class="top-damage-total">
                                                {formatCompactNumber(
                                                    entry.totalDamage,
                                                )}
                                            </div>

                                            <div class="top-damage-sides">
                                                {#if detail?.loading}
                                                    <span
                                                        class="top-damage-loading"
                                                        >Loading details...</span
                                                    >
                                                {:else if detail?.error}
                                                    <span
                                                        class="top-damage-error"
                                                        >{detail.error}</span
                                                    >
                                                {:else if detail?.summary}
                                                    <span class="side attacker"
                                                        >A {formatCompactNumber(
                                                            detail.summary
                                                                .damageTotals
                                                                .attacker,
                                                        )}</span
                                                    >
                                                    <span class="side defender"
                                                        >D {formatCompactNumber(
                                                            detail.summary
                                                                .damageTotals
                                                                .defender,
                                                        )}</span
                                                    >
                                                {/if}
                                            </div>

                                            <div class="top-damage-gear">
                                                {#if detail?.summary}
                                                    {@const gear =
                                                        buildTopDamageGear(
                                                            detail.summary,
                                                            8,
                                                        )}
                                                    {#if gear.length === 0}
                                                        <span
                                                            class="top-damage-empty"
                                                            >No equipment used</span
                                                        >
                                                    {:else}
                                                        <ul>
                                                            {#each gear as item (`${item.side}-${item.itemCode}`)}
                                                                <li>
                                                                    <span
                                                                        class="gear-side"
                                                                        class:attacker={item.side ===
                                                                            "attacker"}
                                                                        class:defender={item.side ===
                                                                            "defender"}
                                                                    >
                                                                        {item.side ===
                                                                        "attacker"
                                                                            ? "A"
                                                                            : "D"}
                                                                    </span>
                                                                    <ItemImage
                                                                        itemCode={item.itemCode}
                                                                        size={16}
                                                                    />
                                                                    <span
                                                                        class="gear-name"
                                                                        >{item.itemName}</span
                                                                    >
                                                                    <span
                                                                        class="gear-count"
                                                                        >{item.count}x</span
                                                                    >
                                                                </li>
                                                            {/each}
                                                        </ul>
                                                    {/if}
                                                {/if}
                                            </div>
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    {/if}
                </Card>
            {:else}
                <Card title="Battle">
                    <p class="empty-state">No battle data found.</p>
                </Card>
            {/if}
        {:else}
            <Card title="Battle">
                <p class="empty-state">GraphQL check failed: {data.error}</p>
            </Card>
        {/if}
    </Wrapper>
</div>

<style lang="scss">
    div.battle-hero {
        padding: 24px 8px;
        background: linear-gradient(135deg, #262626 0%, #2a2a2a 100%);
        border-bottom: 1px solid #353535;
    }

    div.hero-content {
        max-width: 1096px;
        margin: 0 auto;
        padding: 0 16px;
    }

    div.page-content {
        margin: 0 8px;
        margin-top: 24px;
        margin-bottom: 24px;
    }

    p.empty-state {
        margin: 0;
        color: #8c909f;
    }

    div.battle-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }

    button.battle-tab {
        border: 1px solid #353535;
        background: #1f1f1f;
        color: #8c909f;
        border-radius: 4px;
        padding: 7px 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            color: #c2c6d6;
            border-color: #4a4a4a;
        }

        &.active {
            background: #252525;
            color: #ffffff;
            border-color: #4af0c0;
            box-shadow: inset 0 0 0 1px rgba(74, 240, 192, 0.25);
        }
    }

    div.order-changes-panel {
        border: 1px solid #353535;
        background: #1f1f1f;
        border-radius: 4px;
        padding: 12px;
    }

    div.top-damage-panel {
        border: 1px solid #353535;
        background: #1f1f1f;
        border-radius: 4px;
        padding: 12px;
    }

    ul.top-damage-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    li.top-damage-row {
        border: 1px solid #353535;
        background: #242424;
        border-radius: 4px;
        padding: 8px 10px;
        display: grid;
        grid-template-columns: 42px 1fr auto auto;
        gap: 10px;
        align-items: center;
    }

    div.top-damage-rank {
        color: #8c909f;
        font-size: 12px;
        font-weight: 700;
    }

    a.top-damage-user {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: #c2c6d6;
        text-decoration: none;
        font-size: 13px;
        font-weight: 700;

        .name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &:hover {
            color: #ffffff;
            text-decoration: underline;
        }
    }

    div.top-damage-total {
        color: #ffd6aa;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: -0.2px;
        text-align: right;
    }

    div.top-damage-sides {
        display: inline-flex;
        align-items: center;
        gap: 6px;

        .side {
            font-size: 11px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 3px;
            border: 1px solid #3d3d3d;
            background: #2a2a2a;
        }

        .side.attacker {
            color: #ffb4ab;
            border-color: rgba(255, 132, 117, 0.5);
        }

        .side.defender {
            color: #9dc4ff;
            border-color: rgba(126, 169, 232, 0.5);
        }
    }

    span.top-damage-loading,
    span.top-damage-error,
    span.top-damage-empty {
        color: #8c909f;
        font-size: 11px;
        font-weight: 600;
    }

    span.top-damage-error {
        color: #ffb4ab;
    }

    div.top-damage-gear {
        grid-column: 1 / -1;

        ul {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        li {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            border: 1px solid #353535;
            background: #2a2a2a;
            border-radius: 3px;
            padding: 3px 6px;
            color: #c2c6d6;
            font-size: 11px;
        }

        .gear-side {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .gear-side.attacker {
            color: #ffb4ab;
        }

        .gear-side.defender {
            color: #9dc4ff;
        }

        .gear-name {
            max-width: 160px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .gear-count {
            color: #8c909f;
            font-weight: 700;
        }
    }

    ul.order-changes-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    li.order-change-row {
        display: grid;
        grid-template-columns: 180px 1fr auto;
        gap: 10px;
        align-items: center;
        border: 1px solid #353535;
        background: #242424;
        border-radius: 4px;
        padding: 8px 10px;
    }

    div.order-change-time {
        color: #8c909f;
        font-size: 12px;
        font-weight: 600;
    }

    div.order-change-main {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    span.order-change-side {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 700;
        border: 1px solid #3d3d3d;
        border-radius: 3px;
        padding: 2px 6px;
        color: #c2c6d6;
        background: #2a2a2a;
    }

    span.order-change-side.attacker {
        color: #ffb4ab;
        border-color: rgba(255, 132, 117, 0.5);
    }

    span.order-change-side.defender {
        color: #9dc4ff;
        border-color: rgba(126, 169, 232, 0.5);
    }

    span.order-change-side.other {
        color: #c2c6d6;
    }

    span.order-change-action {
        color: #d6d8e0;
        font-size: 12px;
        font-weight: 700;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-transform: lowercase;
    }

    div.order-change-side-country {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    span.order-change-country-name {
        color: #c2c6d6;
        font-size: 12px;
        font-weight: 700;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    div.order-change-entity {
        min-width: 0;

        a.entity-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #4af0c0;
            font-size: 12px;
            font-weight: 700;
            text-decoration: none;
            max-width: 100%;

            &:hover {
                text-decoration: underline;
            }

            .entity-name {
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            :global(img) {
                border-radius: 2px;
                flex-shrink: 0;
            }
        }
    }

    div.battle-title {
        margin-bottom: 24px;

        h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 700;
            color: #c2c6d6;
            letter-spacing: -0.5px;
        }

        a.region-link {
            color: #c2c6d6;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition:
                color 0.2s ease,
                border-color 0.2s ease;

            &:hover {
                color: #ffffff;
                border-color: #4ae176;
            }
        }

        p.date {
            margin: 0;
            font-size: 13px;
            color: #8c909f;
            font-weight: 500;
        }
    }

    div.battle-matchup {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    div.matchup-side {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: #1a1a1a;
        border-radius: 4px;
        border: 1px solid #353535;
        position: relative;
        transition: all 0.2s ease-out;

        &.winner {
            background: linear-gradient(
                135deg,
                rgba(74, 225, 118, 0.12) 0%,
                transparent 100%
            );
            border-color: rgba(74, 225, 118, 0.3);
        }

        a.side-header {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
            min-width: 0;
            color: inherit;
            text-decoration: none;
            border-radius: 2px;

            &:hover {
                :global(img) {
                    box-shadow: 0 0 0 1px #4ae176;
                }

                .side-name .country {
                    color: #ffffff;
                    text-decoration: underline;
                    text-decoration-color: rgba(74, 225, 118, 0.5);
                    text-underline-offset: 2px;
                }
            }

            :global(img) {
                flex-shrink: 0;
                border-radius: 2px;
            }

            .side-name {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;

                .label {
                    font-size: 11px;
                    color: #8c909f;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }

                .country {
                    font-size: 15px;
                    font-weight: 700;
                    color: #c2c6d6;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }
        }

        div.damage {
            font-size: 20px;
            font-weight: 800;
            color: #ffb4ab;
            letter-spacing: -0.5px;
            flex-shrink: 0;
        }

        div.winner-badge {
            position: absolute;
            top: -10px;
            right: 16px;
            padding: 4px 10px;
            background: #4ae176;
            color: #0a0a0a;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 3px;
        }
    }

    div.matchup-divider {
        font-size: 13px;
        color: #8c909f;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
    }

    div.battle-damage-viz {
        margin: 0;
        padding: 16px;
        border: 1px solid #353535;
        background: #1f1f1f;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    div.viz-header {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;

        .side-label {
            font-weight: 700;

            &.attacker {
                color: #ffb4ab;
                text-align: left;
            }

            &.defender {
                color: #9dc4ff;
                text-align: right;
            }
        }

        .center-label {
            color: #8c909f;
            padding: 0 12px;
            font-weight: 600;
        }
    }

    div.metric-values {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: -0.2px;
        padding: 0 2px;

        .attacker {
            color: #ffb4ab;
        }

        .defender {
            color: #9dc4ff;
        }
    }

    div.compact-timeline {
        display: flex;
        align-items: flex-end;
        gap: 3px;
        height: 86px;
        border-radius: 4px;
        background: #2b2b2b;
        padding: 8px;
        border: 1px solid #353535;
    }

    div.timeline-point {
        flex: 1;
        min-width: 0;
        position: relative;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
    }

    div.bar {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 0;
        width: 100%;
        border-radius: 2px 2px 0 0;
    }

    div.bar.back {
        z-index: 1;
        opacity: 0.78;
    }

    div.bar.front {
        z-index: 2;
        width: 70%;
        border-left: 1px solid rgba(0, 0, 0, 0.25);
        border-right: 1px solid rgba(0, 0, 0, 0.25);
    }

    div.bar.attacker {
        background: #ff8475;
    }

    div.bar.defender {
        background: #7ea9e8;
    }

    div.bar.filter {
        z-index: 3;
        width: 50%;
        background: #4af0c0;
        border-left: 1px solid rgba(0, 0, 0, 0.35);
        border-right: 1px solid rgba(0, 0, 0, 0.35);
        box-shadow: 0 0 4px rgba(74, 240, 192, 0.5);
    }

    div.filter-section {
        display: flex;
        align-items: center;
        gap: 10px;

        .filter-status {
            font-size: 11px;
            color: #4af0c0;
            font-weight: 600;
        }
    }

    div.metric-values.filter-row {
        margin-top: -4px;
        font-size: 12px;
        font-weight: 700;

        .filter-value {
            color: #4af0c0;
        }
    }

    div.equipment-totals {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    div.total {
        border: 1px solid #353535;
        border-radius: 4px;
        background: #242424;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label {
            color: #8c909f;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        .value {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: -0.2px;
        }

        &.attacker .value {
            color: #ffb4ab;
        }

        &.defender .value {
            color: #9dc4ff;
        }

        .filter-sub {
            font-size: 11px;
            font-weight: 700;
            color: #4af0c0;
            letter-spacing: -0.1px;
        }
    }

    div.equipment-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    div.equipment-side {
        border: 1px solid #353535;
        border-radius: 4px;
        background: #242424;
        padding: 10px 12px;

        h3 {
            margin: 0 0 8px;
            font-size: 12px;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            color: #c2c6d6;
        }

        p.empty {
            margin: 8px 0;
            color: #8c909f;
            font-size: 12px;
        }

        ul {
            margin: 0;
            padding: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        li {
            display: grid;
            grid-template-columns: 20px 1fr auto auto;
            align-items: center;
            gap: 8px;
            color: #c2c6d6;
            font-size: 12px;
        }

        .item-name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .item-count {
            color: #8c909f;
            font-weight: 600;
        }

        .item-value {
            font-weight: 700;
            letter-spacing: -0.2px;
        }

        li.filter-row {
            font-size: 11px;
            margin-top: -3px;

            .filter-name {
                color: #4af0c0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .filter-count {
                color: #4af0c0;
                font-weight: 600;
            }

            .filter-value {
                color: #4af0c0;
                font-weight: 700;
                letter-spacing: -0.2px;
            }
        }
    }

    @media (max-width: 900px) {
        li.top-damage-row {
            grid-template-columns: 1fr;
        }

        div.top-damage-total {
            text-align: left;
        }

        li.order-change-row {
            grid-template-columns: 1fr;
            gap: 6px;
        }

        div.compact-timeline {
            height: 72px;
            gap: 2px;
            padding: 6px;
        }

        div.equipment-totals,
        div.equipment-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 600px) {
        div.battle-matchup {
            flex-direction: column;
        }

        div.matchup-side {
            width: 100%;
        }

        div.matchup-divider {
            transform: rotate(90deg);
            margin: 8px 0;
        }
    }
</style>
