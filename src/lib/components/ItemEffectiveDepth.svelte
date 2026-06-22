<script lang="ts">
    import Coin from "$lib/components/Coin.svelte";
    import { formatCompactNumber, formatMoney } from "$lib/helpers";
    import type { ItemEffectivePrice } from "$lib";

    let {
        effectiveBuy,
        effectiveSell,
    }: {
        effectiveBuy: ItemEffectivePrice[];
        effectiveSell: ItemEffectivePrice[];
    } = $props();

    type RawEffectivePair = {
        size: number;
        buyAvg: number;
        sellAvg: number;
        spread: number;
        spreadPct: number;
    };

    type EffectivePair = RawEffectivePair & {
        buyWidthPct: number;
        sellWidthPct: number;
    };

    let effectivePairs = $derived.by((): EffectivePair[] => {
        if (effectiveBuy.length === 0 || effectiveSell.length === 0) {
            return [];
        }

        const sellBySize = new Map(
            effectiveSell.map((entry) => [entry.size, entry]),
        );

        const rawPairs = effectiveBuy
            .map((buyEntry, index): RawEffectivePair | null => {
                const matchedSell =
                    sellBySize.get(buyEntry.size) ??
                    effectiveSell[index] ??
                    null;
                if (!matchedSell) {
                    return null;
                }

                const spread = buyEntry.avgPrice - matchedSell.avgPrice;
                const spreadPct =
                    matchedSell.avgPrice > 0
                        ? (spread / matchedSell.avgPrice) * 100
                        : 0;

                return {
                    size: buyEntry.size,
                    buyAvg: buyEntry.avgPrice,
                    sellAvg: matchedSell.avgPrice,
                    spread,
                    spreadPct,
                };
            })
            .filter((value): value is RawEffectivePair => value !== null)
            .sort((a, b) => a.size - b.size);

        const maxSidePrice = Math.max(
            1,
            ...rawPairs.map((pair) => Math.max(pair.buyAvg, pair.sellAvg)),
        );

        return rawPairs.map((pair) => ({
            ...pair,
            buyWidthPct: (pair.buyAvg / maxSidePrice) * 100,
            sellWidthPct: (pair.sellAvg / maxSidePrice) * 100,
        }));
    });
</script>

<div class="effective-wrap">
    <div class="effective-header">
        <p>Visual spread by depth size</p>
    </div>

    {#if effectivePairs.length === 0}
        <p class="empty">No effective depth data available.</p>
    {:else}
        <div
            class="effective-rows"
            role="list"
            aria-label="Effective buy and sell by size"
        >
            {#each effectivePairs as pair (`eff-${pair.size}`)}
                <div class="effective-row" role="listitem">
                    <div class="row-meta">
                        <span class="size"
                            >Size {formatCompactNumber(pair.size)}</span
                        >

                        <span class="side sell">
                            Sell
                            <span class="money-inline">
                                <Coin width="11px" height="11px" />
                                {formatMoney(pair.sellAvg, 4)}
                            </span>
                        </span>

                        <span class="side buy">
                            Buy
                            <span class="money-inline">
                                <Coin width="11px" height="11px" />
                                {formatMoney(pair.buyAvg, 4)}
                            </span>
                        </span>
                    </div>

                    <div class="bar-row">
                        <div class="half left">
                            <div
                                class="fill sell"
                                style={`width:${pair.sellWidthPct}%`}
                            ></div>
                        </div>

                        <div
                            class="spread-pill"
                            class:positive={pair.spread >= 0}
                            class:negative={pair.spread < 0}
                        >
                            <span class="money-inline">
                                <Coin width="11px" height="11px" />
                                {formatMoney(pair.spread, 4)}
                            </span>
                            <span class="pct">
                                {pair.spreadPct >= 0
                                    ? "+"
                                    : ""}{pair.spreadPct.toFixed(2)}%
                            </span>
                        </div>

                        <div class="half right">
                            <div
                                class="fill buy"
                                style={`width:${pair.buyWidthPct}%`}
                            ></div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    div.effective-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    div.effective-header {
        p {
            margin: 0;
            color: #8c909f;
            font-size: 12px;
        }
    }

    div.effective-rows {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    div.effective-row {
        border: 1px solid #353535;
        background: #1f1f1f;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    div.row-meta {
        display: grid;
        grid-template-columns: auto 1fr 1fr;
        align-items: center;
        gap: 10px;
    }

    span.size {
        font-size: 11px;
        font-weight: 700;
        color: #8c909f;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    span.side {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #8c909f;
        font-weight: 600;
        font-variant-numeric: tabular-nums;

        &.sell {
            justify-self: start;

            span.money-inline {
                color: #4af0c0;
            }
        }

        &.buy {
            justify-self: end;

            span.money-inline {
                color: #ffb4ab;
            }
        }
    }

    div.bar-row {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 8px;
    }

    div.half {
        position: relative;
        height: 22px;
        border: 1px solid #2f2f2f;
        background: #171717;
        overflow: hidden;

        &.left {
            display: flex;
            justify-content: flex-end;
        }

        &.right {
            display: flex;
            justify-content: flex-start;
        }
    }

    div.fill {
        height: 100%;
        transition: width 0.2s ease;

        &.sell {
            background: linear-gradient(
                to left,
                rgba(74, 240, 192, 0.42),
                rgba(74, 240, 192, 0.12)
            );
            border-right: 2px solid rgba(74, 240, 192, 0.9);
        }

        &.buy {
            background: linear-gradient(
                to right,
                rgba(255, 122, 122, 0.42),
                rgba(255, 122, 122, 0.12)
            );
            border-left: 2px solid rgba(255, 122, 122, 0.9);
        }
    }

    div.spread-pill {
        border: 1px solid #353535;
        background: #171717;
        color: #c2c6d6;
        border-radius: 6px;
        padding: 5px 9px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;

        &.positive {
            border-color: rgba(255, 122, 122, 0.4);
        }

        &.negative {
            border-color: rgba(74, 240, 192, 0.4);
        }

        span.pct {
            color: #8c909f;
            font-size: 10px;
            font-weight: 600;
        }
    }

    span.money-inline {
        display: inline-flex;
        align-items: center;
        gap: 3px;
    }

    p.empty {
        margin: 0;
        color: #8c909f;
        font-size: 12px;
    }

    @media (max-width: 900px) {
        div.row-meta {
            grid-template-columns: 1fr;
            gap: 4px;
        }

        span.side {
            justify-self: start !important;
        }

        div.bar-row {
            grid-template-columns: 1fr;
            gap: 6px;
        }

        div.spread-pill {
            justify-self: center;
        }
    }
</style>
