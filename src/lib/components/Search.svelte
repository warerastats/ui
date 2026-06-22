<script lang="ts">
    import { ITEM_NAMES, MARKET_ITEM_CODES } from "$lib/helpers";
    import SearchIcon from "$lib/icons/SearchIcon.svelte";
    import type { SearchApiResponse, SearchResultItem } from "$lib/types";
    import CountryFlag from "./CountryFlag.svelte";
    import ItemImage from "./ItemImage.svelte";
    import UserAvatar from "./UserAvatar.svelte";

    type ItemResult = {
        code: string;
        name: string;
        href: string;
        resultType: "item" | "equipment";
    };

    let searchTerm = $state("");
    let searchResults = $state<SearchResultItem[]>([]);
    let itemResults = $state<ItemResult[]>([]);
    let searchError = $state<string | null>(null);
    let isSearching = $state(false);
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let latestRequestId = 0;
    let wrapperElement = $state<HTMLDivElement | null>(null);

    function handleSearchInputKeydown(event: KeyboardEvent) {
        if (event.key !== "Tab" || event.shiftKey) {
            return;
        }

        const resultLinks = wrapperElement
            ? Array.from(
                  wrapperElement.querySelectorAll<HTMLAnchorElement>(
                      ".results a[href]",
                  ),
              )
            : [];

        if (resultLinks.length === 0) {
            return;
        }

        event.preventDefault();
        resultLinks[0]?.focus();
    }

    const marketItemCodeSet = new Set<string>(MARKET_ITEM_CODES);

    function buildItemResults(term: string): ItemResult[] {
        const lowerTerm = term.toLowerCase();

        return Object.entries(ITEM_NAMES)
            .filter(([code, name]) => {
                return (
                    code.toLowerCase().includes(lowerTerm) ||
                    name.toLowerCase().includes(lowerTerm)
                );
            })
            .map(([code, name]) => {
                const isMarketItem = marketItemCodeSet.has(code);
                return {
                    code,
                    name,
                    href: isMarketItem ? `/item/${code}` : `/equipment/${code}`,
                    resultType: isMarketItem
                        ? ("item" as const)
                        : ("equipment" as const),
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, 10);
    }

    $effect(() => {
        const term = searchTerm.trim();

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        if (term.length <= 2) {
            searchResults = [];
            itemResults = [];
            searchError = null;
            isSearching = false;
            return;
        }

        itemResults = buildItemResults(term);

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

<div class="wrapper" bind:this={wrapperElement}>
    <div class="search-bar">
        <SearchIcon color="#8C909F" />

        <!-- svelte-ignore a11y_autofocus -->
        <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search players, countries, items..."
            onkeydown={handleSearchInputKeydown}
            autofocus
        />
    </div>

    {#if searchResults.length > 0 || itemResults.length > 0 || searchError !== null || isSearching}
        <div class="results">
            {#if isSearching}
                <p>Searching...</p>
            {/if}

            {#if searchError !== null}
                <p>{searchError}</p>
            {/if}

            {#if itemResults.length > 0}
                {#each itemResults as item}
                    <a href={item.href}>
                        <div class="result-row">
                            <ItemImage itemCode={item.code} size={48} />
                            <div class="result-copy">
                                <span>{item.name}</span>
                                <span class="result-type"
                                    >{item.resultType}</span
                                >
                            </div>
                        </div>
                    </a>
                {/each}
            {/if}

            {#if searchResults.length > 0}
                {#each searchResults as item}
                    {#if item.__typename === "User"}
                        <a href={`/user/${item.id}`}>
                            <div class="result-row">
                                <UserAvatar
                                    src={item.avatarUrl}
                                    alt={item.username + "'s avatar"}
                                    height="48px"
                                    width="48px"
                                />
                                <div class="result-copy">
                                    <span>{item.username}</span>
                                    <span class="result-type">user</span>
                                </div>
                            </div>
                        </a>
                    {:else if item.__typename === "Country"}
                        <a href={`/country/${item.id}`}>
                            <div class="result-row">
                                <CountryFlag
                                    code={item.code}
                                    height="48px"
                                    width="48px"
                                />
                                <div class="result-copy">
                                    <span>{item.name}</span>
                                    <span class="result-type">country</span>
                                </div>
                            </div>
                        </a>
                    {:else if item.__typename === "Mu"}
                        <a href={`/mu/${item.id}`}>
                            <div class="result-row">
                                <UserAvatar
                                    src={item.avatarUrl}
                                    alt={item.name + "'s avatar"}
                                    height="48px"
                                    width="48px"
                                />
                                <div class="result-copy">
                                    <span>{item.name}</span>
                                    <span class="result-type">mu</span>
                                </div>
                            </div>
                        </a>
                    {:else if item.__typename === "Party"}
                        <a href={`/party/${item.id}`}>
                            <div class="result-row">
                                <UserAvatar
                                    src={item.avatarUrl}
                                    alt={item.name + "'s avatar"}
                                    height="48px"
                                    width="48px"
                                />
                                <div class="result-copy">
                                    <span>{item.name}</span>
                                    <span class="result-type">party</span>
                                </div>
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
        z-index: 120;
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

        & div.result-row {
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

        & div.result-copy {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            padding: 0;
        }

        & span.result-type {
            color: #8c909f;
            font-size: 12px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
    }

    div.wrapper {
        position: relative;
        z-index: 110;
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
