import type { PageServerLoad } from "./$types";
import type { ItemDetailPageLoadData, ItemDetailQueryResult } from "$lib";
import { runGraphQL } from "$lib/server/graphql/client";

const ITEM_PAGE_QUERY = `
	query ItemPageData($itemCode: String!, $from: DateTime!, $to: DateTime!) {
		itemMarketReport(itemCode: $itemCode) {
			itemCode
			volume24h
			avgWeighted24h
			pctChange24h
			low24h
			high24h
			spread
			bids {
				price
				quantity
			}
			asks {
				price
				quantity
			}
			effectiveBuy {
				size
				avgPrice
			}
			effectiveSell {
				size
				avgPrice
			}
			updatedAt
		}
		itemCandles(itemCode: $itemCode, from: $from, to: $to) {
			bucketStart
			open
			high
			low
			close
			avg
			volume
			money
			count
		}
		transactions(itemCode: $itemCode) {
			edges {
				... on TradeTransaction {
					money
					quantity
					timeTillSale
					seller {
						id
						username
						avatarUrl
					}
					buyer {
						id
						username
						avatarUrl
					}
					sellerMu {
						id
						name
						avatarUrl
					}
					buyerMu {
						id
						name
						avatarUrl
					}
					sellerCountry {
						id
						name
						code
					}
					buyerCountry {
						id
						name
						code
					}
				}
			}
		}
	}
`;

function getLast14DaysWindow() {
    const to = new Date();
    const from = new Date(to.getTime() - 14 * 24 * 60 * 60 * 1000);

    return {
        from: from.toISOString(),
        to: to.toISOString(),
    };
}

export const load: PageServerLoad = async ({ fetch, params }) => {
    const itemCode = params.itemCode;

    try {
        const range = getLast14DaysWindow();
        const result = await runGraphQL<ItemDetailQueryResult>(
            fetch,
            ITEM_PAGE_QUERY,
            {
                itemCode,
                from: range.from,
                to: range.to,
            },
        );

        if (result.errors?.length) {
            return {
                ok: false,
                itemCode,
                error: result.errors[0]?.message || "Unknown server error",
                marketReport: null,
                candles: [],
                transactions: [],
            } satisfies ItemDetailPageLoadData;
        }

        return {
            ok: true,
            itemCode,
            marketReport: result.data?.itemMarketReport ?? null,
            candles: result.data?.itemCandles ?? [],
            transactions: result.data?.transactions.edges ?? [],
        } satisfies ItemDetailPageLoadData;
    } catch (error) {
        return {
            ok: false,
            itemCode,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            marketReport: null,
            candles: [],
            transactions: [],
        } satisfies ItemDetailPageLoadData;
    }
};
