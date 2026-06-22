<script lang="ts">
    import type { ItemHourlySeries } from "$lib";
    import {
        formatCompactNumber,
        formatMoney,
        getItemName,
    } from "$lib/helpers";
    import Card from "$lib/components/Card.svelte";
    import Coin from "$lib/components/Coin.svelte";
    import ItemImage from "$lib/components/ItemImage.svelte";

    let { item }: { item: ItemHourlySeries } = $props();

    function buildSparklinePoints(
        values: number[],
        width = 220,
        height = 74,
        padding = 6,
    ): string {
        if (values.length === 0) {
            return "";
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const innerWidth = width - padding * 2;
        const innerHeight = height - padding * 2;
        const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;

        return values
            .map((value, index) => {
                const x = padding + step * index;
                const normalized = range <= 0 ? 0.5 : (value - min) / range;
                const y = height - padding - normalized * innerHeight;
                return `${x},${y}`;
            })
            .join(" ");
    }

    function formatPct(value: number): string {
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    }

    function getMoneyVolume(): number {
        if (!item.report) {
            return 0;
        }

        return item.report.volume24h * item.report.avgWeighted24h;
    }
</script>

<a
    href={`/item/${item.itemCode}`}
    class="item-link"
    aria-label={`Open ${getItemName(item.itemCode)}`}
>
    <Card class="item-card" headerBorder={false}>
        <div class="sparkline-bg" aria-hidden="true">
            {#if item.hourlyAvgPrices.length > 1}
                <svg viewBox="0 0 220 74" preserveAspectRatio="none">
                    <polyline
                        class:negative={item.report &&
                            item.report.pctChange24h < 0}
                        points={buildSparklinePoints(item.hourlyAvgPrices)}
                    ></polyline>
                </svg>
            {/if}
        </div>

        <div class="item-header">
            <ItemImage itemCode={item.itemCode} size={32} />
            <div class="title-wrap">
                <h2>{getItemName(item.itemCode)}</h2>
                <p class="code">{item.itemCode}</p>
            </div>
        </div>

        {#if item.report}
            <div class="metrics">
                <div class="metric">
                    <span class="label">Volume</span>
                    <span class="value coin-value">
                        <Coin width="12px" height="12px" />
                        {formatCompactNumber(getMoneyVolume())}
                    </span>
                </div>
                <div class="metric">
                    <span class="label">Price</span>
                    <span class="value">
                        {formatMoney(item.report.avgWeighted24h, 3)}
                    </span>
                </div>
                <div class="metric">
                    <span class="label">Change</span>
                    <span
                        class="value pct"
                        class:positive={item.report.pctChange24h >= 0}
                        class:negative={item.report.pctChange24h < 0}
                    >
                        {formatPct(item.report.pctChange24h)}
                    </span>
                </div>
            </div>
        {:else}
            <p class="empty-state">No market report available.</p>
        {/if}
    </Card>
</a>

<style lang="scss">
    a.item-link {
        display: block;
        text-decoration: none;
        color: inherit;
        border-radius: 8px;

        &:focus-visible {
            outline: 2px solid #4af0c0;
            outline-offset: 3px;
        }

        &:hover {
            :global(div.item-card) {
                transform: translateY(-1px);
                transition: transform 0.15s ease;
            }

            div.sparkline-bg {
                opacity: 0.5;
            }
        }
    }

    :global(div.item-card) {
        transition: transform 0.15s ease;
    }

    :global(div.item-card > div.body) {
        position: relative;
        overflow: hidden;
        padding: 12px;
        gap: 10px;
        min-height: 132px;
    }

    div.sparkline-bg {
        position: absolute;
        inset: auto 0 0 0;
        height: 74px;
        opacity: 0.36;
        pointer-events: none;

        svg {
            width: 100%;
            height: 100%;
        }

        polyline {
            fill: none;
            stroke: rgba(74, 240, 192, 0.75);
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;

            &.negative {
                stroke: rgba(255, 122, 122, 0.85);
            }
        }
    }

    div.item-header {
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
        z-index: 1;
    }

    div.title-wrap {
        min-width: 0;

        h2 {
            margin: 0;
            color: #c2c6d6;
            font-size: 16px;
            font-weight: 700;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        p.code {
            margin: 0;
            color: #8c909f;
            font-size: 12px;
        }
    }

    div.metrics {
        margin-top: auto;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        position: relative;
        z-index: 1;
    }

    div.metric {
        display: flex;
        flex-direction: column;
        gap: 2px;

        span.label {
            color: #8c909f;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        span.value {
            color: #c2c6d6;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: -0.2px;

            &.pct.positive {
                color: #4af0c0;
            }

            &.pct.negative {
                color: #ffb4ab;
            }
        }

        span.coin-value {
            display: inline-flex;
            align-items: center;
            gap: 4px;

            :global(svg) {
                vertical-align: baseline;
                flex-shrink: 0;
            }
        }
    }

    p.empty-state {
        margin: 0;
        color: #8c909f;
        position: relative;
        z-index: 1;
    }

    @media (max-width: 560px) {
        div.metrics {
            grid-template-columns: 1fr;
            gap: 6px;
        }
    }
</style>
