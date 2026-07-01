<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import Coin from "$lib/components/Coin.svelte";
    import ItemImage from "$lib/components/ItemImage.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import {
        formatCompactNumber,
        formatMoney,
        getItemName,
    } from "$lib/helpers";
    import type { EquipmentSkillPrice, FloatEntry } from "$lib";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // --- Skill key display names ---
    const SKILL_DISPLAY: Record<string, string> = {
        attack: "Attack",
        criticalChance: "Crit Chance",
        dodge: "Dodge",
        damage: "Damage",
        defense: "Defense",
        health: "Health",
        speed: "Speed",
        strength: "Strength",
    };

    function skillLabel(key: string): string {
        return SKILL_DISPLAY[key] ?? key;
    }

    function formatSkills(skills: FloatEntry[]): string {
        return skills.map((s) => `${skillLabel(s.key)}: ${s.value}`).join(", ");
    }

    // --- Detect single vs multi skill ---
    let isSingleSkill = $derived(
        data.ok &&
            data.pricing.skills.length > 0 &&
            data.pricing.skills[0].skills.length === 1,
    );

    let skillKeys = $derived.by(() => {
        if (!data.ok || data.pricing.skills.length === 0) return [];
        const keys = new Set<string>();
        for (const entry of data.pricing.skills) {
            for (const s of entry.skills) {
                keys.add(s.key);
            }
        }
        return [...keys];
    });

    // --- Skills table (filtered by selected skills, sorted by volume desc) ---
    let filteredSkills = $derived.by(() => {
        if (!data.ok) return [];

        const selections = Object.entries(selectedSkills).filter(
            ([, v]) => v != null,
        );

        let entries = data.pricing.skills;
        if (selections.length > 0) {
            entries = entries.filter((entry) =>
                selections.every(([k, v]) =>
                    entry.skills.some((s) => s.key === k && s.value === v),
                ),
            );
        }

        return [...entries].sort((a, b) => b.volume - a.volume);
    });

    // --- Grouped table for multi-skill items ---
    type SkillGroup = {
        primaryValue: number;
        totalVolume: number;
        weightedAvg: number;
        min: number;
        max: number;
        entries: EquipmentSkillPrice[];
    };

    let groupedSkills = $derived.by((): SkillGroup[] => {
        if (!data.ok || isSingleSkill || skillKeys.length < 2) return [];

        const primaryKey = skillKeys[0];
        const groups = new Map<number, EquipmentSkillPrice[]>();

        for (const entry of filteredSkills) {
            const primary = entry.skills.find((s) => s.key === primaryKey);
            if (!primary) continue;
            const list = groups.get(primary.value) ?? [];
            list.push(entry);
            groups.set(primary.value, list);
        }

        const result: SkillGroup[] = [];
        for (const [primaryValue, entries] of groups) {
            let totalMoney = 0;
            let totalVolume = 0;
            let min = Infinity;
            let max = -Infinity;
            for (const e of entries) {
                totalMoney += e.avg * e.volume;
                totalVolume += e.volume;
                if (e.min < min) min = e.min;
                if (e.max > max) max = e.max;
            }
            entries.sort((a, b) => b.volume - a.volume);
            result.push({
                primaryValue,
                totalVolume,
                weightedAvg: totalVolume > 0 ? totalMoney / totalVolume : 0,
                min: min === Infinity ? 0 : min,
                max: max === -Infinity ? 0 : max,
                entries,
            });
        }

        result.sort((a, b) => b.totalVolume - a.totalVolume);
        return result;
    });

    let expandedGroups = $state<Set<number>>(new Set());

    function toggleGroup(primaryValue: number) {
        const next = new Set(expandedGroups);
        if (next.has(primaryValue)) {
            next.delete(primaryValue);
        } else {
            next.add(primaryValue);
        }
        expandedGroups = next;
    }

    // --- Skill Impact Graph ---
    let graphSkillKey = $state<string>("");

    // Initialize graphSkillKey once data is available
    $effect(() => {
        if (skillKeys.length > 0 && graphSkillKey === "") {
            graphSkillKey = skillKeys[0];
        }
    });

    type GraphPoint = { value: number; avg: number; volume: number };

    let graphPoints = $derived.by((): GraphPoint[] => {
        if (!data.ok || data.pricing.skills.length === 0 || !graphSkillKey)
            return [];

        const grouped = new Map<
            number,
            { totalMoney: number; totalVolume: number }
        >();

        for (const entry of data.pricing.skills) {
            const skill = entry.skills.find((s) => s.key === graphSkillKey);
            if (!skill) continue;

            const existing = grouped.get(skill.value) ?? {
                totalMoney: 0,
                totalVolume: 0,
            };
            existing.totalMoney += entry.avg * entry.volume;
            existing.totalVolume += entry.volume;
            grouped.set(skill.value, existing);
        }

        const points: GraphPoint[] = [];
        for (const [value, agg] of grouped) {
            points.push({
                value,
                avg: agg.totalVolume > 0 ? agg.totalMoney / agg.totalVolume : 0,
                volume: agg.totalVolume,
            });
        }

        points.sort((a, b) => a.value - b.value);
        return points;
    });

    function buildLinePoints(
        pts: GraphPoint[],
        width: number,
        height: number,
        padding: number,
    ): string {
        if (pts.length === 0) return "";
        const minY = Math.min(...pts.map((p) => p.avg));
        const maxY = Math.max(...pts.map((p) => p.avg));
        const range = maxY - minY || 1;
        const innerW = width - padding * 2;
        const innerH = height - padding * 2;
        const step = pts.length > 1 ? innerW / (pts.length - 1) : 0;

        return pts
            .map((p, i) => {
                const x = padding + step * i;
                const y = height - padding - ((p.avg - minY) / range) * innerH;
                return `${x},${y}`;
            })
            .join(" ");
    }

    const GRAPH_W = 600;
    const GRAPH_H = 200;
    const GRAPH_PAD = 30;

    let graphLine = $derived(
        buildLinePoints(graphPoints, GRAPH_W, GRAPH_H, GRAPH_PAD),
    );

    let graphYLabels = $derived.by(() => {
        if (graphPoints.length === 0) return [];
        const min = Math.min(...graphPoints.map((p) => p.avg));
        const max = Math.max(...graphPoints.map((p) => p.avg));
        const range = max - min || 1;
        const steps = 4;
        const labels: { value: number; y: number }[] = [];
        for (let i = 0; i <= steps; i++) {
            const val = min + (range * i) / steps;
            const y =
                GRAPH_H -
                GRAPH_PAD -
                ((val - min) / range) * (GRAPH_H - GRAPH_PAD * 2);
            labels.push({ value: val, y });
        }
        return labels;
    });

    let graphXLabels = $derived.by(() => {
        if (graphPoints.length === 0) return [];
        const step =
            graphPoints.length > 1
                ? (GRAPH_W - GRAPH_PAD * 2) / (graphPoints.length - 1)
                : 0;
        const maxLabels = 15;
        const labelStep = Math.max(
            1,
            Math.ceil(graphPoints.length / maxLabels),
        );
        return graphPoints
            .filter(
                (_, i) => i % labelStep === 0 || i === graphPoints.length - 1,
            )
            .map((p, _, arr) => {
                const idx = graphPoints.indexOf(p);
                return {
                    value: p.value,
                    x: GRAPH_PAD + step * idx,
                };
            });
    });

    // --- Hover state for graph ---
    let hoveredPoint = $state<GraphPoint | null>(null);
    let hoverX = $state(0);
    let hoverY = $state(0);

    function handleGraphMouseMove(e: MouseEvent) {
        const svg = (e.currentTarget as SVGElement).getBoundingClientRect();
        const mouseX = e.clientX - svg.left;
        const relX = (mouseX / svg.width) * GRAPH_W;

        if (graphPoints.length === 0) return;

        const step =
            graphPoints.length > 1
                ? (GRAPH_W - GRAPH_PAD * 2) / (graphPoints.length - 1)
                : 0;
        const idx = Math.round((relX - GRAPH_PAD) / (step || 1));
        const clamped = Math.max(0, Math.min(idx, graphPoints.length - 1));
        hoveredPoint = graphPoints[clamped];
        hoverX = GRAPH_PAD + step * clamped;

        const min = Math.min(...graphPoints.map((p) => p.avg));
        const max = Math.max(...graphPoints.map((p) => p.avg));
        const range = max - min || 1;
        hoverY =
            GRAPH_H -
            GRAPH_PAD -
            ((hoveredPoint.avg - min) / range) * (GRAPH_H - GRAPH_PAD * 2);
    }

    function handleGraphMouseLeave() {
        hoveredPoint = null;
    }

    // --- Price Estimator ---
    let selectedSkills = $state<Record<string, number | null>>({});

    // Cascading filter: available values for each skill are filtered
    // based on the other selected skills
    let filteredSkillValues = $derived.by(() => {
        if (!data.ok) return new Map<string, number[]>();
        const result = new Map<string, number[]>();

        for (const key of skillKeys) {
            const otherSelections = Object.entries(selectedSkills).filter(
                ([k, v]) => k !== key && v != null,
            );

            const matchingEntries = data.pricing.skills.filter((entry) =>
                otherSelections.every(([k, v]) =>
                    entry.skills.some((s) => s.key === k && s.value === v),
                ),
            );

            const values = new Set<number>();
            for (const entry of matchingEntries) {
                const skill = entry.skills.find((s) => s.key === key);
                if (skill) values.add(skill.value);
            }

            result.set(
                key,
                [...values].sort((a, b) => a - b),
            );
        }

        return result;
    });

    let estimatorMatch = $derived.by((): EquipmentSkillPrice | null => {
        if (!data.ok) return null;
        const selected = selectedSkills;

        for (const key of skillKeys) {
            if (selected[key] == null) return null;
        }

        return (
            data.pricing.skills.find((entry) =>
                entry.skills.every((s) => selected[s.key] === s.value),
            ) ?? null
        );
    });

    function selectSkill(key: string, value: number) {
        if (selectedSkills[key] === value) {
            selectedSkills = { ...selectedSkills, [key]: null };
        } else {
            selectedSkills = { ...selectedSkills, [key]: value };
        }
    }

    function isSkillSelected(key: string, value: number): boolean {
        return selectedSkills[key] === value;
    }
