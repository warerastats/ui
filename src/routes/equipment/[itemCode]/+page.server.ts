import type { PageServerLoad } from "./$types";
import type {
    EquipmentDetailPageLoadData,
    EquipmentDetailPricing,
    EquipmentMarketTransaction,
    EquipmentSkillPrice,
    FloatEntry,
} from "$lib";
import { EQUIPMENT_ITEM_CODES, getEquipmentWindowDays } from "$lib/helpers";
import { runGraphQL } from "$lib/server/graphql/client";

const EQUIPMENT_DETAIL_QUERY = `
	query EquipmentDetailData($itemCode: String!, $windowDays: Int!) {
		equipmentPricing(itemCode: $itemCode, windowDays: $windowDays) {
			window {
				weightedAvg
				count
			}
			skills {
				skills {
					key
					value
				}
				min
				max
				avg
				volume
			}
		}
		transactions(itemCode: $itemCode, first: 30) {
			edges {
				... on MarketTransaction {
					money
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
					item {
						id
						skills {
							key
							value
						}
					}
				}
			}
		}
	}
`;

type QueryResult = {
    equipmentPricing: {
        window: { weightedAvg: number; count: number } | null;
        skills: Array<{
            skills: Array<{ key: string; value: number }>;
            min: number;
            max: number;
            avg: number;
            volume: number;
        }>;
    } | null;
    transactions: {
        edges: Array<Record<string, unknown>>;
    };
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function parsePricing(
    data: QueryResult["equipmentPricing"],
): EquipmentDetailPricing {
    if (!data) {
        return { window: null, skills: [] };
    }

    const window =
        data.window &&
        typeof data.window.weightedAvg === "number" &&
        typeof data.window.count === "number"
            ? { weightedAvg: data.window.weightedAvg, count: data.window.count }
            : null;

    const skills: EquipmentSkillPrice[] = (data.skills ?? [])
        .filter(
            (s) =>
                Array.isArray(s.skills) &&
                typeof s.min === "number" &&
                typeof s.max === "number" &&
                typeof s.avg === "number" &&
                typeof s.volume === "number",
        )
        .map((s) => ({
            skills: s.skills.map(
                (sk): FloatEntry => ({ key: sk.key, value: sk.value }),
            ),
            min: s.min,
            max: s.max,
            avg: s.avg,
            volume: s.volume,
        }));

    return { window, skills };
}

function parseTransactions(
    edges: Array<Record<string, unknown>>,
): EquipmentMarketTransaction[] {
    const result: EquipmentMarketTransaction[] = [];

    for (const edge of edges) {
        if (
            typeof edge.money !== "number" ||
            !isRecord(edge.seller) ||
            !isRecord(edge.buyer) ||
            !isRecord(edge.item)
        ) {
            continue;
        }

        const seller = edge.seller;
        const buyer = edge.buyer;
        const item = edge.item;

        if (
            typeof seller.id !== "string" ||
            typeof seller.username !== "string" ||
            typeof seller.avatarUrl !== "string" ||
            typeof buyer.id !== "string" ||
            typeof buyer.username !== "string" ||
            typeof buyer.avatarUrl !== "string" ||
            typeof item.id !== "string" ||
            !Array.isArray(item.skills)
        ) {
            continue;
        }

        const skills: FloatEntry[] = item.skills
            .filter(
                (s: unknown) =>
                    isRecord(s) &&
                    typeof s.key === "string" &&
                    typeof s.value === "number",
            )
            .map((s: Record<string, unknown>) => ({
                key: s.key as string,
                value: s.value as number,
            }));

        result.push({
            money: edge.money,
            seller: {
                id: seller.id,
                username: seller.username,
                avatarUrl: seller.avatarUrl,
            },
            buyer: {
                id: buyer.id,
                username: buyer.username,
                avatarUrl: buyer.avatarUrl,
            },
            item: { id: item.id, skills },
        });
    }

    return result;
}

export const load: PageServerLoad = async ({
    fetch,
    params,
}): Promise<EquipmentDetailPageLoadData> => {
    const itemCode = params.itemCode;
    const windowDays = getEquipmentWindowDays(itemCode);

    if (!(EQUIPMENT_ITEM_CODES as readonly string[]).includes(itemCode)) {
        return {
            ok: false,
            itemCode,
            windowDays,
            error: `Unknown equipment: ${itemCode}`,
            pricing: null,
            transactions: [],
        };
    }

    try {
        const result = await runGraphQL<QueryResult>(
            fetch,
            EQUIPMENT_DETAIL_QUERY,
            { itemCode, windowDays },
        );

        if (result.errors?.length) {
            return {
                ok: false,
                itemCode,
                windowDays,
                error: result.errors[0]?.message ?? "Unknown GraphQL error",
                pricing: null,
                transactions: [],
            };
        }

        const pricing = parsePricing(result.data?.equipmentPricing ?? null);
        const transactions = parseTransactions(
            result.data?.transactions?.edges ?? [],
        );

        return {
            ok: true,
            itemCode,
            windowDays,
            pricing,
            transactions,
        };
    } catch (err) {
        return {
            ok: false,
            itemCode,
            windowDays,
            error: err instanceof Error ? err.message : "Unknown error",
            pricing: null,
            transactions: [],
        };
    }
};
