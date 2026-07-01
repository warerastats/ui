<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import CountryFlag from "$lib/components/CountryFlag.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import {
        aggregateEquipmentUsed,
        calculateCostPerDamage,
        calculateFlipROI,
        calculateSkillPointsSpent,
        formatCompactNumber,
        formatMoney,
    } from "$lib/helpers";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    const HISTORY_TABS = ["names", "countries", "mu", "party", "wages", "skills"] as const;
    type HistoryTab = (typeof HISTORY_TABS)[number];
    let activeHistoryTab = $state<HistoryTab>("names");

    let latestSkillSnapshot = $derived.by(() => {
        if (!data.ok || !data.user) return null;
        return data.user.skillSnapshots?.[0] ?? null;
    });

    let skillAnalysis = $derived.by(() => {
        if (!latestSkillSnapshot) return null;
        return calculateSkillPointsSpent([
            { key: "energy", value: latestSkillSnapshot.set.energy },
            { key: "health", value: latestSkillSnapshot.set.health },
            { key: "hunger", value: latestSkillSnapshot.set.hunger },
            { key: "attack", value: latestSkillSnapshot.set.attack },
            { key: "companies", value: latestSkillSnapshot.set.companies },
            {
                key: "entrepreneurship",
                value: latestSkillSnapshot.set.entrepreneurship,
            },
            { key: "production", value: latestSkillSnapshot.set.production },
            {
                key: "criticalChance",
                value: latestSkillSnapshot.set.criticalChance,
            },
            {
                key: "criticalDamages",
                value: latestSkillSnapshot.set.criticalDamages,
            },
            { key: "armor", value: latestSkillSnapshot.set.armor },
            { key: "precision", value: latestSkillSnapshot.set.precision },
            { key: "dodge", value: latestSkillSnapshot.set.dodge },
            { key: "lootChance", value: latestSkillSnapshot.set.lootChance },
            { key: "management", value: latestSkillSnapshot.set.management },
        ]);
    });

    let wealthTotal = $derived.by(() => {
        if (!data.ok || !data.user) return 0;
        return (data.user.wealth ?? []).reduce((sum, entry) => sum + entry.value, 0);
    });

    let participationPct = $derived.by(() => {
        if (!data.ok || !data.user) return 0;
        const total = data.user.battles?.length ?? 0;
        if (total === 0) return 0;
        return (data.user.battleParticipation.battlesParticipated / total) * 100;
    });

    let costPerDamage = $derived.by(() => {
        if (!data.ok || !data.user) return null;
        return calculateCostPerDamage(data.user.wealth ?? [], data.user.battleParticipation.totalDamage);
    });

    let equipmentUsage = $derived.by(() => {
        if (!data.ok || !data.user) return [];
        return aggregateEquipmentUsed(data.user.battles ?? []);
    });

    let flipProfitPerTrade = $derived.by(() => {
        if (!data.ok || !data.user) return null;
        return calculateFlipROI(data.user.flipState.totalProfit, data.user.flipState.totalFlips);
    });

    let activeOffers = $derived.by(() => {
        if (!data.ok || !data.user) return [];
        return (data.user.tradeOffers ?? []).filter((offer) => !offer.cancelled);
    });

    let fulfilledOffers = $derived.by(() => {
        return activeOffers.filter((offer) => offer.fulfilled === offer.quantity);
    });

    let recentBattles = $derived.by(() => {
        if (!data.ok || !data.user) return [];
        return (data.user.battles ?? []).slice(0, 6);
    });

    function formatDate(iso: string): string {
        return new Date(iso).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
        });
    }

    function formatSkillLabel(key: string): string {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (s) => s.toUpperCase());
    }
</script>

