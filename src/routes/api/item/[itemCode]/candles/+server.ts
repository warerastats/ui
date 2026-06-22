import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { runGraphQL } from "$lib/server/graphql/client";
import type { ItemCandle } from "$lib";

const ITEM_CANDLES_QUERY = `
  query ItemCandlesPoll($itemCode: String!, $from: DateTime!, $to: DateTime!) {
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
  }
`;

type ItemCandlesQueryResult = {
    itemCandles: ItemCandle[];
};

function getDefaultRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
}

function asIsoDate(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

export const GET: RequestHandler = async ({ fetch, params, url }) => {
    const itemCode = params.itemCode?.trim();

    if (!itemCode) {
        return json(
            { error: "Missing item code", candles: [] },
            { status: 400 },
        );
    }

    const defaultRange = getDefaultRange();
    const from = asIsoDate(url.searchParams.get("from")) ?? defaultRange.from;
    const to = asIsoDate(url.searchParams.get("to")) ?? defaultRange.to;

    if (new Date(from).getTime() >= new Date(to).getTime()) {
        return json(
            { error: "Invalid range: from must be before to", candles: [] },
            { status: 400 },
        );
    }

    try {
        const result = await runGraphQL<ItemCandlesQueryResult>(
            fetch,
            ITEM_CANDLES_QUERY,
            { itemCode, from, to },
        );

        if (result.errors?.length) {
            return json(
                {
                    error: result.errors[0]?.message || "Unknown GraphQL error",
                    candles: [],
                },
                { status: 502 },
            );
        }

        return json({ candles: result.data?.itemCandles ?? [] });
    } catch (error) {
        return json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown server error",
                candles: [],
            },
            { status: 500 },
        );
    }
};
