<script lang="ts">
    import { formatCompactNumber } from "$lib/helpers";
    import type { BattleSummary } from "$lib/types";
    import CountryFlag from "./CountryFlag.svelte";

    let { battle }: { battle: BattleSummary } = $props();

    // svelte-ignore state_referenced_locally
    const isAttackerWinner = battle.winnerSide === "attacker";
    // svelte-ignore state_referenced_locally
    const isDefenderWinner = battle.winnerSide === "defender";
</script>

<a href={"/battle/" + battle.id}>
    <div class="battle-card">
        <div class="region-header">
            <span class="region-name">{battle.defenderRegion.name}</span>
        </div>

        <div class="battle-content">
            <div
                class="side attacker"
                class:winner={isAttackerWinner}
                class:decided={battle.winnerSide !== null}
            >
                <div class="side-info">
                    <CountryFlag
                        code={battle.attackerCountry.code}
                        alt={battle.attackerCountry.name}
                        height="18px"
                    />
                    <span class="country-name"
                        >{battle.attackerCountry.name}</span
                    >
                </div>
                <div class="damage">
                    {formatCompactNumber(battle.attackerDamages)}
                </div>
            </div>

            <div class="divider"></div>

            <div
                class="side defender"
                class:winner={isDefenderWinner}
                class:decided={battle.winnerSide !== null}
            >
                <div class="side-info">
                    <CountryFlag
                        code={battle.defenderCountry.code}
                        alt={battle.defenderCountry.name}
                        height="18px"
                    />
                    <span class="country-name"
                        >{battle.defenderCountry.name}</span
                    >
                </div>
                <div class="damage">
                    {formatCompactNumber(battle.defenderDamages)}
                </div>
            </div>
        </div>
    </div>
</a>

<style lang="scss">
    a {
        text-decoration: none;
        color: inherit;
    }

    div.battle-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        background: #262626;
        border: 1px solid #353535;
        border-radius: 4px;
        transition: all 0.2s ease-out;

        &:hover {
            border-color: #4a4a4a;
            background: #2a2a2a;
        }
    }

    div.region-header {
        display: flex;
        align-items: center;
        margin-bottom: 4px;

        span.region-name {
            font-size: 11px;
            color: #8c909f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
    }

    div.battle-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    div.side {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 3px;
        background: #1a1a1a;
        transition: all 0.2s ease-out;

        &.winner {
            background: linear-gradient(
                135deg,
                rgba(74, 225, 118, 0.1) 0%,
                transparent 100%
            );
            border: 1px solid rgba(74, 225, 118, 0.3);
        }

        &:not(.winner).decided {
            opacity: 0.6;
        }

        div.side-info {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            flex: 1;

            :global(img) {
                flex-shrink: 0;
                border-radius: 2px;
            }

            span.country-name {
                font-size: 13px;
                color: #c2c6d6;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        div.damage {
            font-size: 12px;
            font-weight: 700;
            color: #ffb4ab;
            letter-spacing: -0.5px;
            flex-shrink: 0;
        }
    }

    div.divider {
        height: 1px;
        background: #353535;
        margin: 0 -4px;
    }
</style>
