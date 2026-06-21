<script lang="ts">
    import type { SearchApiResponse, SearchResultItem } from "$lib";
    import Battle from "$lib/components/Battle.svelte";
    import Card from "$lib/components/Card.svelte";
    import InflationChart from "$lib/components/InflationChart.svelte";
    import Search from "$lib/components/Search.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import { formatMoney } from "$lib/helpers";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    let searchTerm = $state("");
    let searchResults = $state<SearchResultItem[]>([]);
    let searchError = $state<string | null>(null);
    let isSearching = $state(false);
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let latestRequestId = 0;

    $effect(() => {
        const term = searchTerm.trim();

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        if (term.length <= 2) {
            searchResults = [];
            searchError = null;
            isSearching = false;
            return;
        }

        debounceTimer = setTimeout(async () => {
            const requestId = ++latestRequestId;
            isSearching = true;
            searchError = null;

            try {
                const response = await fetch(
                    `/api/search?term=${encodeURIComponent(term)}&limit=10`,
                );
                const body = (await response.json()) as SearchApiResponse;

                if (requestId !== latestRequestId) {
                    return;
                }

                if (!response.ok) {
                    searchResults = [];
                    searchError = body.error ?? "Search request failed";
                    return;
                }

                searchResults = body.results;
            } catch (error) {
                if (requestId !== latestRequestId) {
                    return;
                }

                searchResults = [];
                searchError =
                    error instanceof Error
                        ? error.message
                        : "Unknown search error";
            } finally {
                if (requestId === latestRequestId) {
                    isSearching = false;
                }
            }
        }, 800);

        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    });
</script>

<div style="margin: 0 8px; margin-top: 60px;">
    <Wrapper>
        <Search />
    </Wrapper>
</div>

{#if data.ok}
    {#if data.latestMarketState}
        <div style="margin: 0 8px; margin-top: 48px;">
            <Wrapper>
                <div class="cards-3">
                    <div style="flex: 1">
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
                    <div style="flex: 1">
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

                    <div style="flex: 1">
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
        <div style="margin: 0 8px; margin-top: 24px;">
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

<h1>WareraStats UI</h1>
<p>This page loads GraphQL data through server-only code.</p>

<section>
    <h2>Live Search</h2>
    <input
        type="search"
        placeholder="Type at least 3 characters"
        bind:value={searchTerm}
    />

    {#if searchTerm.trim().length > 2}
        {#if isSearching}
            <p>Searching...</p>
        {:else if searchError}
            <p>Search failed: {searchError}</p>
        {:else if searchResults.length === 0}
            <p>No results found.</p>
        {:else}
            <ul>
                {#each searchResults as item (item.__typename + ":" + item.id)}
                    <li>
                        {#if item.__typename === "Country"}
                            Country: {item.name} ({item.code})
                        {:else if item.__typename === "Mu"}
                            MU: {item.name}
                        {:else if item.__typename === "Party"}
                            Party: {item.name}
                        {:else}
                            User: {item.username}
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}
</section>

<style lang="scss">
    div.cards-3 {
        display: flex;
        gap: 24px;
    }

    div.inflation-row {
        // 2 stat-card widths: 2 × (W - 2×24px) / 3 + 1 gap
        width: calc((100% - 48px) * 2 / 3 + 24px);
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
    }
</style>
