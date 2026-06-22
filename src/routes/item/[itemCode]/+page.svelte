<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import Coin from "$lib/components/Coin.svelte";
    import ItemImage from "$lib/components/ItemImage.svelte";
    import ItemOrderBook from "$lib/components/ItemOrderBook.svelte";
    import ItemPriceHistoryChart from "$lib/components/ItemPriceHistoryChart.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import {
        formatCompactNumber,
        formatMoney,
        getItemName,
    } from "$lib/helpers";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let marketReport = $derived(data.marketReport);
    let moneyVolume = $derived.by(() => {
        if (!marketReport) {
            return 0;
        }
        return marketReport.volume24h * marketReport.avgWeighted24h;
    });
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

            <div class="stats-grid">
                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Average Price</p>
                    <p class="value coin-value">
                        <Coin width="14px" height="14px" />
                        {formatMoney(marketReport?.avgWeighted24h ?? 0, 4)}
                    </p>
                </Card>

                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Low 24h</p>
                    <p class="value coin-value">
                        <Coin width="14px" height="14px" />
                        {formatMoney(marketReport?.low24h ?? 0, 4)}
                    </p>
                </Card>

                <Card class="stat-card" headerBorder={false}>
                    <p class="label">High 24h</p>
                    <p class="value coin-value">
                        <Coin width="14px" height="14px" />
                        {formatMoney(marketReport?.high24h ?? 0, 4)}
                    </p>
                </Card>

                <Card class="stat-card" headerBorder={false}>
                    <p class="label">Volume</p>
                    <p class="value coin-value">
                        <Coin width="14px" height="14px" />
                        {formatCompactNumber(moneyVolume)}
                    </p>
                </Card>
            </div>

            <div class="market-grid">
                <Card title="Price History" class="price-card">
                    <ItemPriceHistoryChart
                        itemCode={data.itemCode}
                        initialCandles={data.candles}
                    />
                </Card>

                <Card title="Orderbook" class="orderbook-card">
                    {#if marketReport}
                        <ItemOrderBook
                            bids={marketReport.bids}
                            asks={marketReport.asks}
                            spread={marketReport.spread}
                        />
                    {:else}
                        <p class="empty-state">No orderbook data available.</p>
                    {/if}
                </Card>
            </div>
        {:else}
            <Card title="Item">
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

    div.stats-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
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

    div.market-grid {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
        gap: 12px;
        align-items: stretch;
    }

    :global(div.price-card > div.body) {
        padding-top: 12px;
        flex: 1;
        min-height: 480px;
    }

    :global(div.orderbook-card > div.body) {
        padding-top: 12px;
    }

    p.empty-state {
        margin: 0;
        color: #8c909f;
    }

    @media (max-width: 1050px) {
        div.stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        div.market-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 560px) {
        div.item-meta {
            h1 {
                font-size: 24px;
            }
        }

        div.stats-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
