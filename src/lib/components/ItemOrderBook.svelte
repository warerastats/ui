<script lang="ts">
    import Coin from "$lib/components/Coin.svelte";
    import { formatCompactNumber, formatMoney } from "$lib/helpers";
    import type { ItemOrderbookLevel } from "$lib";

    let {
        bids,
        asks,
        spread,
    }: {
        bids: ItemOrderbookLevel[];
        asks: ItemOrderbookLevel[];
        spread: number;
    } = $props();

    const LEVEL_COUNT = 14;

    type DepthLevel = {
        price: number;
        quantity: number;
        acum: number;
    };

    function withCumulative(levels: ItemOrderbookLevel[]): DepthLevel[] {
        let acum = 0;
        return levels.map((level) => {
            acum += level.quantity;
            return {
                price: level.price,
                quantity: level.quantity,
                acum,
            };
        });
    }

    let askLevels = $derived.by(() => {
        const sorted = [...asks].sort((a, b) => a.price - b.price);
        return withCumulative(sorted.slice(0, LEVEL_COUNT));
    });

    let bidLevels = $derived.by(() => {
        const sorted = [...bids].sort((a, b) => b.price - a.price);
        return withCumulative(sorted.slice(0, LEVEL_COUNT));
    });

    let depthTotals = $derived.by(() => {
        const asksTotal = askLevels.at(-1)?.acum ?? 0;
        const bidsTotal = bidLevels.at(-1)?.acum ?? 0;
        const max = Math.max(asksTotal, bidsTotal, 1);
        return {
            asks: asksTotal,
            bids: bidsTotal,
            max,
        };
    });

    function getDepthPercent(acum: number): number {
        return (acum / depthTotals.max) * 100;
    }
</script>

<div class="depth-wrap">
    <div class="depth-header">
        <div class="depth-header-section">
            <span class="depth-label sell">Asks</span>
            <span class="depth-total">
                Total: {formatCompactNumber(depthTotals.asks)}
            </span>
        </div>
    </div>

    <div class="depth-visualization" role="table" aria-label="Orderbook depth">
        <div class="depth-side sell">
            {#if askLevels.length === 0}
                <p class="empty">No asks</p>
            {:else}
                {#each askLevels as level (`ask-${level.price}`)}
                    {@const widthPercent = getDepthPercent(level.acum)}
                    <div class="depth-row">
                        <div class="depth-bar-container">
                            <div
                                class="depth-bar sell"
                                style={`width: ${widthPercent}%`}
                            ></div>
                            <span class="depth-qty">
                                {formatCompactNumber(level.quantity)}
                            </span>
                        </div>
                        <span class="depth-price sell money-value">
                            <Coin width="11px" height="11px" />
                            {formatMoney(level.price, 4)}
                        </span>
                    </div>
                {/each}
            {/if}
        </div>

        <div class="depth-center">
            <span class="depth-spread">
                Spread:
                <Coin width="11px" height="11px" />
                {formatMoney(spread, 4)}
            </span>
        </div>

        <div class="depth-side buy">
            {#if bidLevels.length === 0}
                <p class="empty">No bids</p>
            {:else}
                {#each bidLevels as level (`bid-${level.price}`)}
                    {@const widthPercent = getDepthPercent(level.acum)}
                    <div class="depth-row">
                        <div class="depth-bar-container">
                            <div
                                class="depth-bar buy"
                                style={`width: ${widthPercent}%`}
                            ></div>
                            <span class="depth-qty">
                                {formatCompactNumber(level.quantity)}
                            </span>
                        </div>
                        <span class="depth-price buy money-value">
                            <Coin width="11px" height="11px" />
                            {formatMoney(level.price, 4)}
                        </span>
                    </div>
                {/each}
            {/if}
        </div>
    </div>

    <div class="depth-footer">
        <div class="depth-footer-section">
            <span class="depth-label buy">Bids</span>
            <span class="depth-total">
                Total: {formatCompactNumber(depthTotals.bids)}
            </span>
        </div>
    </div>
</div>

<style lang="scss">
    div.depth-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    div.depth-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid #353535;
    }

    div.depth-header-section,
    div.depth-footer-section {
        display: flex;
        align-items: baseline;
        gap: 10px;
    }

    span.depth-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;

        &.buy {
            color: #4af0c0;
        }

        &.sell {
            color: #ffb4ab;
        }
    }

    span.depth-total {
        font-size: 11px;
        color: #8c909f;
    }

    span.depth-spread {
        font-size: 11px;
        color: #8c909f;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background-color: #1f1f1f;
        border: 1px solid #353535;
        border-radius: 5px;
        white-space: nowrap;
        font-weight: 600;
    }

    div.depth-visualization {
        display: grid;
        gap: 3px;
    }

    div.depth-side {
        display: flex;
        flex-direction: column-reverse;
        gap: 2px;

        &.buy {
            flex-direction: column;
        }

        &.buy div.depth-row {
            flex-direction: row-reverse;
        }

        &.sell div.depth-row {
            flex-direction: row-reverse;
        }
    }

    div.depth-row {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 24px;
        font-size: 11px;
    }

    div.depth-bar-container {
        flex: 1;
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        background: #1f1f1f;
        border: 1px solid #2f2f2f;
    }

    div.depth-bar {
        position: absolute;
        left: 0;
        height: 100%;
        border-radius: 2px;
        transition: width 0.2s ease;

        &.buy {
            background: linear-gradient(
                to left,
                rgba(74, 240, 192, 0.35),
                rgba(74, 240, 192, 0.08)
            );
            border-right: 2px solid rgba(74, 240, 192, 0.8);
        }

        &.sell {
            background: linear-gradient(
                to right,
                rgba(255, 122, 122, 0.35),
                rgba(255, 122, 122, 0.08)
            );
            border-left: 2px solid rgba(255, 122, 122, 0.85);
        }
    }

    span.depth-qty {
        position: relative;
        z-index: 1;
        font-variant-numeric: tabular-nums;
        color: #c2c6d6;
        padding: 0 8px;
        font-weight: 600;
    }

    span.depth-price {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        min-width: 72px;

        &.money-value {
            display: inline-flex;
            align-items: center;
            gap: 3px;

            :global(svg) {
                vertical-align: baseline;
                flex-shrink: 0;
            }
        }

        &.buy {
            color: #4af0c0;
            text-align: left;
        }

        &.sell {
            color: #ffb4ab;
            text-align: left;
        }
    }

    div.depth-center {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 0;
    }

    div.depth-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 2px;
        padding-top: 8px;
        border-top: 1px solid #353535;
    }

    p.empty {
        margin: 0;
        padding: 8px;
        color: #8c909f;
        font-size: 12px;
    }

    @media (max-width: 900px) {
        div.depth-row {
            gap: 6px;
        }

        span.depth-price {
            min-width: 64px;
        }
    }
</style>