{#if data.ok && data.user}
    <div class="hero">
        <Wrapper>
            <div class="hero-row">
                <div class="identity">
                    {#if data.user.avatarUrl}
                        <img
                            class="avatar"
                            src={data.user.avatarUrl}
                            alt="{data.user.username} avatar"
                        />
                    {/if}

                    <div>
                        <h1>{data.user.username}</h1>
                        <div class="subline">
                            <span>Level {data.user.level}</span>
                            <span>Rank {data.user.militaryRank}</span>
                        </div>
                    </div>
                </div>

                <div class="affiliations">
                    {#if data.user.country}
                        <div class="tag">
                            <CountryFlag code={data.user.country.code} />
                            <span>{data.user.country.name}</span>
                        </div>
                    {/if}
                    {#if data.user.mu}
                        <div class="tag">
                            <span>MU</span>
                            <strong>{data.user.mu.name}</strong>
                        </div>
                    {/if}
                    {#if data.user.party}
                        <div class="tag">
                            <span>Party</span>
                            <strong>{data.user.party.name}</strong>
                        </div>
                    {/if}
                </div>
            </div>
        </Wrapper>
    </div>

    <div class="page-content">
        <Wrapper>
            <div class="stats-grid">
                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Total Damage</p>
                    <p class="value">{formatCompactNumber(data.user.battleParticipation.totalDamage)}</p>
                </Card>

                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Participation</p>
                    <p class="value">{participationPct.toFixed(1)}%</p>
                </Card>

                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Total Wealth</p>
                    <p class="value">{formatMoney(wealthTotal, 0)}</p>
                </Card>

                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Profit Per Flip</p>
                    <p class="value">
                        {#if flipProfitPerTrade !== null}
                            {formatMoney(flipProfitPerTrade, 2)}
                        {:else}
                            N/A
                        {/if}
                    </p>
                </Card>
            </div>

            <div class="grid-two">
                <Card title="Skills & Mode">
                    {#if skillAnalysis}
                        <div class="mode-row">
                            <span class="mode-label">Profile Mode</span>
                            <span class="mode-badge {skillAnalysis.category}">
                                {skillAnalysis.category.toUpperCase()}
                            </span>
                        </div>

                        <div class="split-grid">
                            <div class="split-card">
                                <span>Economic Points</span>
                                <strong>{skillAnalysis.pointsEco}</strong>
                            </div>
                            <div class="split-card">
                                <span>Fighting Points</span>
                                <strong>{skillAnalysis.pointsWar}</strong>
                            </div>
                        </div>

                        <ul class="simple-list">
                            {#each [...skillAnalysis.skills].sort((a, b) => b.points - a.points).slice(0, 8) as skill (skill.key)}
                                <li>
                                    <span>{formatSkillLabel(skill.key)}</span>
                                    <strong>{skill.points}</strong>
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <p class="empty">No skills data.</p>
                    {/if}
                </Card>

                <Card title="Battle Efficiency">
                    <div class="kpi-list">
                        <div>
                            <span>Battles Participated</span>
                            <strong>{data.user.battleParticipation.battlesParticipated}</strong>
                        </div>
                        <div>
                            <span>Negative Damage</span>
                            <strong>{formatCompactNumber(data.user.battleParticipation.negativeDamage)}</strong>
                        </div>
                        <div>
                            <span>Own Country Participation</span>
                            <strong>{data.user.battleParticipation.ownCountryParticipated}/{data.user.battleParticipation.ownCountryBattles}</strong>
                        </div>
                        <div>
                            <span>MU Order Participation</span>
                            <strong>{data.user.battleParticipation.muOrderParticipated}/{data.user.battleParticipation.muOrderBattles}</strong>
                        </div>
                        <div>
                            <span>Cost Per 1 Damage</span>
                            <strong>
                                {#if costPerDamage !== null}
                                    {formatMoney(costPerDamage, 4)}
                                {:else}
                                    N/A
                                {/if}
                            </strong>
                        </div>
                        <div>
                            <span>Last Updated</span>
                            <strong>{formatDate(data.user.battleParticipation.updatedAt)}</strong>
                        </div>
                    </div>
                </Card>
            </div>

            <div class="grid-two">
                <Card title="Recent Battles">
                    {#if recentBattles.length === 0}
                        <p class="empty">No recent battles.</p>
                    {:else}
                        <ul class="simple-list">
                            {#each recentBattles as battle (battle.id)}
                                <li>
                                    <span>
                                        {battle.attackerCountry?.code ?? "?"} vs {battle.defenderCountry?.code ?? "?"}
                                        in {battle.defenderRegion?.name ?? "Unknown"}
                                    </span>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </Card>

                <Card title="Top Equipment Used">
                    {#if equipmentUsage.length === 0}
                        <p class="empty">No equipment usage available.</p>
                    {:else}
                        <ul class="simple-list">
                            {#each equipmentUsage.slice(0, 8) as eq (eq.itemCode)}
                                <li>
                                    <span>{eq.itemName}</span>
                                    <strong>{eq.totalCount} uses</strong>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </Card>
            </div>

            <div class="grid-three">
                <Card title="Inventory">
                    <div class="kpi-list compact">
                        <div>
                            <span>Perfect Items</span>
                            <strong>{data.user.perfectItems?.length ?? 0}</strong>
                        </div>
                        <div>
                            <span>Used Items</span>
                            <strong>{data.user.usedItems?.length ?? 0}</strong>
                        </div>
                        <div>
                            <span>Owned Companies</span>
                            <strong>{data.user.ownedCompanies?.length ?? 0}</strong>
                        </div>
                    </div>
                </Card>

                <Card title="Flips">
                    <div class="kpi-list compact">
                        <div>
                            <span>Total Flips</span>
                            <strong>{data.user.flipState.totalFlips}</strong>
                        </div>
                        <div>
                            <span>Total Profit</span>
                            <strong>{formatMoney(data.user.flipState.totalProfit, 2)}</strong>
                        </div>
                        <div>
                            <span>Recent Events</span>
                            <strong>{data.user.flipEvents?.length ?? 0}</strong>
                        </div>
                    </div>
                </Card>

                <Card title="Trade Offers">
                    <div class="kpi-list compact">
                        <div>
                            <span>Active Offers</span>
                            <strong>{activeOffers.length}</strong>
                        </div>
                        <div>
                            <span>Fully Fulfilled</span>
                            <strong>{fulfilledOffers.length}</strong>
                        </div>
                        <div>
                            <span>Cancelled</span>
                            <strong>{(data.user.tradeOffers?.length ?? 0) - activeOffers.length}</strong>
                        </div>
                    </div>
                </Card>
            </div>

            <Card title="History">
                <div class="tabs">
                    {#each HISTORY_TABS as tab}
                        <button
                            class={activeHistoryTab === tab ? "active" : ""}
                            onclick={() => {
                                activeHistoryTab = tab;
                            }}
                        >
                            {tab}
                        </button>
                    {/each}
                </div>

                {#if activeHistoryTab === "names"}
                    <ul class="history-list">
                        {#each data.user.nameHistory ?? [] as entry (entry.at)}
                            <li>
                                <span>{formatDate(entry.at)}</span>
                                <strong>{entry.username}</strong>
                            </li>
                        {/each}
                    </ul>
                {:else if activeHistoryTab === "countries"}
                    <ul class="history-list">
                        {#each data.user.countryHistory ?? [] as entry (entry.at)}
                            <li>
                                <span>{formatDate(entry.at)}</span>
                                <strong>{entry.country.name} ({entry.country.code})</strong>
                            </li>
                        {/each}
                    </ul>
                {:else if activeHistoryTab === "mu"}
                    <ul class="history-list">
                        {#each data.user.muHistory ?? [] as entry (entry.at)}
                            <li>
                                <span>{formatDate(entry.at)}</span>
                                <strong>{entry.mu.name}</strong>
                            </li>
                        {/each}
                    </ul>
                {:else if activeHistoryTab === "party"}
                    <ul class="history-list">
                        {#each data.user.partyHistory ?? [] as entry (entry.at)}
                            <li>
                                <span>{formatDate(entry.at)}</span>
                                <strong>{entry.party.name}</strong>
                            </li>
                        {/each}
                    </ul>
                {:else if activeHistoryTab === "wages"}
                    <ul class="history-list">
                        {#each data.user.wageHistory ?? [] as entry (entry.at)}
                            <li>
                                <span>{formatDate(entry.at)}</span>
                                <strong>{formatMoney(entry.wage, 2)}</strong>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <ul class="history-list">
                        {#each data.user.skillSnapshots ?? [] as snapshot (snapshot.since)}
                            <li>
                                <span>{formatDate(snapshot.since)}</span>
                                <strong>
                                    E:{snapshot.set.energy} A:{snapshot.set.attack} P:{snapshot.set.production} M:{snapshot.set.management}
                                </strong>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </Card>

            <Card title="Finance Reports (Last 7 Days)" class="finance-card">
                {#if (data.user.financeReports?.length ?? 0) === 0}
                    <p class="empty">No finance reports.</p>
                {:else}
                    <div class="finance-grid">
                        {#each data.user.financeReports ?? [] as report (report.dayStart)}
                            <details>
                                <summary>
                                    <span>{formatDate(report.dayStart)}</span>
                                    <strong>
                                        Net {formatMoney(
                                            report.wagesEarned + report.itemsSold + report.equipSold - report.wagesPaid - report.itemsBought - report.equipBought,
                                            2,
                                        )}
                                    </strong>
                                </summary>
                                <div class="report-body">
                                    <div><span>Wages Earned</span><strong>{formatMoney(report.wagesEarned, 2)}</strong></div>
                                    <div><span>Wages Paid</span><strong>{formatMoney(report.wagesPaid, 2)}</strong></div>
                                    <div><span>Items Bought</span><strong>{formatMoney(report.itemsBought, 2)}</strong></div>
                                    <div><span>Items Sold</span><strong>{formatMoney(report.itemsSold, 2)}</strong></div>
                                    <div><span>Equip Bought</span><strong>{formatMoney(report.equipBought, 2)}</strong></div>
                                    <div><span>Equip Sold</span><strong>{formatMoney(report.equipSold, 2)}</strong></div>
                                    <div><span>Dismantled</span><strong>{formatMoney(report.valueDismantled, 2)}</strong></div>
                                    <div><span>Cases Opened</span><strong>{report.casesOpened}</strong></div>
                                    <div><span>Cases Net</span><strong>{formatMoney(report.casesNet, 2)}</strong></div>
                                </div>
                            </details>
                        {/each}
                    </div>
                {/if}
            </Card>
        </Wrapper>
    </div>
{:else}
    <div class="page-content">
        <Wrapper>
            <Card title="User">
                <p class="empty">{data.error ?? "No user data returned"}</p>
            </Card>
        </Wrapper>
    </div>
{/if}

<style lang="scss">
    .hero {
        margin: 0 8px;
        padding: 24px 0;
        background: linear-gradient(120deg, #262626 0%, #2c2c2c 100%);
        border-bottom: 1px solid #353535;
    }

    .hero-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }

    .identity {
        display: flex;
        align-items: center;
        gap: 14px;

        h1 {
            margin: 0;
            color: #c2c6d6;
            font-size: 30px;
            line-height: 1;
        }
    }

    .avatar {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid #3e3e3e;
    }

    .subline {
        margin-top: 6px;
        display: flex;
        gap: 10px;

        span {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #8c909f;
        }
    }

    .affiliations {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
    }

    .tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #3a3a3a;
        border-radius: 6px;
        padding: 6px 10px;
        background: #1f1f1f;
        color: #c2c6d6;
        font-size: 12px;

        span {
            color: #8c909f;
        }

        strong {
            color: #c2c6d6;
        }
    }

    .page-content {
        margin: 24px 8px;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
    }

    :global(div.stat-card > div.body) {
        padding: 14px;
        gap: 6px;
    }

    .label {
        margin: 0;
        color: #8c909f;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        font-size: 10px;
        font-weight: 700;
    }

    .value {
        margin: 0;
        color: #c2c6d6;
        font-size: 20px;
        font-weight: 800;
    }

    .grid-two {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 12px;
    }

    .grid-three {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 12px;
    }

    .mode-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .mode-label {
        color: #8c909f;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        font-weight: 700;
    }

    .mode-badge {
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 10px;
        letter-spacing: 0.4px;
        font-weight: 700;
        text-transform: uppercase;

        &.eco {
            background: rgba(33, 97, 67, 0.28);
            color: #7ad5a6;
        }

        &.war {
            background: rgba(110, 40, 40, 0.28);
            color: #e68f8f;
        }

        &.hybrid {
            background: rgba(106, 86, 38, 0.28);
            color: #e0c987;
        }
    }

    .split-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 10px;
    }

    .split-card {
        background: #232323;
        border: 1px solid #333;
        border-radius: 6px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        span {
            color: #8c909f;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            font-weight: 700;
        }

        strong {
            color: #c2c6d6;
            font-size: 18px;
        }
    }

    .kpi-list {
        display: grid;
        gap: 8px;

        &.compact {
            gap: 6px;
        }

        > div {
            border: 1px solid #323232;
            border-radius: 6px;
            background: #232323;
            padding: 8px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;

            span {
                color: #8c909f;
                font-size: 11px;
            }

            strong {
                color: #c2c6d6;
                font-size: 12px;
                font-weight: 700;
                text-align: right;
            }
        }
    }

    .simple-list {
        list-style: none;
        margin: 0;
        padding: 0;

        li {
            border-bottom: 1px solid #323232;
            padding: 8px 0;
            display: flex;
            justify-content: space-between;
            gap: 10px;

            span {
                color: #8c909f;
                font-size: 11px;
            }

            strong {
                color: #c2c6d6;
                font-size: 11px;
            }
        }
    }

    .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;

        button {
            border: 1px solid #353535;
            border-radius: 999px;
            background: #1f1f1f;
            color: #8c909f;
            padding: 6px 10px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            font-weight: 700;
            cursor: pointer;

            &.active {
                color: #c2c6d6;
                border-color: #5a5a5a;
                background: #2a2a2a;
            }
        }
    }

    .history-list {
        list-style: none;
        margin: 0;
        padding: 0;

        li {
            border-bottom: 1px solid #323232;
            padding: 8px 0;
            display: flex;
            justify-content: space-between;
            gap: 12px;

            span {
                color: #8c909f;
                font-size: 11px;
            }

            strong {
                color: #c2c6d6;
                font-size: 11px;
                text-align: right;
            }
        }
    }

    .finance-card {
        margin-top: 12px;
    }

    .finance-grid {
        display: grid;
        gap: 8px;

        details {
            border: 1px solid #323232;
            border-radius: 8px;
            background: #232323;
            padding: 8px 10px;

            summary {
                list-style: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                cursor: pointer;

                span {
                    color: #8c909f;
                    font-size: 11px;
                }

                strong {
                    color: #c2c6d6;
                    font-size: 11px;
                }
            }
        }
    }

    .report-body {
        margin-top: 10px;
        display: grid;
        gap: 6px;

        > div {
            display: flex;
            justify-content: space-between;
            gap: 8px;

            span {
                color: #8c909f;
                font-size: 11px;
            }

            strong {
                color: #c2c6d6;
                font-size: 11px;
            }
        }
    }

    .empty {
        margin: 0;
        color: #8c909f;
        font-size: 12px;
    }

    @media (max-width: 1200px) {
        .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .grid-three {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 900px) {
        .hero-row {
            flex-direction: column;
            align-items: flex-start;
        }

        .affiliations {
            justify-content: flex-start;
        }

        .grid-two,
        .grid-three,
        .stats-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 560px) {
        .identity h1 {
            font-size: 24px;
        }

        .avatar {
            width: 54px;
            height: 54px;
        }
    }
</style>
