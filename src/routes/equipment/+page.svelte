<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import Coin from "$lib/components/Coin.svelte";
    import ItemImage from "$lib/components/ItemImage.svelte";
    import Wrapper from "$lib/components/Wrapper.svelte";
    import {
        formatCompactNumber,
        formatMoney,
        getItemName,
        EQUIPMENT_GROUPS,
    } from "$lib/helpers";
    import type { EquipmentPricingItem } from "$lib";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    const GROUP_ENTRIES = Object.entries(EQUIPMENT_GROUPS) as [
        string,
        readonly string[],
    ][];

    function getGroupItems(
        codes: readonly string[],
        all: EquipmentPricingItem[],
    ): EquipmentPricingItem[] {
        const map = new Map(all.map((i) => [i.itemCode, i]));
        return codes
            .map((c) => map.get(c))
            .filter((i): i is EquipmentPricingItem => i !== undefined);
    }
</script>

<div class="page-content">
    <Wrapper>
        <div class="equipment-topbar">
            <h1>Equipment</h1>
        </div>

        {#if data.ok}
            {#each GROUP_ENTRIES as [groupName, codes]}
                {@const items = getGroupItems(codes, data.items)}
                {#if items.length > 0}
                    <section class="equipment-group">
                        <h2>{groupName}</h2>
                        <div class="equipment-grid">
                            {#each items as item (item.itemCode)}
                                <a
                                    href={`/equipment/${item.itemCode}`}
                                    class="equipment-link"
                                    aria-label={`Open ${getItemName(item.itemCode)}`}
                                >
                                    <Card
                                        class="equipment-card"
                                        headerBorder={false}
                                    >
                                        <div class="item-header">
                                            <ItemImage
                                                itemCode={item.itemCode}
                                                size={48}
                                            />
                                            <h3>
                                                {getItemName(item.itemCode)}
                                            </h3>
                                        </div>

                                        {#if item.window}
                                            <div class="metrics">
                                                <div class="metric">
                                                    <span class="label"
                                                        >Avg Price</span
                                                    >
                                                    <span
                                                        class="value coin-value"
                                                    >
                                                        <Coin
                                                            width="12px"
                                                            height="12px"
                                                        />
                                                        {formatMoney(
                                                            item.window
                                                                .weightedAvg,
                                                            3,
                                                        )}
                                                    </span>
                                                </div>
                                                <div class="metric">
                                                    <span class="label"
                                                        >Volume</span
                                                    >
                                                    <span
                                                        class="value coin-value"
                                                    >
                                                        <Coin
                                                            width="12px"
                                                            height="12px"
                                                        />
                                                        {formatCompactNumber(
                                                            item.window.count *
                                                                item.window
                                                                    .weightedAvg,
                                                        )}
                                                    </span>
                                                </div>
                                                <div class="metric">
                                                    <span class="label"
                                                        >Trades</span
                                                    >
                                                    <span class="value"
                                                        >{item.window.count.toLocaleString()}</span
                                                    >
                                                </div>
                                            </div>
                                        {:else}
                                            <p class="empty-state">
                                                No pricing data available.
                                            </p>
                                        {/if}
                                    </Card>
                                </a>
                            {/each}
                        </div>
                    </section>
                {/if}
            {/each}
        {:else}
            <Card title="Equipment">
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

    div.equipment-topbar {
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

    section.equipment-group {
        margin-bottom: 24px;

        h2 {
            margin: 0 0 12px;
            color: #8c909f;
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    }

    div.equipment-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 12px;
    }

    a.equipment-link {
        display: block;
        text-decoration: none;
        color: inherit;
        border-radius: 8px;

        &:focus-visible {
            outline: 2px solid #4af0c0;
            outline-offset: 3px;
        }

        &:hover {
            :global(div.equipment-card) {
                transform: translateY(-1px);
                transition: transform 0.15s ease;
            }
        }
    }

    :global(div.equipment-card) {
        transition: transform 0.15s ease;
    }

    :global(div.equipment-card > div.body) {
        padding: 10px;
        gap: 8px;
        align-items: center;
    }

    div.item-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-align: center;

        h3 {
            margin: 0;
            color: #c2c6d6;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
        }
    }

    div.metrics {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
    }

    div.metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 4px;

        span.label {
            color: #8c909f;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        span.value {
            color: #c2c6d6;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: -0.2px;
        }

        span.coin-value {
            display: inline-flex;
            align-items: center;
            gap: 3px;

            :global(svg) {
                vertical-align: baseline;
                flex-shrink: 0;
            }
        }
    }

    p.empty-state {
        margin: 0;
        color: #8c909f;
    }

    @media (max-width: 1200px) {
        div.equipment-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
        }
    }

    @media (max-width: 900px) {
        div.equipment-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    @media (max-width: 560px) {
        div.equipment-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
</style>
