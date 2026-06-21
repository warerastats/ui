<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import CountryFlag from "$lib/components/CountryFlag.svelte";
    import ItemImage from "$lib/components/ItemImage.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import {
        buildBattleSideReportSummary,
        formatCompactNumber,
        formatMoney,
    } from "$lib/helpers";
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
                <Card title="Damage Reports" headerBorder={false}>
                    {#if data.battle.damageReports.length === 0}
                        <p class="empty-state">No damage reports.</p>
                    {:else}
                        {#if sideReportSummary}
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

                                <div class="compact-timeline">
                                    {#each bucketedTimeline as point (point.intervalStart)}
                                        <div
                                            class="timeline-point"
                                            title={`Attacker ${formatCompactNumber(point.attackerDamage)} vs Defender ${formatCompactNumber(point.defenderDamage)}`}
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
                                        </div>
                                    {/each}
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
                                                {/each}
                                            </ul>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/if}
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
        margin: -8px -8px 32px -8px;
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
    }

    @media (max-width: 900px) {
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
