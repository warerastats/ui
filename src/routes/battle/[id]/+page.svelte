<script lang="ts">
    import CountryFlag from "$lib/components/CountryFlag.svelte";
    import { formatCompactNumber } from "$lib/helpers";
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

<h1>Battle</h1>

{#if data.ok}
    {#if data.battle}
        <section>
            <h2>Overview</h2>
            <ul>
                <li>Status: {data.battle.isActive ? "Active" : "Ended"}</li>
                {#if data.battle.endedAt}
                    <li>Ended At: {data.battle.endedAt}</li>
                {/if}
                {#if data.battle.winnerSide}
                    <li>Winner: {data.battle.winnerSide}</li>
                {/if}
                <li>
                    Attacker: {data.battle.attackerCountry?.name ?? "Unknown"} ({data
                        .battle.attackerCountry?.code ?? "?"})
                    {#if data.battle.attackerAlliance}
                        — {data.battle.attackerAlliance.name}
                    {/if}
                    — Damage: {data.battle.attackerDamages}
                </li>
                <li>
                    Defender: {data.battle.defenderCountry?.name ?? "Unknown"} ({data
                        .battle.defenderCountry?.code ?? "?"})
                    {#if data.battle.defenderAlliance}
                        — {data.battle.defenderAlliance.name}
                    {/if}
                    — Damage: {data.battle.defenderDamages}
                </li>
                {#if data.battle.defenderRegion}
                    <li>
                        Region: {data.battle.defenderRegion.name}
                        (country: {data.battle.defenderRegion.country.code},
                        initial: {data.battle.defenderRegion.initialCountry
                            .code})
                    </li>
                {/if}
            </ul>
        </section>

        <section>
            <h2>Top Damage (Top 10)</h2>
            {#if data.battle.topDamage.length === 0}
                <p>No damage data.</p>
            {:else}
                <ol>
                    {#each data.battle.topDamage as entry (entry.user.id)}
                        <li>{entry.user.username} — {entry.totalDamage}</li>
                    {/each}
                </ol>
            {/if}
        </section>

        <section>
            <h2>Order Changes</h2>
            {#if data.battle.orderChanges.length === 0}
                <p>No order changes.</p>
            {:else}
                <ul>
                    {#each data.battle.orderChanges as change (change.at + change.side + change.kind)}
                        <li>
                            {change.at} — {change.side}
                            {change.action} ({change.kind}):
                            {#if change.entity.__typename === "Country"}
                                {change.entity.name} ({change.entity.code})
                            {:else if change.entity.__typename === "Mu"}
                                {change.entity.name}
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Damage Reports</h2>
            {#if data.battle.damageReports.length === 0}
                <p>No damage reports.</p>
            {:else}
                <ul>
                    {#each data.battle.damageReports as report (report.intervalStart + report.side)}
                        <li>
                            {report.intervalStart} — {report.side}: {report.damage}
                            {#if report.equipment.length > 0}
                                <ul>
                                    {#each report.equipment as eq (eq.itemCode)}
                                        <li>
                                            {eq.itemCode}: {eq.count} used (value:
                                            {eq.value})
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    {:else}
        <p>No battle data found.</p>
    {/if}
{:else}
    <p>GraphQL check failed: {data.error}</p>
{/if}

<style lang="scss">
    div.battle-hero {
        margin: -8px -8px 32px -8px;
        padding: 24px 8px;
        background: linear-gradient(135deg, #262626 0%, #2a2a2a 100%);
        border-bottom: 1px solid #353535;
    }

    div.hero-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 16px;
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
