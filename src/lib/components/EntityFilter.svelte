<script lang="ts">
    import SearchIcon from "$lib/icons/SearchIcon.svelte";
    import type { SearchApiResponse, SearchResultItem } from "$lib/types";
    import CountryFlag from "./CountryFlag.svelte";
    import UserAvatar from "./UserAvatar.svelte";

    type EntityKind = "USER" | "COUNTRY" | "PARTY" | "MU" | "ALLIANCE";

    type SelectedEntity = {
        kind: EntityKind;
        id: string;
        name: string;
    };

    let {
        selected = $bindable(null),
        placeholder = "Filter by entity...",
    }: {
        selected: SelectedEntity | null;
        placeholder?: string;
    } = $props();

    let searchTerm = $state("");
    let searchResults = $state<SearchResultItem[]>([]);
    let isSearching = $state(false);
    let showDropdown = $state(false);
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let latestRequestId = 0;

    function entityKindFromTypename(typename: string): EntityKind | null {
        switch (typename) {
            case "User":
                return "USER";
            case "Country":
                return "COUNTRY";
            case "Mu":
                return "MU";
            case "Party":
                return "PARTY";
            case "Alliance":
                return "ALLIANCE";
            default:
                return null;
        }
    }

    function getDisplayName(item: SearchResultItem): string {
        if (item.__typename === "User") return item.username;
        return item.name;
    }

    function selectEntity(item: SearchResultItem) {
        const kind = entityKindFromTypename(item.__typename);
        if (!kind) return;

        selected = {
            kind,
            id: item.id,
            name: getDisplayName(item),
        };

        searchTerm = "";
        searchResults = [];
        showDropdown = false;
    }

    function clearSelection() {
        selected = null;
    }

    $effect(() => {
        const term = searchTerm.trim();

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        if (term.length <= 2) {
            searchResults = [];
            isSearching = false;
            showDropdown = false;
            return;
        }

        debounceTimer = setTimeout(async () => {
            const requestId = ++latestRequestId;
            isSearching = true;
            showDropdown = true;

            try {
                const response = await fetch(
                    `/api/search?term=${encodeURIComponent(term)}&limit=6`,
                );
                const body = (await response.json()) as SearchApiResponse;

                if (requestId !== latestRequestId) return;

                if (!response.ok) {
                    searchResults = [];
                    return;
                }

                searchResults = body.results;
            } catch {
                if (requestId !== latestRequestId) return;
                searchResults = [];
            } finally {
                if (requestId === latestRequestId) {
                    isSearching = false;
                }
            }
        }, 400);

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    });
</script>

<div class="entity-filter">
    {#if selected}
        <div class="selected-chip">
            <span class="chip-kind">{selected.kind}</span>
            <span class="chip-name">{selected.name}</span>
            <button class="chip-clear" onclick={clearSelection}>&times;</button>
        </div>
    {:else}
        <div class="filter-input-wrapper">
            <SearchIcon color="#8C909F" />
            <input
                type="text"
                bind:value={searchTerm}
                {placeholder}
                onfocus={() => {
                    if (searchResults.length > 0) showDropdown = true;
                }}
                onblur={() => {
                    setTimeout(() => {
                        showDropdown = false;
                    }, 200);
                }}
            />
        </div>

        {#if showDropdown && (searchResults.length > 0 || isSearching)}
            <div class="dropdown">
                {#if isSearching}
                    <div class="dropdown-item muted">Searching...</div>
                {/if}

                {#each searchResults as item (item.id + item.__typename)}
                    <button
                        class="dropdown-item"
                        onmousedown={() => selectEntity(item)}
                    >
                        {#if item.__typename === "User"}
                            <UserAvatar
                                src={item.avatarUrl}
                                alt={item.username}
                                height="20px"
                                width="20px"
                            />
                            <span class="item-label">{item.username}</span>
                            <span class="item-type">user</span>
                        {:else if item.__typename === "Country"}
                            <CountryFlag
                                code={item.code}
                                height="20px"
                                width="20px"
                            />
                            <span class="item-label">{item.name}</span>
                            <span class="item-type">country</span>
                        {:else if item.__typename === "Mu"}
                            <UserAvatar
                                src={item.avatarUrl}
                                alt={item.name}
                                height="20px"
                                width="20px"
                            />
                            <span class="item-label">{item.name}</span>
                            <span class="item-type">mu</span>
                        {:else if item.__typename === "Party"}
                            <UserAvatar
                                src={item.avatarUrl}
                                alt={item.name}
                                height="20px"
                                width="20px"
                            />
                            <span class="item-label">{item.name}</span>
                            <span class="item-type">party</span>
                        {/if}
                    </button>
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style lang="scss">
    div.entity-filter {
        position: relative;
    }

    div.filter-input-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: #1a1a1a;
        border: 1px solid #353535;
        border-radius: 4px;
        transition: border-color 0.15s ease;

        &:focus-within {
            border-color: #555;
        }

        input {
            flex: 1;
            background: none;
            border: none;
            outline: none;
            color: #c2c6d6;
            font-size: 12px;
            min-width: 0;

            &::placeholder {
                color: #8c909f;
            }
        }
    }

    div.selected-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 8px;
        background: rgba(74, 240, 192, 0.1);
        border: 1px solid rgba(74, 240, 192, 0.3);
        border-radius: 4px;

        .chip-kind {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #4af0c0;
            background: rgba(74, 240, 192, 0.15);
            padding: 1px 4px;
            border-radius: 2px;
        }

        .chip-name {
            font-size: 12px;
            font-weight: 600;
            color: #4af0c0;
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        button.chip-clear {
            background: none;
            border: none;
            color: #4af0c0;
            font-size: 16px;
            line-height: 1;
            cursor: pointer;
            padding: 0 2px;
            opacity: 0.7;
            transition: opacity 0.15s ease;

            &:hover {
                opacity: 1;
            }
        }
    }

    div.dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: #1a1a1a;
        border: 1px solid #353535;
        border-radius: 4px;
        z-index: 20;
        max-height: 200px;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    button.dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        width: 100%;
        background: none;
        border: none;
        border-bottom: 1px solid #2a2a2a;
        color: #c2c6d6;
        font-size: 12px;
        cursor: pointer;
        text-align: left;

        &:last-child {
            border-bottom: none;
        }

        &:hover {
            background: #262626;
        }

        .item-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .item-type {
            font-size: 10px;
            color: #8c909f;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            flex-shrink: 0;
        }
    }

    div.dropdown-item.muted {
        padding: 8px 10px;
        color: #8c909f;
        font-size: 12px;
    }
</style>
