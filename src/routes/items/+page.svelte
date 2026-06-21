<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<h1>Items</h1>
<p>
    This page shows item market reports and hourly average prices from the last
    24 hours.
</p>

{#if data.ok}
    {#if data.items.length === 0}
        <p>No item data available.</p>
    {:else}
        <ul>
            {#each data.items as item (item.itemCode)}
                <li>
                    <h2>{item.itemCode}</h2>

                    {#if item.report}
                        <ul>
                            <li>volume24h: {item.report.volume24h}</li>
                            <li>
                                avgWeighted24h: {item.report.avgWeighted24h}
                            </li>
                            <li>pctChange24h: {item.report.pctChange24h}%</li>
                        </ul>
                    {:else}
                        <p>No market report available.</p>
                    {/if}

                    {#if item.hourlyAvgPrices.length === 0}
                        <p>No hourly averages available.</p>
                    {:else}
                        <p>
                            hourlyAvgPrices: [{item.hourlyAvgPrices.join(", ")}]
                        </p>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
{:else}
    <p>GraphQL check failed: {data.error}</p>
{/if}
