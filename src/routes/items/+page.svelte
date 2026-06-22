<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import ItemMarketCard from "$lib/components/ItemMarketCard.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import { getItemName } from "$lib/helpers";
    import type { ItemHourlySeries } from "$lib";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    type SortField = "alphabetical" | "volume" | "pctChanged" | "price";
    type SortDirection = "asc" | "desc";

    let sortField = $state<SortField>("volume");
    let sortDirection = $state<SortDirection>("desc");

    function getMoneyVolume(item: ItemHourlySeries): number {
        if (!item.report) {
            return Number.NEGATIVE_INFINITY;
        }

        return item.report.volume24h * item.report.avgWeighted24h;
    }

    function getSortValue(
        item: ItemHourlySeries,
        field: SortField,
    ): number | string {
        if (field === "alphabetical") {
            return getItemName(item.itemCode).toLowerCase();
        }

        if (field === "volume") {
            return getMoneyVolume(item);
        }

        if (field === "pctChanged") {
            return item.report?.pctChange24h ?? Number.NEGATIVE_INFINITY;
        }

        return item.report?.avgWeighted24h ?? Number.NEGATIVE_INFINITY;
    }

    let sortedItems = $derived.by(() => {
        const items = [...data.items];
        const direction = sortDirection === "asc" ? 1 : -1;

        items.sort((a, b) => {
            const aValue = getSortValue(a, sortField);
            const bValue = getSortValue(b, sortField);

            let result = 0;
            if (typeof aValue === "string" && typeof bValue === "string") {
                result = aValue.localeCompare(bValue);
            } else {
                const aNum = Number(aValue);
                const bNum = Number(bValue);
                if (aNum < bNum) result = -1;
                else if (aNum > bNum) result = 1;
                else result = 0;
            }

            if (result !== 0) {
                return result * direction;
            }

            return getItemName(a.itemCode).localeCompare(
                getItemName(b.itemCode),
            );
        });

        return items;
    });
</script>

<div class="page-content">
    <Wrapper>
        <div class="items-topbar">
            <h1>Items</h1>

            <div class="sort-controls" aria-label="Items sorting controls">
                <label>
                    Sort by
                    <select bind:value={sortField}>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="volume">Volume (Money)</option>
                        <option value="pctChanged">Pct Changed</option>
                        <option value="price">Price</option>
                    </select>
                </label>

                <label>
                    Direction
                    <select bind:value={sortDirection}>
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </select>
                </label>
            </div>
        </div>

        {#if data.ok}
            {#if sortedItems.length === 0}
                <Card title="Items">
                    <p class="empty-state">No item data available.</p>
                </Card>
            {:else}
                <div class="items-grid">
                    {#each sortedItems as item (item.itemCode)}
                        <ItemMarketCard {item} />
                    {/each}
                </div>
            {/if}
        {:else}
            <Card title="Items">
                <p class="empty-state">GraphQL check failed: {data.error}</p>
            </Card>
        {/if}
    </Wrapper>
</div>

<style lang="scss">
    div.page-content {
        margin: 0 8px;
        margin-top: 24px;
        margin-bottom: 24px;
    }

    div.items-topbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 12px;
        margin-bottom: 18px;

        h1 {
            margin: 0;
            color: #c2c6d6;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
    }

    div.sort-controls {
        display: flex;
        gap: 10px;

        label {
            display: flex;
            flex-direction: column;
            gap: 4px;
            color: #8c909f;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        select {
            border: 1px solid #353535;
            background: #1f1f1f;
            color: #c2c6d6;
            font-size: 12px;
            border-radius: 4px;
            padding: 6px 8px;
            outline: none;
            min-width: 130px;
        }
    }

    div.items-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
    }

    p.empty-state {
        margin: 0;
        color: #8c909f;
    }

    @media (max-width: 1200px) {
        div.items-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    @media (max-width: 900px) {
        div.items-topbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
        }

        div.sort-controls {
            width: 100%;

            label {
                flex: 1;
            }

            select {
                min-width: 0;
                width: 100%;
            }
        }

        div.items-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 560px) {
        div.items-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
