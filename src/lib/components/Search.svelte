<script lang="ts">
    import SearchIcon from "$lib/icons/SearchIcon.svelte";
    import type { SearchApiResponse, SearchResultItem } from "$lib/types";
    import CountryFlag from "./CountryFlag.svelte";
    import UserAvatar from "./UserAvatar.svelte";

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

<div class="wrapper">
    <div class="search-bar">
        <SearchIcon color="#8C909F" />

        <!-- svelte-ignore a11y_autofocus -->
        <input type="text" bind:value={searchTerm} placeholder="Search players, countries, items..." autofocus>
    </div>

    {#if searchResults.length > 0 || searchError !== null || isSearching}
        <div class="results">
            {#if isSearching}
                <p>
                    Searching...
                </p>
            {/if}

            {#if searchError !== null}
                <p>
                    {searchError}
                </p>
            {/if}

            {#if searchResults.length > 0}
                {#each searchResults as item}
                    {#if item.__typename === "User"}
                        <a href={`/user/${item.id}`}>
                            <div>
                                <UserAvatar src={item.avatarUrl} alt={item.username+"'s avatar"} height="48px" width="48px"/>
                                {item.username}
                            </div>
                        </a>
                    {:else if item.__typename === "Country"}
                        <a href={`/country/${item.id}`}>
                            <div>
                                <CountryFlag code={item.code} height="48px" width="48px"/>
                                {item.name}
                            </div>
                        </a>
                    {:else if item.__typename === "Mu"}
                        <a href={`/mu/${item.id}`}>
                            <div>
                                <UserAvatar src={item.avatarUrl} alt={item.name+"'s avatar"} height="48px" width="48px"/>
                                {item.name}
                            </div>
                        </a>
                    {:else if item.__typename === "Party"}
                        <a href={`/party/${item.id}`}>
                            <div>
                                <UserAvatar src={item.avatarUrl} alt={item.name+"'s avatar"} height="48px" width="48px"/>
                                {item.name}
                            </div>
                        </a>
                    {/if}
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style lang="scss">
    div.results {
        position: absolute;
        top: 70px;
        left: 0;
        right: 0;
        max-width: 760px;
        width: 100%;
        margin: 0 auto;
        background-color: #1c1b1b;
        border: #262626 1px solid;
        border-top: 0;

        & > p {
            margin: 0;
            font-size: 18px;
            padding: 0 24px;
        }

        & a {
            text-decoration: none;
        }

        & div {
            padding: 6px 6px;
            display: flex;
            align-items: center;
            gap: 16px;

            &:not(:last-child) {
                border-bottom: #262626 1px solid;
            }

            &:hover {
                background-color: rgba($color: #ffffff, $alpha: 0.05);
            }
        }
    }

    div.wrapper {
        position: relative;
    }

    div.search-bar {
        max-width: 760px;
        width: 100%;
        margin: 0 auto;
        height: 70px;

        background-color: #1c1b1b;
        border: #262626 1px solid;

        display: flex;
        align-items: center;
        padding: 24px;
        gap: 16px;

        input {
            flex: 1;
            height: 36px;

            background: transparent;
            border: 0;
            font-size: 20px;

            &:focus {
                outline: none;
            }
        }
    }
</style>