<script lang="ts">
    import Coin from "$lib/components/Coin.svelte";
    import CountryFlag from "$lib/components/CountryFlag.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";
    import { formatCompactNumber, formatMoney } from "$lib/helpers";
    import type { TradeTransactionEdge } from "$lib";

    let { transactions }: { transactions: TradeTransactionEdge[] } = $props();

    type Side = "buyer" | "seller";

    type DisplayEntity = {
        href: string;
        label: string;
        type: "user" | "mu" | "country";
        avatarUrl?: string;
        countryCode?: string;
    };

    function getDisplayEntity(
        transaction: TradeTransactionEdge,
        side: Side,
    ): DisplayEntity {
        if (side === "buyer") {
            if (transaction.buyerMu) {
                return {
                    href: `/mu/${transaction.buyerMu.id}`,
                    label: transaction.buyerMu.name,
                    type: "mu",
                    avatarUrl: transaction.buyerMu.avatarUrl,
                };
            }

            if (transaction.buyerCountry) {
                return {
                    href: `/country/${transaction.buyerCountry.id}`,
                    label: transaction.buyerCountry.name,
                    type: "country",
                    countryCode: transaction.buyerCountry.code,
                };
            }

            return {
                href: `/user/${transaction.buyer.id}`,
                label: transaction.buyer.username,
                type: "user",
                avatarUrl: transaction.buyer.avatarUrl,
            };
        }

        if (transaction.sellerMu) {
            return {
                href: `/mu/${transaction.sellerMu.id}`,
                label: transaction.sellerMu.name,
                type: "mu",
                avatarUrl: transaction.sellerMu.avatarUrl,
            };
        }

        if (transaction.sellerCountry) {
            return {
                href: `/country/${transaction.sellerCountry.id}`,
                label: transaction.sellerCountry.name,
                type: "country",
                countryCode: transaction.sellerCountry.code,
            };
        }

        return {
            href: `/user/${transaction.seller.id}`,
            label: transaction.seller.username,
            type: "user",
            avatarUrl: transaction.seller.avatarUrl,
        };
    }

    function getUnitPrice(transaction: TradeTransactionEdge): number {
        if (transaction.quantity <= 0) {
            return 0;
        }

        return transaction.money / transaction.quantity;
    }

    function formatTimeTillSale(secondsLike: number): string {
        const seconds = Math.max(0, Math.round(secondsLike));

        if (seconds < 60) {
            return `${seconds}s`;
        }

        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const rem = seconds % 60;
            return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`;
        }

        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
</script>

{#if transactions.length === 0}
    <p class="empty-state">No transactions found.</p>
{:else}
    <div class="transactions-list" role="list" aria-label="Item transactions">
        {#each transactions as transaction, index (`tx-${index}`)}
            {@const buyer = getDisplayEntity(transaction, "buyer")}
            {@const seller = getDisplayEntity(transaction, "seller")}
            {@const unitPrice = getUnitPrice(transaction)}

            <div class="transaction-row" role="listitem">
                <a
                    href={seller.href}
                    class="party seller"
                    aria-label={`View seller ${seller.label}`}
                >
                    <span class="party-label">Seller</span>
                    <span class="party-main">
                        {#if seller.type === "country" && seller.countryCode}
                            <CountryFlag
                                code={seller.countryCode}
                                height="20px"
                            />
                        {:else}
                            <UserAvatar
                                src={seller.avatarUrl}
                                alt={seller.label}
                                width="20px"
                                height="20px"
                            />
                        {/if}
                        <span class="name">{seller.label}</span>
                    </span>
                </a>

                <div class="trade-center">
                    <div class="trade-line">
                        <span class="money-value">
                            <Coin width="12px" height="12px" />
                            {formatMoney(transaction.money, 4)}
                        </span>
                        <span class="separator">for</span>
                        <span class="qty-value"
                            >{formatCompactNumber(transaction.quantity)}</span
                        >
                        <span class="separator">at</span>
                        <span class="money-value muted">
                            <Coin width="12px" height="12px" />
                            {formatMoney(unitPrice, 4)}
                            <span class="each">/ each</span>
                        </span>
                    </div>

                    <span class="time-pill"
                        >Time to sale: {formatTimeTillSale(
                            transaction.timeTillSale,
                        )}</span
                    >
                </div>

                <a
                    href={buyer.href}
                    class="party buyer"
                    aria-label={`View buyer ${buyer.label}`}
                >
                    <span class="party-label">Buyer</span>
                    <span class="party-main">
                        {#if buyer.type === "country" && buyer.countryCode}
                            <CountryFlag
                                code={buyer.countryCode}
                                height="20px"
                            />
                        {:else}
                            <UserAvatar
                                src={buyer.avatarUrl}
                                alt={buyer.label}
                                width="20px"
                                height="20px"
                            />
                        {/if}
                        <span class="name">{buyer.label}</span>
                    </span>
                </a>
            </div>
        {/each}
    </div>
{/if}

<style lang="scss">
    p.empty-state {
        margin: 0;
        color: #8c909f;
    }

    div.transactions-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    div.transaction-row {
        border: 1px solid #353535;
        background: #1f1f1f;
        padding: 10px;
        display: grid;
        grid-template-columns: minmax(250px, 1.4fr) minmax(290px, 0.9fr) minmax(
                250px,
                1.4fr
            );
        align-items: center;
        gap: 10px;
    }

    a.party {
        display: flex;
        flex-direction: column;
        gap: 6px;
        text-decoration: none;
        min-width: 0;
        padding: 2px 0;

        span.party-label {
            color: #8c909f;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            font-weight: 700;
        }

        span.party-main {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #c2c6d6;
            font-size: 14px;
            font-weight: 600;

            span.name {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        &.seller {
            justify-self: start;

            &:hover span.party-main {
                color: #ffb4ab;
            }
        }

        &.buyer {
            justify-self: end;
            text-align: right;

            span.party-main {
                justify-content: flex-end;
            }

            &:hover span.party-main {
                color: #4af0c0;
            }
        }
    }

    div.trade-center {
        border: 1px solid #303030;
        background: #171717;
        border-radius: 6px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 7px;
        align-items: center;
    }

    div.trade-line {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 6px;
        color: #c2c6d6;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
    }

    span.separator {
        color: #8c909f;
    }

    span.qty-value {
        font-weight: 700;
        color: #d7dae6;
    }

    span.money-value {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 700;

        &.muted {
            color: #adb1c0;
        }

        span.each {
            color: #8c909f;
            font-size: 11px;
            font-weight: 600;
        }
    }

    span.time-pill {
        border: 1px solid #353535;
        background: #1f1f1f;
        color: #8c909f;
        padding: 4px 8px;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 600;
    }

    @media (max-width: 980px) {
        div.transaction-row {
            grid-template-columns: 1fr;
            gap: 8px;
        }

        a.party.buyer {
            justify-self: start;
            text-align: left;

            span.party-main {
                justify-content: flex-start;
            }
        }
    }
</style>
