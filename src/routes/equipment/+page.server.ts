import type { PageServerLoad } from "./$types";
import type { EquipmentPageLoadData, EquipmentPricingItem } from "$lib";
import { EQUIPMENT_ITEM_CODES } from "$lib/helpers";
import { runGraphQL } from "$lib/server/graphql/client";

const WINDOW_DAYS = 14;

const EQUIPMENT_QUERY = `
	query EquipmentPricingData {
${EQUIPMENT_ITEM_CODES.map(
    (code) =>
        `		${code}: equipmentPricing(itemCode: "${code}", windowDays: ${WINDOW_DAYS}) {
			window {
				weightedAvg
				count
			}
		}`,
).join("\n")}
	}
`;

type EquipmentQueryResult = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function parseWindowPrice(value: unknown): EquipmentPricingItem["window"] {
    if (!isRecord(value)) {
        return null;
    }

    const window = value.window;
    if (!isRecord(window)) {
        return null;
    }

    const weightedAvg = window.weightedAvg;
    const count = window.count;

    if (typeof weightedAvg !== "number" || typeof count !== "number") {
        return null;
    }

    return { weightedAvg, count };
}

export const load: PageServerLoad = async ({
    fetch,
}): Promise<EquipmentPageLoadData> => {
    try {
        const result = await runGraphQL<EquipmentQueryResult>(
            fetch,
            EQUIPMENT_QUERY,
        );

        if (result.errors && result.errors.length > 0) {
            const message =
                result.errors[0]?.message ?? "Unknown GraphQL error";
            return {
                ok: false,
                error: message,
                items: [],
            };
        }

        const data = result.data ?? {};
        const items: EquipmentPricingItem[] = EQUIPMENT_ITEM_CODES.map(
            (code) => ({
                itemCode: code,
                window: parseWindowPrice(data[code]),
            }),
        );

        return {
            ok: true,
            items,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return {
            ok: false,
            error: message,
            items: [],
        };
    }
};
