<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import Coin from "$lib/components/Coin.svelte";
    import CountryFlag from "$lib/components/CountryFlag.svelte";
    import ItemImage from "$lib/components/ItemImage.svelte";
    import TimeSeriesChart from "$lib/components/TimeSeriesChart.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import {
        formatCompactNumber,
        formatMoney,
        getEthicsLabel,
        getItemName,
    } from "$lib/helpers";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // --- Wealth & Military derived metrics (60d) ---
    let wealthChartPoints = $derived(
        data.ok
            ? data.country.wealthReports.map((r) => ({
                  label: shortDate(r.dayStart),
                  value: r.totalWealth,
              }))
            : [],
    );

    let damageChartPoints = $derived(
        data.ok
            ? data.country.wealthReports.map((r) => ({
                  label: shortDate(r.dayStart),
                  value: r.totalDamage,
              }))
            : [],
    );

    let damageMetrics = $derived.by(() => {
        if (!data.ok || data.country.wealthReports.length === 0) return null;
        const reports = data.country.wealthReports;
        const totalDamage = reports.reduce((sum, r) => sum + r.totalDamage, 0);
        const avgDaily = totalDamage / reports.length;
        const peakDaily = Math.max(...reports.map((r) => r.totalDamage));
        const latestMembers = reports[reports.length - 1].memberCount || 1;
        const damagePerCitizen = totalDamage / latestMembers;
        const peakPerCapita = peakDaily / latestMembers;
        const projected = peakPerCapita * data.country.userCount;
        return {
            totalDamage,
            avgDaily,
            peakDaily,
            damagePerCitizen,
            projected,
        };
    });

    let wagesMetrics = $derived.by(() => {
        if (!data.ok || data.country.wealthReports.length === 0) return null;
        const reports = data.country.wealthReports;
        const totalPaid = reports.reduce((s, r) => s + r.wagesPaid, 0);
        const totalEarned = reports.reduce((s, r) => s + r.wagesEarned, 0);
        return { totalPaid, totalEarned };
    });

    // --- Tax flows (14d) aggregated daily ---
    let taxDailyPoints = $derived.by(() => {
        if (!data.ok) return [];
        const byDay = new Map<string, number>();
        for (const tf of data.country.taxFlows) {
            const day = tf.hourStart.slice(0, 10);
            byDay.set(day, (byDay.get(day) ?? 0) + tf.totalTax);
        }
        return [...byDay.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, value]) => ({
                label: shortDate(day + "T00:00:00Z"),
                value,
            }));
    });

    let taxSourcesAggregated = $derived.by(() => {
        if (!data.ok) return [];
        const map = new Map<
            string,
            {
                country: { id: string; name: string; code: string };
                total: number;
                hijacked: number;
                foreignTaxRedirected: number;
            }
        >();
        for (const tf of data.country.taxFlows) {
            for (const src of tf.sources) {
                const key = src.country.id;
                const existing = map.get(key);
                if (existing) {
                    existing.total += src.total;
                    existing.hijacked += src.hijacked;
                    existing.foreignTaxRedirected += src.foreignTaxRedirected;
                } else {
                    map.set(key, {
                        country: src.country,
                        total: src.total,
                        hijacked: src.hijacked,
                        foreignTaxRedirected: src.foreignTaxRedirected,
                    });
                }
            }
        }
        return [...map.values()].sort((a, b) => b.total - a.total);
    });

    let taxSummary = $derived.by(() => {
        if (!data.ok) return null;
        let hijackedIn = 0,
            hijackedOut = 0,
            foreignIn = 0,
            foreignOut = 0;
        for (const tf of data.country.taxFlows) {
            hijackedIn += tf.hijackedIn;
            hijackedOut += tf.hijackedOut;
            foreignIn += tf.foreignTaxIn;
            foreignOut += tf.foreignTaxOut;
        }
        return { hijackedIn, hijackedOut, foreignIn, foreignOut };
    });

    // --- Money flows (14d) aggregated ---
    let flowTotals = $derived.by(() => {
        if (!data.ok) return null;
        const flows = data.country.moneyFlows;
        const sum = (fn: (f: (typeof flows)[0]) => number) =>
            flows.reduce((s, f) => s + fn(f), 0);
        return {
            inEquipment: sum((f) => f.inEquipment),
            outEquipment: sum((f) => f.outEquipment),
            inItems: sum((f) => f.inItems),
            outItems: sum((f) => f.outItems),
            inWages: sum((f) => f.inWages),
            outWages: sum((f) => f.outWages),
            inEquipmentDomestic: sum((f) => f.inEquipmentDomestic),
            outEquipmentDomestic: sum((f) => f.outEquipmentDomestic),
            inEquipmentCrossBorder: sum((f) => f.inEquipmentCrossBorder),
            outEquipmentCrossBorder: sum((f) => f.outEquipmentCrossBorder),
            inItemsDomestic: sum((f) => f.inItemsDomestic),
            outItemsDomestic: sum((f) => f.outItemsDomestic),
            inItemsCrossBorder: sum((f) => f.inItemsCrossBorder),
            outItemsCrossBorder: sum((f) => f.outItemsCrossBorder),
            inWagesDomestic: sum((f) => f.inWagesDomestic),
            outWagesDomestic: sum((f) => f.outWagesDomestic),
            inWagesCrossBorder: sum((f) => f.inWagesCrossBorder),
            outWagesCrossBorder: sum((f) => f.outWagesCrossBorder),
        };
    });

    let tradingPartners = $derived.by(() => {
        if (!data.ok) return [];
        const map = new Map<
            string,
            {
                country: { id: string; name: string; code: string };
                totalIn: number;
                totalOut: number;
            }
        >();
        for (const mf of data.country.moneyFlows) {
            for (const cp of mf.counterparts) {
                const key = cp.country.id;
                const existing = map.get(key);
                const inTotal = cp.inEquipment + cp.inItems + cp.inWages;
                const outTotal = cp.outEquipment + cp.outItems + cp.outWages;
                if (existing) {
                    existing.totalIn += inTotal;
                    existing.totalOut += outTotal;
                } else {
                    map.set(key, {
                        country: cp.country,
                        totalIn: inTotal,
                        totalOut: outTotal,
                    });
                }
            }
        }
        return [...map.values()]
            .sort((a, b) => b.totalIn + b.totalOut - (a.totalIn + a.totalOut))
            .slice(0, 15);
    });

    let expandedFlowDays = $state(new Set<string>());

    function toggleFlowDay(day: string) {
        const next = new Set(expandedFlowDays);
        if (next.has(day)) next.delete(day);
        else next.add(day);
        expandedFlowDays = next;
    }

    // --- Inventory with unrealized P/L ---
    let inventoryRows = $derived.by(() => {
        if (!data.ok || !data.country.inventory) return [];
        return data.country.inventory.lots
            .filter((g) => g.lots.length > 0)
            .map((g) => {
                const totalQty = g.lots.reduce((s, l) => s + l.quantity, 0);
                const totalCost = g.lots.reduce(
                    (s, l) => s + l.quantity * l.unitPrice,
                    0,
                );
                const avgBuy = totalQty > 0 ? totalCost / totalQty : 0;
                const currentPrice = data.currentPrices[g.itemCode] ?? null;
                const unrealizedPL =
                    currentPrice !== null
                        ? (currentPrice - avgBuy) * totalQty
                        : null;
                return {
                    itemCode: g.itemCode,
                    totalQty,
                    totalCost,
                    avgBuy,
                    currentPrice,
                    unrealizedPL,
                };
            });
    });

    // --- Grouped flip events (consecutive same itemCode) ---
    let groupedFlipEvents = $derived.by(() => {
        if (!data.ok) return [];
        const events = data.country.flipEvents;
        if (events.length === 0) return [];
        const groups: {
            itemCode: string;
            quantity: number;
            buyCost: number;
            sellRevenue: number;
            profit: number;
            firstAt: string;
            lastAt: string;
            count: number;
        }[] = [];
        let current = {
            itemCode: events[0].itemCode,
            quantity: events[0].quantity,
            buyCost: events[0].buyCost,
            sellRevenue: events[0].sellRevenue,
            profit: events[0].profit,
            firstAt: events[0].at,
            lastAt: events[0].at,
            count: 1,
        };
        for (let i = 1; i < events.length; i++) {
            const e = events[i];
            if (e.itemCode === current.itemCode) {
                current.quantity += e.quantity;
                current.buyCost += e.buyCost;
                current.sellRevenue += e.sellRevenue;
                current.profit += e.profit;
                current.lastAt = e.at;
                current.count++;
            } else {
                groups.push(current);
                current = {
                    itemCode: e.itemCode,
                    quantity: e.quantity,
                    buyCost: e.buyCost,
                    sellRevenue: e.sellRevenue,
                    profit: e.profit,
                    firstAt: e.at,
                    lastAt: e.at,
                    count: 1,
                };
            }
        }
        groups.push(current);
        return groups;
    });

    // --- Order changes: filter to "added" orders, show last 10 ---
    let orderBattles = $derived.by(() => {
        if (!data.ok) return [];
        return data.country.orderChanges
            .filter((oc) => oc.action === "added")
            .slice(0, 10)
            .map((oc) => {
                const totalDamage = oc.battle.damageReports.reduce(
                    (s, r) => s + r.damage,
                    0,
                );
                const side = oc.battle.damageReports[0]?.side ?? oc.side ?? "?";
                return { ...oc, totalDamage, dmgSide: side };
            });
    });

    // --- Utils ---
    function shortDate(iso: string): string {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        });
    }

    function shortDateTime(iso: string): string {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
        });
    }

    const ETHICS_AXES = [
        "militarism",
        "isolationism",
        "imperialism",
        "industrialism",
    ] as const;
