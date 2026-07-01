<script lang="ts">
    import Battle from "$lib/components/Battle.svelte";
    import Card from "$lib/components/Card.svelte";
    import InflationChart from "$lib/components/InflationChart.svelte";
    import Search from "$lib/components/Search.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import { formatMoney } from "$lib/helpers";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<div class="section section-search">
    <Wrapper>
        <Search />
    </Wrapper>
</div>

{#if data.ok}
    {#if data.latestMarketState}
        <div class="section section-stats">
            <Wrapper>
                <div class="cards-3">
                    <div class="stat-card-wrap">
                        <Card>
                            {#snippet header()}
                                <div class="card-header">
                                    <div class="label">Avg wage (24h)</div>
                                </div>
                            {/snippet}

                            <p class="stat">
                                <span class="big">
                                    {formatMoney(
                                        data.latestMarketState.avgWage24h,
                                    )}
                                </span>
                                btc
                            </p>
                        </Card>
                    </div>

                    <div class="stat-card-wrap">
                        <Card>
                            {#snippet header()}
                                <div class="card-header">
                                    <div class="label">Total wages (24h)</div>
                                </div>
                            {/snippet}

                            <p class="stat">
                                <span class="big">
                                    {formatMoney(
                                        data.latestMarketState.wageVolume24h,
                                        0,
                                    )}
                                </span>
                                btc
                            </p>
                        </Card>
                    </div>

                    <div class="stat-card-wrap">
                        <Card>
                            {#snippet header()}
                                <div class="card-header">
                                    <div class="label">Trade volume (24h)</div>
                                </div>
                            {/snippet}

                            <p class="stat">
                                <span class="big">
                                    {formatMoney(
                                        data.latestMarketState.marketVolume24h,
                                        0,
                                    )}
                                </span>
                                btc
                            </p>
                        </Card>
                    </div>
                </div>
            </Wrapper>
        </div>
    {/if}

    {#if data.inflation || data.battles}
        <div class="section section-content">
            <Wrapper>
                <div class="row">
                    {#if data.inflation}
                        <div class="inflation-row">
                            <Card>
                                {#snippet header()}
                                    <div class="card-header">
                                        <div class="label">
                                            Inflation (daily % change)
                                        </div>
                                    </div>
                                {/snippet}

                                {#if data.inflation.length > 0}
                                    <InflationChart points={data.inflation} />
                                {:else}
                                    There's currently no inflation data
                                    available.
                                {/if}
                            </Card>
                        </div>
                    {/if}

                    {#if data.battles}
                        <div class="battles">
                            <Card>
                                {#snippet header()}
                                    <div class="card-header">
                                        <div class="label">
                                            Recent completed battles
                                        </div>
                                    </div>
                                {/snippet}

                                {#each data.battles as battle}
                                    <Battle {battle} />
                                {/each}
                            </Card>
                        </div>
                    {/if}
                </div>
            </Wrapper>
        </div>
    {/if}
{/if}

<style lang="scss">
    div.section {
        margin: 0 8px;
    }

    div.section-search {
        margin-top: 60px;
    }

    div.section-stats {
        margin-top: 48px;
    }

    div.section-content {
        margin-top: 24px;
        margin-bottom: 24px;
    }

    div.cards-3 {
        display: flex;
        gap: 24px;
    }

    div.stat-card-wrap {
        flex: 1;
    }

    div.inflation-row {
        // 2 stat-card widths: 2 × (W - 2×24px) / 3 + 1 gap
        width: calc((100% - 48px) * 2 / 3 + 24px);
        min-width: 0;
    }

    .card-header {
        display: flex;
        justify-content: space-between;

        .label {
            color: #c2c6d6;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-weight: 600;
        }
    }

    p.stat {
        margin: 0;
        color: #8c909f;
        font-weight: 800;
        font-size: 12px;
        text-transform: uppercase;

        .big {
            font-size: 30px;
            font-weight: 900;
            letter-spacing: -1.5px;
            padding-right: 2px;
        }
    }

    div.row {
        display: flex;
        gap: 24px;
    }

    div.battles {
        flex: 1;
        min-width: 0;
    }

    @media (max-width: 900px) {
        div.cards-3,
        div.row {
            flex-direction: column;
            gap: 12px;
        }

        div.inflation-row {
            width: 100%;
        }

        div.section-search {
            margin-top: 36px;
        }
    }
</style>
