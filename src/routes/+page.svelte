<script lang="ts">
    import type { SearchApiResponse, SearchResultItem } from "$lib";
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

{#if data.ok}
    <section>
        <h2>Latest Market State</h2>
        {#if data.latestMarketState}
            <ul>
                <li>Avg wage (24h): {data.latestMarketState.avgWage24h}</li>
                <li>
                    Wage volume (24h): {data.latestMarketState.wageVolume24h}
                </li>
                <li>
                    Market volume (24h): {data.latestMarketState
                        .marketVolume24h}
                </li>
                <li>Wage min: {data.latestMarketState.wageMin}</li>
                <li>Wage max: {data.latestMarketState.wageMax}</li>
                <li>
                    Weighted avg wage: {data.latestMarketState.wageAvgWeighted}
                </li>
            </ul>
        {:else}
            <p>No market state available.</p>
        {/if}
    </section>

    <section>
        <h2>Inflation (Last 30 Full UTC Days)</h2>
        {#if data.inflation.length === 0}
            <p>No inflation points available for the selected window.</p>
        {:else}
            <ul>
                {#each data.inflation as point (point.dayStart)}
                    <li>
                        <p>Day start: {point.dayStart}</p>
                        <p>24h change: {point.pctChange24h}%</p>
                    </li>
                {/each}
            </ul>
        {/if}
    </section>

    <section>
        <h2>Finalized Battles (Latest 5)</h2>
        {#if data.battles.length === 0}
            <p>No finalized battles found.</p>
        {:else}
            <ul>
                {#each data.battles as battle (battle.id)}
                    <li>
                        <p>ID: {battle.id}</p>
                        <p>Winner side: {battle.winnerSide ?? "Unknown"}</p>
                        <p>
                            {battle.attackerCountry?.name ?? "Unknown attacker"}
                            ({battle.attackerDamages}) vs
                            {battle.defenderCountry?.name ?? "Unknown defender"}
                            ({battle.defenderDamages})
                        </p>
                    </li>
                {/each}
            </ul>
        {/if}
    </section>
{:else}
    <p>GraphQL check failed: {data.error}</p>
{/if}