</script>

<svelte:head>
    <title
        >{data.ok
            ? `${data.country.name} — War Era Stats`
            : "Country — War Era Stats"}</title
    >
</svelte:head>

<Wrapper>
    {#if !data.ok}
        <div class="error-page">
            <h1>Country not found</h1>
            <p>{data.error}</p>
        </div>
    {:else}
        {@const c = data.country}

        <!-- HEADER -->
        <header class="country-header">
            <div class="header-main">
                <CountryFlag code={c.code} height="48px" />
                <div class="header-info">
                    <h1>{c.name}</h1>
                    <div class="header-badges">
                        <span class="badge"
                            >{c.userCount.toLocaleString()} citizens</span
                        >
                        {#if c.specialisation}
                            <span class="badge spec"
                                >{getItemName(c.specialisation)}</span
                            >
                        {/if}
                        {#if c.alliance}
                            <span class="badge alliance"
                                >{c.alliance.name || "Alliance"}</span
                            >
                        {/if}
                    </div>
                </div>
                <div class="header-treasury">
                    <span class="treasury-label">Treasury</span>
                    <span class="treasury-value">
                        <Coin width="16px" height="16px" />
                        {formatMoney(c.money, 2)}
                    </span>
                </div>
            </div>
            {#if c.rulingParty}
                <a href="/party/{c.rulingParty.id}" class="ruling-party-chip">
                    <UserAvatar
                        src={c.rulingParty.avatarUrl}
                        alt={c.rulingParty.name}
                        width="20px"
                        height="20px"
                    />
                    <span>Ruling: {c.rulingParty.name}</span>
                </a>
            {/if}
        </header>

        <!-- KEY METRICS -->
        <div class="metrics-row">
            {#if c.wealthReports.length > 0}
                {@const latest = c.wealthReports[c.wealthReports.length - 1]}
                <div class="metric-card">
                    <span class="metric-label">Total Wealth</span>
                    <span class="metric-value">
                        <Coin width="14px" height="14px" />
                        {formatCompactNumber(latest.totalWealth)}
                    </span>
                </div>
                <div class="metric-card">
                    <span class="metric-label">Active Members</span>
                    <span class="metric-value"
                        >{latest.memberCount.toLocaleString()}</span
                    >
                </div>
                <div class="metric-card">
                    <span class="metric-label">Wealth / Citizen</span>
                    <span class="metric-value">
                        <Coin width="14px" height="14px" />
                        {formatCompactNumber(
                            latest.totalWealth / (latest.memberCount || 1),
                        )}
                    </span>
                </div>
            {/if}
            <div class="metric-card">
                <span class="metric-label">Citizens</span>
                <span class="metric-value">{c.userCount.toLocaleString()}</span>
            </div>
            {#if damageMetrics}
                <div class="metric-card">
                    <span class="metric-label">Total Damage (60d)</span>
                    <span class="metric-value"
                        >{formatCompactNumber(damageMetrics.totalDamage)}</span
                    >
                </div>
            {/if}
        </div>

        <!-- POLITICAL & ETHICS -->
        <Card title="Political & Ethics">
            {#if c.rulingParty}
                <div class="ruling-party-section">
                    <a href="/party/{c.rulingParty.id}" class="party-link">
                        <UserAvatar
                            src={c.rulingParty.avatarUrl}
                            alt={c.rulingParty.name}
                            width="36px"
                            height="36px"
                        />
                        <span>{c.rulingParty.name}</span>
                    </a>
                </div>

                <div class="ethics-grid">
                    {#each ETHICS_AXES as axis}
                        {@const value = c.rulingParty.ethics[axis]}
                        {@const label = getEthicsLabel(axis, value)}
                        <div class="ethics-row">
                            <span class="ethics-axis">{axis}</span>
                            <div class="ethics-bar-wrap">
                                <span class="ethics-pole left"
                                    >{getEthicsLabel(axis, -2).replace(
                                        "Fanatic ",
                                        "",
                                    )}</span
                                >
                                <div class="ethics-bar">
                                    <div
                                        class="ethics-marker"
                                        style="left: {((value + 2) / 4) * 100}%"
                                    ></div>
                                    <div class="ethics-center"></div>
                                </div>
                                <span class="ethics-pole right"
                                    >{getEthicsLabel(axis, 2).replace(
                                        "Fanatic ",
                                        "",
                                    )}</span
                                >
                            </div>
                            <span class="ethics-label">{label}</span>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="muted">No ruling party</p>
            {/if}

            {#if c.rulingPartyHistory.length > 0}
                <h4 class="subsection-title">Ruling Party History</h4>
                <div class="history-timeline">
                    {#each c.rulingPartyHistory as entry}
                        <div class="timeline-entry">
                            <span class="timeline-date"
                                >{shortDate(entry.at)}</span
                            >
                            <a
                                href="/party/{entry.party.id}"
                                class="timeline-link"
                            >
                                <UserAvatar
                                    src={entry.party.avatarUrl}
                                    alt={entry.party.name}
                                    width="18px"
                                    height="18px"
                                />
                                {entry.party.name}
                            </a>
                        </div>
                    {/each}
                </div>
            {/if}
        </Card>

        <!-- ALLIANCE -->
        {#if c.alliance}
            <Card title="Alliance — {c.alliance.name || 'Unknown'}">
                <div class="alliance-grid">
                    {#each c.alliance.countries as member}
                        <a
                            href="/country/{member.id}"
                            class="alliance-member"
                            class:current={member.code === c.code}
                        >
                            <CountryFlag code={member.code} height="24px" />
                            <span class="member-name">{member.name}</span>
                            <span class="member-count"
                                >{member.userCount ?? ""}</span
                            >
                        </a>
                    {/each}
                </div>
            </Card>
        {/if}

        <!-- TAXES & TAX FLOWS -->
        <Card title="Taxes & Tax Flows (14d)">
            <div class="tax-rates">
                <div class="tax-badge">
                    <span class="tax-type">Income</span>
                    <span class="tax-pct">{c.taxes.income}%</span>
                </div>
                <div class="tax-badge">
                    <span class="tax-type">Market</span>
                    <span class="tax-pct">{c.taxes.market}%</span>
                </div>
                <div class="tax-badge">
                    <span class="tax-type">Self-Work</span>
                    <span class="tax-pct">{c.taxes.selfWork}%</span>
                </div>
            </div>

            {#if taxDailyPoints.length > 0}
                <h4 class="subsection-title">Daily Tax Income</h4>
                <TimeSeriesChart
                    points={taxDailyPoints}
                    color="#4af0c0"
                    formatY={(v) => Math.round(v).toLocaleString()}
                />
            {/if}

            {#if taxSummary}
                <div class="tax-summary">
                    {#if taxSummary.hijackedIn > 0 || taxSummary.hijackedOut > 0}
                        <div class="tax-summary-row">
                            <span class="muted">Hijacked In:</span>
                            <span class="positive"
                                ><Coin width="12px" height="12px" />
                                {formatMoney(taxSummary.hijackedIn, 2)}</span
                            >
                            <span class="muted">Hijacked Out:</span>
                            <span class="negative"
                                ><Coin width="12px" height="12px" />
                                {formatMoney(taxSummary.hijackedOut, 2)}</span
                            >
                        </div>
                    {/if}
                    {#if taxSummary.foreignIn > 0 || taxSummary.foreignOut > 0}
                        <div class="tax-summary-row">
                            <span class="muted">Foreign Tax In:</span>
                            <span class="positive"
                                ><Coin width="12px" height="12px" />
                                {formatMoney(taxSummary.foreignIn, 2)}</span
                            >
                            <span class="muted">Foreign Tax Out:</span>
                            <span class="negative"
                                ><Coin width="12px" height="12px" />
                                {formatMoney(taxSummary.foreignOut, 2)}</span
                            >
                        </div>
                    {/if}
                </div>
            {/if}

            {#if taxSourcesAggregated.length > 0}
                <h4 class="subsection-title">Tax Sources by Country</h4>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Country</th>
                                <th>Total Tax</th>
                                <th>Foreign Redirected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each taxSourcesAggregated.slice(0, 10) as src}
                                <tr>
                                    <td class="country-cell">
                                        <CountryFlag
                                            code={src.country.code}
                                            height="14px"
                                        />
                                        {src.country.name}
                                    </td>
                                    <td
                                        ><Coin width="12px" height="12px" />
                                        {formatMoney(src.total, 2)}</td
                                    >
                                    <td
                                        ><Coin width="12px" height="12px" />
                                        {formatMoney(
                                            src.foreignTaxRedirected,
                                            2,
                                        )}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </Card>

        <!-- WEALTH & MILITARY POWER (60d) -->
        <Card title="Wealth & Military Power (60d)">
            {#if wealthChartPoints.length > 0}
                <h4 class="subsection-title">Wealth Over Time</h4>
                <TimeSeriesChart
                    points={wealthChartPoints}
                    color="#4af0c0"
                    formatY={(v) => formatCompactNumber(v)}
                />
            {/if}

            {#if damageMetrics}
                <h4 class="subsection-title">Damage Capacity</h4>
                <div class="damage-grid">
                    <div class="dmg-card">
                        <span class="dmg-label">Total (60d)</span>
                        <span class="dmg-value"
                            >{formatCompactNumber(
                                damageMetrics.totalDamage,
                            )}</span
                        >
                    </div>
                    <div class="dmg-card">
                        <span class="dmg-label">Avg Daily</span>
                        <span class="dmg-value"
                            >{formatCompactNumber(damageMetrics.avgDaily)}</span
                        >
                    </div>
                    <div class="dmg-card">
                        <span class="dmg-label">Peak Daily</span>
                        <span class="dmg-value accent"
                            >{formatCompactNumber(
                                damageMetrics.peakDaily,
                            )}</span
                        >
                    </div>
                    <div class="dmg-card">
                        <span class="dmg-label">Damage / Citizen</span>
                        <span class="dmg-value"
                            >{formatCompactNumber(
                                damageMetrics.damagePerCitizen,
                            )}</span
                        >
                    </div>
                    <div class="dmg-card">
                        <span class="dmg-label">Projected Capacity</span>
                        <span class="dmg-value accent"
                            >{formatCompactNumber(
                                damageMetrics.projected,
                            )}</span
                        >
                    </div>
                </div>
            {/if}

            {#if damageChartPoints.length > 0}
                <h4 class="subsection-title">Daily Damage</h4>
                <TimeSeriesChart
                    points={damageChartPoints}
                    color="#ffb4ab"
                    formatY={(v) => formatCompactNumber(v)}
                />
            {/if}

            {#if wagesMetrics}
                <h4 class="subsection-title">Wages (60d)</h4>
                <div class="wages-row">
                    <div class="wage-item">
                        <span class="muted">Paid</span>
                        <span class="negative"
                            ><Coin width="12px" height="12px" />
                            {formatCompactNumber(wagesMetrics.totalPaid)}</span
                        >
                    </div>
                    <div class="wage-item">
                        <span class="muted">Earned</span>
                        <span class="positive"
                            ><Coin width="12px" height="12px" />
                            {formatCompactNumber(
                                wagesMetrics.totalEarned,
                            )}</span
                        >
                    </div>
                </div>
            {/if}
        </Card>

        <!-- MONEY FLOWS / TRADE (14d) -->
        {#if flowTotals}
            <Card title="Money Flows & Trade (14d)">
                <div class="flow-summary">
                    <div class="flow-category">
                        <h5>Equipment</h5>
                        <div class="flow-bars">
                            <span class="positive"
                                >In: <Coin width="12px" height="12px" />
                                {formatCompactNumber(
                                    flowTotals.inEquipment,
                                )}</span
                            >
                            <span class="negative"
                                >Out: <Coin width="12px" height="12px" />
                                {formatCompactNumber(
                                    flowTotals.outEquipment,
                                )}</span
                            >
                        </div>
                        <div class="flow-split">
                            <span class="muted"
                                >Domestic: {formatCompactNumber(
                                    flowTotals.inEquipmentDomestic,
                                )} / {formatCompactNumber(
                                    flowTotals.outEquipmentDomestic,
                                )}</span
                            >
                            <span class="muted"
                                >Cross-border: {formatCompactNumber(
                                    flowTotals.inEquipmentCrossBorder,
                                )} / {formatCompactNumber(
                                    flowTotals.outEquipmentCrossBorder,
                                )}</span
                            >
                        </div>
                    </div>
                    <div class="flow-category">
                        <h5>Items</h5>
                        <div class="flow-bars">
                            <span class="positive"
                                >In: <Coin width="12px" height="12px" />
                                {formatCompactNumber(flowTotals.inItems)}</span
                            >
                            <span class="negative"
                                >Out: <Coin width="12px" height="12px" />
                                {formatCompactNumber(flowTotals.outItems)}</span
                            >
                        </div>
                        <div class="flow-split">
                            <span class="muted"
                                >Domestic: {formatCompactNumber(
                                    flowTotals.inItemsDomestic,
                                )} / {formatCompactNumber(
                                    flowTotals.outItemsDomestic,
                                )}</span
                            >
                            <span class="muted"
                                >Cross-border: {formatCompactNumber(
                                    flowTotals.inItemsCrossBorder,
                                )} / {formatCompactNumber(
                                    flowTotals.outItemsCrossBorder,
                                )}</span
                            >
                        </div>
                    </div>
                    <div class="flow-category">
                        <h5>Wages</h5>
                        <div class="flow-bars">
                            <span class="positive"
                                >In: <Coin width="12px" height="12px" />
                                {formatCompactNumber(flowTotals.inWages)}</span
                            >
                            <span class="negative"
                                >Out: <Coin width="12px" height="12px" />
                                {formatCompactNumber(flowTotals.outWages)}</span
                            >
                        </div>
                        <div class="flow-split">
                            <span class="muted"
                                >Domestic: {formatCompactNumber(
                                    flowTotals.inWagesDomestic,
                                )} / {formatCompactNumber(
                                    flowTotals.outWagesDomestic,
                                )}</span
                            >
                            <span class="muted"
                                >Cross-border: {formatCompactNumber(
                                    flowTotals.inWagesCrossBorder,
                                )} / {formatCompactNumber(
                                    flowTotals.outWagesCrossBorder,
                                )}</span
                            >
                        </div>
                    </div>
                </div>

                {#if tradingPartners.length > 0}
                    <h4 class="subsection-title">Top Trading Partners</h4>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Country</th>
                                    <th>Incoming</th>
                                    <th>Outgoing</th>
                                    <th>Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each tradingPartners as tp}
                                    {@const net = tp.totalIn - tp.totalOut}
                                    <tr>
                                        <td class="country-cell">
                                            <CountryFlag
                                                code={tp.country.code}
                                                height="14px"
                                            />
                                            {tp.country.name}
                                        </td>
                                        <td
                                            ><Coin width="12px" height="12px" />
                                            {formatCompactNumber(
                                                tp.totalIn,
                                            )}</td
                                        >
                                        <td
                                            ><Coin width="12px" height="12px" />
                                            {formatCompactNumber(
                                                tp.totalOut,
                                            )}</td
                                        >
                                        <td
                                            class:positive={net > 0}
                                            class:negative={net < 0}
                                            ><Coin width="12px" height="12px" />
                                            {net > 0
                                                ? "+"
                                                : ""}{formatCompactNumber(
                                                net,
                                            )}</td
                                        >
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}

                <!-- Stacked bar chart: daily money flows -->
                {#if data.country.moneyFlows.length > 0}
                    <h4 class="subsection-title">Daily Breakdown</h4>
                    {@const maxFlow = Math.max(
                        ...data.country.moneyFlows.flatMap((mf) => [
                            mf.inEquipment + mf.inItems + mf.inWages,
                            mf.outEquipment + mf.outItems + mf.outWages,
                        ]),
                        1,
                    )}
                    <div class="flow-chart">
                        {#each data.country.moneyFlows as mf}
                            {@const dayKey = mf.dayStart}
                            {@const isExpanded = expandedFlowDays.has(dayKey)}
                            {@const totalIn =
                                mf.inEquipment + mf.inItems + mf.inWages}
                            {@const totalOut =
                                mf.outEquipment + mf.outItems + mf.outWages}
                            <div class="flow-day">
                                <button
                                    class="flow-day-bars"
                                    onclick={() => toggleFlowDay(dayKey)}
                                    title="In: {formatCompactNumber(
                                        totalIn,
                                    )} / Out: {formatCompactNumber(totalOut)}"
                                >
                                    <div class="bar-pair">
                                        <!-- In bar -->
                                        <div
                                            class="stacked-bar in-bar"
                                            style="height: {(totalIn /
                                                maxFlow) *
                                                100}%"
                                        >
                                            {#if mf.inWages > 0}
                                                <div
                                                    class="seg wages"
                                                    style="height: {(mf.inWages /
                                                        totalIn) *
                                                        100}%"
                                                ></div>
                                            {/if}
                                            {#if mf.inItems > 0}
                                                <div
                                                    class="seg items"
                                                    style="height: {(mf.inItems /
                                                        totalIn) *
                                                        100}%"
                                                ></div>
                                            {/if}
                                            {#if mf.inEquipment > 0}
                                                <div
                                                    class="seg equipment"
                                                    style="height: {(mf.inEquipment /
                                                        totalIn) *
                                                        100}%"
                                                ></div>
                                            {/if}
                                        </div>
                                        <!-- Out bar -->
                                        <div
                                            class="stacked-bar out-bar"
                                            style="height: {(totalOut /
                                                maxFlow) *
                                                100}%"
                                        >
                                            {#if mf.outWages > 0}
                                                <div
                                                    class="seg wages"
                                                    style="height: {(mf.outWages /
                                                        totalOut) *
                                                        100}%"
                                                ></div>
                                            {/if}
                                            {#if mf.outItems > 0}
                                                <div
                                                    class="seg items"
                                                    style="height: {(mf.outItems /
                                                        totalOut) *
                                                        100}%"
                                                ></div>
                                            {/if}
                                            {#if mf.outEquipment > 0}
                                                <div
                                                    class="seg equipment"
                                                    style="height: {(mf.outEquipment /
                                                        totalOut) *
                                                        100}%"
                                                ></div>
                                            {/if}
                                        </div>
                                    </div>
                                    <span class="flow-day-label"
                                        >{shortDate(mf.dayStart)}</span
                                    >
                                </button>
                                {#if isExpanded}
                                    <div class="day-detail">
                                        <div class="day-detail-grid">
                                            <div>
                                                <span class="muted"
                                                    >Equipment In/Out:</span
                                                >
                                                {formatMoney(mf.inEquipment, 2)} /
                                                {formatMoney(
                                                    mf.outEquipment,
                                                    2,
                                                )}
                                            </div>
                                            <div>
                                                <span class="muted"
                                                    >Items In/Out:</span
                                                >
                                                {formatMoney(mf.inItems, 2)} / {formatMoney(
                                                    mf.outItems,
                                                    2,
                                                )}
                                            </div>
                                            <div>
                                                <span class="muted"
                                                    >Wages In/Out:</span
                                                >
                                                {formatMoney(mf.inWages, 2)} / {formatMoney(
                                                    mf.outWages,
                                                    2,
                                                )}
                                            </div>
                                            <div>
                                                <span class="muted"
                                                    >Domestic:</span
                                                >
                                                {formatMoney(
                                                    mf.inEquipmentDomestic +
                                                        mf.inItemsDomestic +
                                                        mf.inWagesDomestic,
                                                    2,
                                                )} /
                                                {formatMoney(
                                                    mf.outEquipmentDomestic +
                                                        mf.outItemsDomestic +
                                                        mf.outWagesDomestic,
                                                    2,
                                                )}
                                            </div>
                                            <div>
                                                <span class="muted"
                                                    >Cross-border:</span
                                                >
                                                {formatMoney(
                                                    mf.inEquipmentCrossBorder +
                                                        mf.inItemsCrossBorder +
                                                        mf.inWagesCrossBorder,
                                                    2,
                                                )} /
                                                {formatMoney(
                                                    mf.outEquipmentCrossBorder +
                                                        mf.outItemsCrossBorder +
                                                        mf.outWagesCrossBorder,
                                                    2,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                    <div class="flow-legend">
                        <span class="legend-item"
                            ><span class="legend-dot equipment"></span> Equipment</span
                        >
                        <span class="legend-item"
                            ><span class="legend-dot items"></span> Items</span
                        >
                        <span class="legend-item"
                            ><span class="legend-dot wages"></span> Wages</span
                        >
                        <span class="legend-sep">|</span>
                        <span class="legend-item">Left = In, Right = Out</span>
                    </div>
                {/if}
            </Card>
        {/if}

        <!-- MARKET OPERATIONS -->
        {#if c.flipState}
            <Card title="Market Operations">
                <div class="flip-stats">
                    <div class="metric-card">
                        <span class="metric-label">Total Trades</span>
                        <span class="metric-value"
                            >{c.flipState.totalTrades.toLocaleString()}</span
                        >
                    </div>
                    <div class="metric-card">
                        <span class="metric-label">Profitable</span>
                        <span class="metric-value"
                            >{c.flipState.profitable.toLocaleString()}</span
                        >
                    </div>
                    <div class="metric-card">
                        <span class="metric-label">Total Profit</span>
                        <span
                            class="metric-value"
                            class:positive={c.flipState.totalProfit > 0}
                            class:negative={c.flipState.totalProfit < 0}
                        >
                            <Coin width="14px" height="14px" />
                            {formatMoney(c.flipState.totalProfit, 2)}
                        </span>
                    </div>
                </div>

                {#if inventoryRows.length > 0}
                    <h4 class="subsection-title">Inventory Holdings</h4>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Avg Buy</th>
                                    <th>Current</th>
                                    <th>Cost</th>
                                    <th>Unrealized P/L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each inventoryRows as row}
                                    <tr>
                                        <td class="item-cell">
                                            <ItemImage
                                                itemCode={row.itemCode}
                                                size={20}
                                            />
                                            {getItemName(row.itemCode)}
                                        </td>
                                        <td>{row.totalQty.toLocaleString()}</td>
                                        <td
                                            ><Coin width="12px" height="12px" />
                                            {formatMoney(row.avgBuy)}</td
                                        >
                                        <td>
                                            {#if row.currentPrice !== null}
                                                <Coin
                                                    width="12px"
                                                    height="12px"
                                                />
                                                {formatMoney(row.currentPrice)}
                                            {:else}
                                                <span class="muted">—</span>
                                            {/if}
                                        </td>
                                        <td
                                            ><Coin width="12px" height="12px" />
                                            {formatMoney(row.totalCost, 2)}</td
                                        >
                                        <td
                                            class:positive={row.unrealizedPL !==
                                                null && row.unrealizedPL > 0}
                                            class:negative={row.unrealizedPL !==
                                                null && row.unrealizedPL < 0}
                                        >
                                            {#if row.unrealizedPL !== null}
                                                <Coin
                                                    width="12px"
                                                    height="12px"
                                                />
                                                {row.unrealizedPL > 0
                                                    ? "+"
                                                    : ""}{formatMoney(
                                                    row.unrealizedPL,
                                                    2,
                                                )}
                                            {:else}
                                                <span class="muted">—</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}

                {#if groupedFlipEvents.length > 0}
                    <h4 class="subsection-title">Recent Flip Events (14d)</h4>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Buy Cost</th>
                                    <th>Sell Revenue</th>
                                    <th>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each groupedFlipEvents as g}
                                    <tr>
                                        <td class="muted">
                                            {shortDateTime(
                                                g.firstAt,
                                            )}{#if g.count > 1}
                                                <span class="group-count"
                                                    >×{g.count}</span
                                                >
                                            {/if}
                                        </td>
                                        <td class="item-cell">
                                            <ItemImage
                                                itemCode={g.itemCode}
                                                size={18}
                                            />
                                            {getItemName(g.itemCode)}
                                        </td>
                                        <td>{g.quantity.toLocaleString()}</td>
                                        <td
                                            ><Coin width="12px" height="12px" />
                                            {formatMoney(g.buyCost, 2)}</td
                                        >
                                        <td
                                            ><Coin width="12px" height="12px" />
                                            {formatMoney(g.sellRevenue, 2)}</td
                                        >
                                        <td
                                            class:positive={g.profit > 0}
                                            class:negative={g.profit < 0}
                                        >
                                            <Coin width="12px" height="12px" />
                                            {g.profit > 0
                                                ? "+"
                                                : ""}{formatMoney(g.profit, 2)}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </Card>
        {/if}

        <!-- RECENT MILITARY ORDERS -->
        {#if orderBattles.length > 0}
            <Card title="Recent Military Orders">
                <div class="orders-list">
                    {#each orderBattles as ob}
                        <div class="order-entry">
                            <div class="order-header">
                                <a
                                    href="/battle/{ob.battle.id}"
                                    class="battle-link"
                                >
                                    {#if ob.battle.defenderRegion}
                                        {ob.battle.defenderRegion.name}
                                    {:else}
                                        Battle
                                    {/if}
                                </a>
                                {#if ob.battle.isActive}
                                    <span class="badge active">Active</span>
                                {/if}
                                {#if ob.at}
                                    <span class="muted order-date"
                                        >{shortDateTime(ob.at)}</span
                                    >
                                {/if}
                            </div>
                            <div class="order-battle-info">
                                {#if ob.battle.attackerCountry}
                                    <span class="battle-side">
                                        <CountryFlag
                                            code={ob.battle.attackerCountry
                                                .code}
                                            height="14px"
                                        />
                                        {ob.battle.attackerCountry.name}
                                    </span>
                                {/if}
                                <span class="vs">vs</span>
                                {#if ob.battle.defenderCountry}
                                    <span class="battle-side">
                                        <CountryFlag
                                            code={ob.battle.defenderCountry
                                                .code}
                                            height="14px"
                                        />
                                        {ob.battle.defenderCountry.name}
                                    </span>
                                {/if}
                            </div>
                            <div class="order-meta">
                                {#if ob.side}
                                    <span class="badge side">{ob.dmgSide}</span>
                                {/if}
                                {#if ob.kind}
                                    <span class="muted">{ob.kind}</span>
                                {/if}
                                {#if ob.action}
                                    <span class="muted">{ob.action}</span>
                                {/if}
                                {#if ob.totalDamage > 0}
                                    <span class="dmg-contrib"
                                        >{formatCompactNumber(ob.totalDamage)} dmg</span
                                    >
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </Card>
        {/if}
    {/if}
</Wrapper>

<style lang="scss">
    .error-page {
        text-align: center;
        padding: 64px 24px;

        h1 {
            color: #fff;
            margin-bottom: 8px;
        }

        p {
            color: #8c909f;
        }
    }

    /* HEADER */
    .country-header {
        padding: 32px 0 16px;
    }

    .header-main {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }

    .header-info {
        flex: 1;
        min-width: 0;

        h1 {
            color: #fff;
            font-size: 28px;
            margin: 0 0 4px;
        }
    }

    .header-badges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .badge {
        background: #2a2a2a;
        border: 1px solid #353535;
        color: #c2c6d6;
        font-size: 12px;
        padding: 3px 10px;
        border-radius: 12px;

        &.spec {
            color: #4af0c0;
            border-color: #4af0c044;
        }

        &.alliance {
            color: #7eb8ff;
            border-color: #7eb8ff44;
        }

        &.active {
            color: #4af0c0;
            border-color: #4af0c044;
            font-size: 11px;
        }

        &.side {
            font-size: 11px;
            text-transform: uppercase;
        }
    }

    .header-treasury {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .treasury-label {
        color: #8c909f;
        font-size: 11px;
        text-transform: uppercase;
    }

    .treasury-value {
        color: #fff;
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .ruling-party-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 6px 14px;
        background: #2a2a2a;
        border: 1px solid #353535;
        border-radius: 20px;
        color: #c2c6d6;
        font-size: 13px;
        text-decoration: none;

        &:hover {
            border-color: #4af0c0;
        }
    }

    /* METRICS ROW */
    .metrics-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
    }

    .metric-card {
        background: #262626;
        border: 1px solid #353535;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .metric-label {
        color: #8c909f;
        font-size: 11px;
        text-transform: uppercase;
    }

    .metric-value {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* POLITICAL & ETHICS */
    .ruling-party-section {
        margin-bottom: 20px;
    }

    .party-link {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: #c2c6d6;
        text-decoration: none;
        font-size: 15px;

        &:hover {
            color: #4af0c0;
        }
    }

    .ethics-grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-bottom: 20px;
    }

    .ethics-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .ethics-axis {
        color: #8c909f;
        font-size: 11px;
        text-transform: capitalize;
        width: 90px;
        flex-shrink: 0;
    }

    .ethics-bar-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 200px;
    }

    .ethics-pole {
        color: #8c909f;
        font-size: 10px;
        width: 80px;
        flex-shrink: 0;

        &.left {
            text-align: right;
        }

        &.right {
            text-align: left;
        }
    }

    .ethics-bar {
        flex: 1;
        height: 6px;
        background: #353535;
        border-radius: 3px;
        position: relative;
    }

    .ethics-center {
        position: absolute;
        left: 50%;
        top: -2px;
        width: 1px;
        height: 10px;
        background: #555;
    }

    .ethics-marker {
        position: absolute;
        top: -4px;
        width: 14px;
        height: 14px;
        background: #4af0c0;
        border-radius: 50%;
        transform: translateX(-50%);
        border: 2px solid #1f1f1f;
    }

    .ethics-label {
        color: #4af0c0;
        font-size: 12px;
        font-weight: 500;
        width: 130px;
        flex-shrink: 0;
    }

    .subsection-title {
        color: #c2c6d6;
        font-size: 14px;
        margin: 20px 0 10px;
        font-weight: 600;
    }

    .history-timeline {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .timeline-entry {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .timeline-date {
        color: #8c909f;
        font-size: 12px;
        width: 70px;
        flex-shrink: 0;
    }

    .timeline-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #c2c6d6;
        text-decoration: none;
        font-size: 13px;

        &:hover {
            color: #4af0c0;
        }
    }

    /* ALLIANCE */
    .alliance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 10px;
    }

    .alliance-member {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #1f1f1f;
        border: 1px solid #353535;
        border-radius: 6px;
        text-decoration: none;
        color: #c2c6d6;
        font-size: 13px;

        &:hover {
            border-color: #4af0c0;
        }

        &.current {
            border-color: #4af0c066;
            background: #4af0c00a;
        }
    }

    .member-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .member-count {
        color: #8c909f;
        font-size: 11px;
    }

    /* TAXES */
    .tax-rates {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }

    .tax-badge {
        background: #1f1f1f;
        border: 1px solid #353535;
        padding: 10px 16px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 80px;
    }

    .tax-type {
        color: #8c909f;
        font-size: 11px;
        text-transform: uppercase;
    }

    .tax-pct {
        color: #fff;
        font-size: 20px;
        font-weight: 700;
    }

    .tax-summary {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .tax-summary-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        align-items: center;
        font-size: 13px;
    }

    /* TABLES */
    .table-wrap {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }

    th {
        text-align: left;
        color: #8c909f;
        font-size: 11px;
        text-transform: uppercase;
        padding: 8px 10px;
        border-bottom: 1px solid #353535;
    }

    td {
        padding: 8px 10px;
        color: #c2c6d6;
        border-bottom: 1px solid #2a2a2a;
        white-space: nowrap;
    }

    .country-cell {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .item-cell {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .group-count {
        color: #8c909f;
        font-size: 10px;
        margin-left: 4px;
    }

    .inline-flex {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    /* DAMAGE */
    .damage-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
    }

    .dmg-card {
        background: #1f1f1f;
        border: 1px solid #353535;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .dmg-label {
        color: #8c909f;
        font-size: 11px;
        text-transform: uppercase;
    }

    .dmg-value {
        color: #c2c6d6;
        font-size: 16px;
        font-weight: 600;

        &.accent {
            color: #4af0c0;
        }
    }

    /* WAGES */
    .wages-row {
        display: flex;
        gap: 24px;
    }

    .wage-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
    }

    /* FLOWS */
    .flow-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
    }

    .flow-category {
        background: #1f1f1f;
        border: 1px solid #353535;
        padding: 14px;

        h5 {
            color: #fff;
            margin: 0 0 8px;
            font-size: 13px;
        }
    }

    .flow-bars {
        display: flex;
        gap: 16px;
        font-size: 13px;
        margin-bottom: 6px;
    }

    .flow-split {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 11px;
    }

    /* FLOW CHART */
    .flow-chart {
        display: flex;
        gap: 4px;
        align-items: flex-end;
        height: 180px;
        width: 100%;
    }

    .flow-day {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 0;
        height: 100%;
    }

    .flow-day-bars {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 2px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;

        &:hover .stacked-bar {
            opacity: 0.8;
        }
    }

    .bar-pair {
        display: flex;
        gap: 2px;
        align-items: flex-end;
        width: 100%;
        height: 100%;
    }

    .stacked-bar {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        min-height: 2px;
        border-radius: 2px 2px 0 0;
        overflow: hidden;
    }

    .seg {
        width: 100%;

        &.equipment {
            background: #7eb8ff;
        }

        &.items {
            background: #4af0c0;
        }

        &.wages {
            background: #c4a0ff;
        }
    }

    .flow-day-label {
        font-size: 9px;
        color: #8c909f;
        margin-top: 4px;
        white-space: nowrap;
    }

    .flow-legend {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 10px;
        font-size: 11px;
        color: #8c909f;
    }

    .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;

        &.equipment {
            background: #7eb8ff;
        }

        &.items {
            background: #4af0c0;
        }

        &.wages {
            background: #c4a0ff;
        }
    }

    .legend-sep {
        color: #353535;
    }

    .day-detail {
        width: 100%;
        padding: 8px 6px;
        background: #171717;
        border: 1px solid #2a2a2a;
        margin-top: 4px;
        font-size: 11px;
    }

    .day-detail-grid {
        display: flex;
        flex-direction: column;
        gap: 4px;
        color: #c2c6d6;
    }

    /* FLIP STATS */
    .flip-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
    }

    /* ORDERS */
    .orders-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .order-entry {
        background: #1f1f1f;
        border: 1px solid #353535;
        padding: 12px 16px;
        border-radius: 4px;
    }

    .order-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
    }

    .battle-link {
        color: #4af0c0;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;

        &:hover {
            text-decoration: underline;
        }
    }

    .order-date {
        font-size: 12px;
        margin-left: auto;
    }

    .order-battle-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 13px;
    }

    .battle-side {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #c2c6d6;
    }

    .vs {
        color: #8c909f;
        font-size: 11px;
    }

    .order-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
    }

    .dmg-contrib {
        color: #ffb4ab;
        font-weight: 600;
    }

    /* UTILITY */
    .muted {
        color: #8c909f;
    }

    .positive {
        color: #4af0c0;
    }

    .negative {
        color: #ffb4ab;
    }
</style>
