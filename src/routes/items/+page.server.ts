import type { PageServerLoad } from "./$types";
import type {
    ItemHourlySeries,
    ItemMarketReportSummary,
    ItemsPageLoadData,
    ItemsQueryResult,
} from "$lib";
import { MARKET_ITEM_CODES } from "$lib/helpers";
import { runGraphQL } from "$lib/server/graphql/client";

const ITEM_CODES = MARKET_ITEM_CODES;

type ItemCandlePoint = {
    bucketStart: string;
    avg: number;
};

const ITEMS_QUERY = `
	query ItemsPageData($from: DateTime!, $to: DateTime!) {
${ITEM_CODES.map(
    (code) =>
        `        ${code}MarketReport: itemMarketReport(itemCode: "${code}") {
			...MarketReportFields
		}`,
).join("\n")}

${ITEM_CODES.map(
    (code) =>
        `        ${code}Candles: itemCandles(itemCode: "${code}", from: $from, to: $to) {
			...CandleFields
		}`,
).join("\n")}
	}

	fragment MarketReportFields on ItemMarketReport {
		itemCode
		volume24h
		avgWeighted24h
		pctChange24h
	}

	fragment CandleFields on ItemCandle {
		bucketStart
		avg
	}
`;

function getLast24HoursWindow() {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);

    return {
        from: from.toISOString(),
        to: to.toISOString(),
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function parseMarketReport(value: unknown): ItemMarketReportSummary | null {
    if (!isRecord(value)) {
        return null;
    }

    const itemCode = value.itemCode;
    const volume24h = value.volume24h;
    const avgWeighted24h = value.avgWeighted24h;
    const pctChange24h = value.pctChange24h;

    if (
        typeof itemCode !== "string" ||
        typeof volume24h !== "number" ||
        typeof avgWeighted24h !== "number" ||
        typeof pctChange24h !== "number"
    ) {
        return null;
    }

    return {
        itemCode,
        volume24h,
        avgWeighted24h,
        pctChange24h,
    };
}

function parseCandles(value: unknown): ItemCandlePoint[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const candles: ItemCandlePoint[] = [];

    for (const entry of value) {
        if (!isRecord(entry)) {
            continue;
        }

        const bucketStart = entry.bucketStart;
        const avg = entry.avg;

        if (typeof bucketStart !== "string" || typeof avg !== "number") {
            continue;
        }

        candles.push({ bucketStart, avg });
    }

    return candles;
}

function getUtcHourStartIso(value: string): string | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    date.setUTCMinutes(0, 0, 0);
    return date.toISOString();
}

function buildHourlyAveragePrices(candles: ItemCandlePoint[]): number[] {
    const perHour = new Map<string, { sum: number; count: number }>();

    for (const candle of candles) {
        const hourStart = getUtcHourStartIso(candle.bucketStart);
        if (!hourStart) {
            continue;
        }

        const current = perHour.get(hourStart);
        if (!current) {
            perHour.set(hourStart, { sum: candle.avg, count: 1 });
            continue;
        }

        current.sum += candle.avg;
        current.count += 1;
    }

    return [...perHour.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, value]) => value.sum / value.count);
}

function buildEmptyItems(): ItemHourlySeries[] {
    return ITEM_CODES.map((itemCode) => ({
        itemCode,
        report: null,
        hourlyAvgPrices: [],
    }));
}

function buildItems(data: ItemsQueryResult | undefined): ItemHourlySeries[] {
    return ITEM_CODES.map((itemCode) => {
        const reportKey = `${itemCode}MarketReport`;
        const candlesKey = `${itemCode}Candles`;

        const report = parseMarketReport(data?.[reportKey]);
        const candles = parseCandles(data?.[candlesKey]);

        return {
            itemCode,
            report,
            hourlyAvgPrices: buildHourlyAveragePrices(candles),
        };
    });
}

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        const range = getLast24HoursWindow();
        const result = await runGraphQL<ItemsQueryResult>(
            fetch,
            ITEMS_QUERY,
            range,
        );

        if (result.errors?.length) {
            return {
                ok: false,
                error: result.errors[0]?.message || "Unknown server error",
                items: buildEmptyItems(),
            } satisfies ItemsPageLoadData;
        }

        return {
            ok: true,
            items: buildItems(result.data),
        } satisfies ItemsPageLoadData;
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            items: buildEmptyItems(),
        } satisfies ItemsPageLoadData;
    }
};