</script>

<div class="page-content">
    <Wrapper>
        {#if data.ok}
            <div class="item-header">
                <ItemImage itemCode={data.itemCode} size={52} />
                <div class="item-meta">
                    <h1>{getItemName(data.itemCode)}</h1>
                    <p>{data.itemCode}</p>
                </div>
            </div>

            <!-- Stats Bar -->
            <div class="stats-grid">
                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Avg Price</p>
                    <p class="value coin-value">
                        <Coin width="14px" height="14px" />
                        {formatMoney(data.pricing.window?.weightedAvg ?? 0, 4)}
                    </p>
                </Card>
                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Trades</p>
                    <p class="value">
                        {(data.pricing.window?.count ?? 0).toLocaleString()}
                    </p>
                </Card>
                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Window</p>
                    <p class="value">{data.windowDays} days</p>
                </Card>
            </div>

            <!-- Skill Impact Graph -->
            {#if graphPoints.length > 1}
                <Card title="Skill Impact on Price" class="graph-card">
                    {#if skillKeys.length > 1}
                        <div class="graph-controls">
                            <label>
                                Skill
                                <select bind:value={graphSkillKey}>
                                    {#each skillKeys as key}
                                        <option value={key}
                                            >{skillLabel(key)}</option
                                        >
                                    {/each}
                                </select>
                            </label>
                        </div>
                    {/if}
                    <div class="graph-wrap">
                        <svg
                            viewBox="0 0 {GRAPH_W} {GRAPH_H}"
                            preserveAspectRatio="none"
                            class="skill-graph"
                            role="img"
                            aria-label="Skill impact on price chart"
                            onmousemove={handleGraphMouseMove}
                            onmouseleave={handleGraphMouseLeave}
                        >
                            <!-- Grid lines -->
                            {#each graphYLabels as label}
                                <line
                                    x1={GRAPH_PAD}
                                    y1={label.y}
                                    x2={GRAPH_W - GRAPH_PAD}
                                    y2={label.y}
                                    class="grid-line"
                                />
                            {/each}

                            <!-- Line -->
                            <polyline points={graphLine} class="price-line" />

                            <!-- Data points -->
                            {#each graphPoints as point, i}
                                {@const step =
                                    graphPoints.length > 1
                                        ? (GRAPH_W - GRAPH_PAD * 2) /
                                          (graphPoints.length - 1)
                                        : 0}
                                {@const min = Math.min(
                                    ...graphPoints.map((p) => p.avg),
                                )}
                                {@const max = Math.max(
                                    ...graphPoints.map((p) => p.avg),
                                )}
                                {@const range = max - min || 1}
                                {@const cx = GRAPH_PAD + step * i}
                                {@const cy =
                                    GRAPH_H -
                                    GRAPH_PAD -
                                    ((point.avg - min) / range) *
                                        (GRAPH_H - GRAPH_PAD * 2)}
                                <circle {cx} {cy} r="3" class="data-point" />
                            {/each}

                            <!-- Hover indicator -->
                            {#if hoveredPoint}
                                <line
                                    x1={hoverX}
                                    y1={GRAPH_PAD}
                                    x2={hoverX}
                                    y2={GRAPH_H - GRAPH_PAD}
                                    class="hover-line"
                                />
                                <circle
                                    cx={hoverX}
                                    cy={hoverY}
                                    r="5"
                                    class="hover-point"
                                />
                            {/if}
                        </svg>

                        <!-- Y-axis labels -->
                        <div class="y-labels">
                            {#each graphYLabels as label}
                                <span
                                    class="y-label"
                                    style="top: {(label.y / GRAPH_H) * 100}%"
                                >
                                    {formatMoney(label.value, 2)}
                                </span>
                            {/each}
                        </div>

                        <!-- X-axis labels -->
                        <div class="x-labels">
                            {#each graphXLabels as label}
                                <span
                                    class="x-label"
                                    style="left: {(label.x / GRAPH_W) * 100}%"
                                >
                                    {label.value}
                                </span>
                            {/each}
                        </div>

                        <!-- Hover tooltip -->
                        {#if hoveredPoint}
                            <div
                                class="graph-tooltip"
                                style="left: {(hoverX / GRAPH_W) *
                                    100}%; top: {(hoverY / GRAPH_H) * 100}%"
                            >
                                <span class="tt-skill"
                                    >{skillLabel(graphSkillKey)}: {hoveredPoint.value}</span
                                >
                                <span class="tt-price"
                                    >Avg: {formatMoney(
                                        hoveredPoint.avg,
                                        3,
                                    )}</span
                                >
                                <span class="tt-vol"
                                    >Vol: {hoveredPoint.volume}</span
                                >
                            </div>
                        {/if}
                    </div>
                </Card>
            {/if}

            <!-- Price Estimator -->
            {#if data.pricing.skills.length > 0}
                <Card title="Price Estimator" class="estimator-card">
                    <div class="estimator-body">
                        {#each skillKeys as key}
                            {@const values = filteredSkillValues.get(key) ?? []}
                            <div class="skill-row">
                                <span class="skill-name">{skillLabel(key)}</span
                                >
                                <div class="skill-buttons">
                                    {#each values as val}
                                        <button
                                            class="skill-btn"
                                            class:active={isSkillSelected(
                                                key,
                                                val,
                                            )}
                                            onclick={() =>
                                                selectSkill(key, val)}
                                        >
                                            {val}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/each}

                        <div class="estimator-result">
                            {#if estimatorMatch}
                                <div class="result-grid">
                                    <div class="result-item">
                                        <span class="result-label"
                                            >Avg Price</span
                                        >
                                        <span class="result-value coin-value">
                                            <Coin width="13px" height="13px" />
                                            {formatMoney(estimatorMatch.avg, 3)}
                                        </span>
                                    </div>
                                    <div class="result-item">
                                        <span class="result-label">Min</span>
                                        <span class="result-value coin-value">
                                            <Coin width="13px" height="13px" />
                                            {formatMoney(estimatorMatch.min, 3)}
                                        </span>
                                    </div>
                                    <div class="result-item">
                                        <span class="result-label">Max</span>
                                        <span class="result-value coin-value">
                                            <Coin width="13px" height="13px" />
                                            {formatMoney(estimatorMatch.max, 3)}
                                        </span>
                                    </div>
                                    <div class="result-item">
                                        <span class="result-label">Volume</span>
                                        <span class="result-value"
                                            >{estimatorMatch.volume.toLocaleString()}</span
                                        >
                                    </div>
                                </div>
                            {:else if skillKeys.every((k) => selectedSkills[k] != null)}
                                <p class="no-match">
                                    No data for this combination.
                                </p>
                            {:else}
                                <p class="no-match">
                                    Select all skills to see pricing.
                                </p>
                            {/if}
                        </div>
                    </div>
                </Card>
            {/if}

            <!-- Skills Pricing Table -->
            {#if filteredSkills.length > 0}
                <Card
                    title="Pricing by Skill ({filteredSkills.length})"
                    class="skills-card"
                >
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th class="col-skill"
                                        >{isSingleSkill
                                            ? skillLabel(skillKeys[0])
                                            : "Skills"}</th
                                    >
                                    <th class="col-price">Avg</th>
                                    <th class="col-price">Min</th>
                                    <th class="col-price">Max</th>
                                    <th class="col-num">Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#if isSingleSkill}
                                    {#each filteredSkills as entry}
                                        <tr>
                                            <td class="col-skill"
                                                >{entry.skills[0].value}</td
                                            >
                                            <td class="col-price">
                                                <span class="cell-coin">
                                                    <Coin
                                                        width="11px"
                                                        height="11px"
                                                    />
                                                    {formatMoney(entry.avg, 3)}
                                                </span>
                                            </td>
                                            <td class="col-price">
                                                <span class="cell-coin">
                                                    <Coin
                                                        width="11px"
                                                        height="11px"
                                                    />
                                                    {formatMoney(entry.min, 3)}
                                                </span>
                                            </td>
                                            <td class="col-price">
                                                <span class="cell-coin">
                                                    <Coin
                                                        width="11px"
                                                        height="11px"
                                                    />
                                                    {formatMoney(entry.max, 3)}
                                                </span>
                                            </td>
                                            <td class="col-num"
                                                >{entry.volume.toLocaleString()}</td
                                            >
                                        </tr>
                                    {/each}
                                {:else}
                                    {#each groupedSkills as group}
                                        <tr
                                            class="group-header"
                                            onclick={() =>
                                                toggleGroup(group.primaryValue)}
                                        >
                                            <td class="col-skill">
                                                <span class="group-toggle"
                                                    >{expandedGroups.has(
                                                        group.primaryValue,
                                                    )
                                                        ? "▾"
                                                        : "▸"}</span
                                                >
                                                {skillLabel(skillKeys[0])}: {group.primaryValue}
                                                <span class="group-count"
                                                    >({group.entries
                                                        .length})</span
                                                >
                                            </td>
                                            <td class="col-price">
                                                <span class="cell-coin">
                                                    <Coin
                                                        width="11px"
                                                        height="11px"
                                                    />
                                                    {formatMoney(
                                                        group.weightedAvg,
                                                        3,
                                                    )}
                                                </span>
                                            </td>
                                            <td class="col-price">
                                                <span class="cell-coin">
                                                    <Coin
                                                        width="11px"
                                                        height="11px"
                                                    />
                                                    {formatMoney(group.min, 3)}
                                                </span>
                                            </td>
                                            <td class="col-price">
                                                <span class="cell-coin">
                                                    <Coin
                                                        width="11px"
                                                        height="11px"
                                                    />
                                                    {formatMoney(group.max, 3)}
                                                </span>
                                            </td>
                                            <td class="col-num"
                                                >{group.totalVolume.toLocaleString()}</td
                                            >
                                        </tr>
                                        {#if expandedGroups.has(group.primaryValue)}
                                            {#each group.entries as entry}
                                                <tr class="group-child">
                                                    <td
                                                        class="col-skill child-skill"
                                                    >
                                                        {entry.skills
                                                            .filter(
                                                                (s) =>
                                                                    s.key !==
                                                                    skillKeys[0],
                                                            )
                                                            .map(
                                                                (s) =>
                                                                    `${skillLabel(s.key)}: ${s.value}`,
                                                            )
                                                            .join(", ")}
                                                    </td>
                                                    <td class="col-price">
                                                        <span class="cell-coin">
                                                            <Coin
                                                                width="11px"
                                                                height="11px"
                                                            />
                                                            {formatMoney(
                                                                entry.avg,
                                                                3,
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td class="col-price">
                                                        <span class="cell-coin">
                                                            <Coin
                                                                width="11px"
                                                                height="11px"
                                                            />
                                                            {formatMoney(
                                                                entry.min,
                                                                3,
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td class="col-price">
                                                        <span class="cell-coin">
                                                            <Coin
                                                                width="11px"
                                                                height="11px"
                                                            />
                                                            {formatMoney(
                                                                entry.max,
                                                                3,
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td class="col-num"
                                                        >{entry.volume.toLocaleString()}</td
                                                    >
                                                </tr>
                                            {/each}
                                        {/if}
                                    {/each}
                                {/if}
                            </tbody>
                        </table>
                    </div>
                </Card>
            {/if}
            {#if data.transactions.length > 0}
                <Card title="Recent Transactions" class="transactions-card">
                    <div
                        class="transactions-list"
                        role="list"
                        aria-label="Equipment transactions"
                    >
                        {#each data.transactions as tx, i (`tx-${i}`)}
                            <div class="tx-row" role="listitem">
                                <a
                                    href={`/user/${tx.seller.id}`}
                                    class="party seller"
                                >
                                    <span class="party-label">Seller</span>
                                    <span class="party-main">
                                        <UserAvatar
                                            src={tx.seller.avatarUrl}
                                            alt={tx.seller.username}
                                            width="20px"
                                            height="20px"
                                        />
                                        <span class="name"
                                            >{tx.seller.username}</span
                                        >
                                    </span>
                                </a>

                                <div class="trade-center">
                                    <span class="money-value">
                                        <Coin width="12px" height="12px" />
                                        {formatMoney(tx.money, 4)}
                                    </span>
                                    {#if tx.item.skills.length > 0}
                                        <div class="skill-badges">
                                            {#each tx.item.skills as skill}
                                                <span class="skill-badge">
                                                    {skillLabel(skill.key)}: {skill.value}
                                                </span>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>

                                <a
                                    href={`/user/${tx.buyer.id}`}
                                    class="party buyer"
                                >
                                    <span class="party-label">Buyer</span>
                                    <span class="party-main">
                                        <UserAvatar
                                            src={tx.buyer.avatarUrl}
                                            alt={tx.buyer.username}
                                            width="20px"
                                            height="20px"
                                        />
                                        <span class="name"
                                            >{tx.buyer.username}</span
                                        >
                                    </span>
                                </a>
                            </div>
                        {/each}
                    </div>
                </Card>
            {/if}
        {:else}
            <Card title="Equipment">
                <p class="empty-state">GraphQL check failed: {data.error}</p>
            </Card>
        {/if}
    </Wrapper>
</div>

<style lang="scss">
    div.page-content {
        margin: 24px 8px;
    }

    div.item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }

    div.item-meta {
        h1 {
            margin: 0;
            color: #c2c6d6;
            font-size: 30px;
            line-height: 1.1;
        }

        p {
            margin: 2px 0 0;
            color: #8c909f;
            font-size: 13px;
        }
    }

    /* Stats */
    div.stats-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
    }

    :global(div.stat-card > div.body) {
        gap: 6px;
        padding: 14px;
    }

    p.label {
        margin: 0;
        color: #8c909f;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        font-weight: 700;
    }

    p.value {
        margin: 0;
        color: #c2c6d6;
        font-size: 20px;
        font-weight: 800;
    }

    p.coin-value {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    /* Graph */
    :global(div.graph-card) {
        margin-bottom: 16px;
    }

    :global(div.graph-card > div.body) {
        padding: 12px;
    }

    div.graph-controls {
        margin-bottom: 10px;

        label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #8c909f;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        select {
            border: 1px solid #353535;
            background: #1f1f1f;
            color: #c2c6d6;
            font-size: 12px;
            border-radius: 4px;
            padding: 4px 8px;
            outline: none;
        }
    }

    div.graph-wrap {
        position: relative;
        width: 100%;
    }

    svg.skill-graph {
        width: 100%;
        height: auto;
        aspect-ratio: 3 / 1;
    }

    :global(line.grid-line) {
        stroke: #2a2a2a;
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
    }

    :global(polyline.price-line) {
        fill: none;
        stroke: #4af0c0;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
    }

    :global(circle.data-point) {
        fill: #4af0c0;
        vector-effect: non-scaling-stroke;
    }

    :global(line.hover-line) {
        stroke: #8c909f;
        stroke-width: 1;
        stroke-dasharray: 4 3;
        vector-effect: non-scaling-stroke;
    }

    :global(circle.hover-point) {
        fill: #fff;
        stroke: #4af0c0;
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
    }

    div.y-labels {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 0;
        pointer-events: none;

        span.y-label {
            position: absolute;
            right: 4px;
            transform: translateY(-50%) translateX(-100%);
            font-size: 10px;
            color: #8c909f;
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
        }
    }

    div.x-labels {
        position: relative;
        width: 100%;
        height: 16px;
        pointer-events: none;

        span.x-label {
            position: absolute;
            top: 2px;
            transform: translateX(-50%);
            font-size: 10px;
            color: #8c909f;
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
        }
    }

    div.graph-tooltip {
        position: absolute;
        transform: translate(-50%, -110%);
        background: #1a1a1a;
        border: 1px solid #353535;
        border-radius: 6px;
        padding: 6px 10px;
        pointer-events: none;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 2px;
        white-space: nowrap;

        span.tt-skill {
            color: #c2c6d6;
            font-size: 11px;
            font-weight: 700;
        }

        span.tt-price {
            color: #4af0c0;
            font-size: 11px;
            font-weight: 600;
        }

        span.tt-vol {
            color: #8c909f;
            font-size: 10px;
        }
    }

    /* Price Estimator */
    :global(div.estimator-card) {
        margin-bottom: 16px;
    }

    :global(div.estimator-card > div.body) {
        padding: 14px;
    }

    div.estimator-body {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    div.skill-row {
        display: flex;
        flex-direction: column;
        gap: 6px;

        span.skill-name {
            color: #8c909f;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
    }

    div.skill-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    button.skill-btn {
        border: 1px solid #353535;
        background: #1f1f1f;
        color: #8c909f;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        min-width: 36px;
        text-align: center;
        font-variant-numeric: tabular-nums;

        &:hover {
            border-color: #4af0c0;
            color: #c2c6d6;
        }

        &.active {
            background: #1a3a2e;
            border-color: #4af0c0;
            color: #4af0c0;
        }
    }

    div.estimator-result {
        border-top: 1px solid #353535;
        padding-top: 12px;
    }

    div.result-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
    }

    div.result-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        span.result-label {
            color: #8c909f;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        span.result-value {
            color: #c2c6d6;
            font-size: 16px;
            font-weight: 800;
        }

        span.coin-value {
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
    }

    p.no-match {
        margin: 0;
        color: #8c909f;
        font-size: 13px;
    }

    /* Skills Table */
    :global(div.skills-card) {
        margin-bottom: 16px;
    }

    :global(div.skills-card > div.body) {
        padding: 0;
    }

    div.table-wrap {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-variant-numeric: tabular-nums;
    }

    thead {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    th {
        background: #1a1a1a;
        color: #8c909f;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid #353535;

        &.col-price,
        &.col-num {
            text-align: right;
        }
    }

    td {
        padding: 8px 12px;
        color: #c2c6d6;
        font-size: 12px;
        border-bottom: 1px solid #2a2a2a;

        &.col-skill {
            font-weight: 600;
        }

        &.col-price,
        &.col-num {
            text-align: right;
        }
    }

    span.cell-coin {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    tbody tr:hover {
        background: #1f1f1f;
    }

    tr.group-header {
        cursor: pointer;
        background: #1a1a1a;

        &:hover {
            background: #222;
        }

        td.col-skill {
            font-weight: 700;
            color: #c2c6d6;
        }

        span.group-toggle {
            display: inline-block;
            width: 14px;
            color: #8c909f;
            font-size: 11px;
        }

        span.group-count {
            color: #8c909f;
            font-size: 11px;
            font-weight: 600;
            margin-left: 4px;
        }
    }

    tr.group-child {
        td.child-skill {
            padding-left: 30px;
            color: #8c909f;
            font-weight: 500;
        }
    }

    /* Transactions */
    :global(div.transactions-card) {
        margin-bottom: 16px;
    }

    :global(div.transactions-card > div.body) {
        padding: 12px;
    }

    div.transactions-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    div.tx-row {
        border: 1px solid #353535;
        background: #1f1f1f;
        padding: 10px;
        display: grid;
        grid-template-columns: minmax(160px, 1fr) auto minmax(160px, 1fr);
        align-items: center;
        gap: 10px;
    }

    a.party {
        display: flex;
        flex-direction: column;
        gap: 6px;
        text-decoration: none;
        min-width: 0;

        span.party-label {
            color: #8c909f;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            font-weight: 700;
        }

        span.party-main {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #c2c6d6;
            font-size: 14px;
            font-weight: 600;

            span.name {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        &.seller {
            justify-self: start;

            &:hover span.party-main {
                color: #ffb4ab;
            }
        }

        &.buyer {
            justify-self: end;
            text-align: right;

            span.party-main {
                justify-content: flex-end;
            }

            &:hover span.party-main {
                color: #4af0c0;
            }
        }
    }

    div.trade-center {
        border: 1px solid #303030;
        background: #171717;
        border-radius: 6px;
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: center;
    }

    span.money-value {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #c2c6d6;
        font-size: 13px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }

    div.skill-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        justify-content: center;
    }

    span.skill-badge {
        background: #262626;
        border: 1px solid #353535;
        color: #8c909f;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 3px;
        white-space: nowrap;
    }

    p.empty-state {
        margin: 0;
        color: #8c909f;
    }

    @media (max-width: 900px) {
        div.stats-grid {
            grid-template-columns: 1fr;
        }

        div.result-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        div.tx-row {
            grid-template-columns: 1fr;
            gap: 8px;
        }

        a.party.buyer {
            justify-self: start;
            text-align: left;

            span.party-main {
                justify-content: flex-start;
            }
        }
    }

    @media (max-width: 560px) {
        div.item-meta h1 {
            font-size: 24px;
        }

        div.result-grid {
            grid-template-columns: 1fr 1fr;
        }
    }
</style>
