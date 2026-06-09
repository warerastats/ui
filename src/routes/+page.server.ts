import type { PageServerLoad } from "./$types";
import type { IndexPageLoadData, IndexQueryResult } from "$lib";
import { runGraphQL } from "$lib/server/graphql/client";

const INDEX_QUERY = `
    query IndexPageData($from: DateTime!, $to: DateTime!) {
        latestMarketState {
            avgWage24h
            wageVolume24h
            marketVolume24h
            wageMin
            wageMax
            wageAvgWeighted
        }
        battles(first: 5, filter: FINALIZED) {
            id
            winnerSide
            attackerCountry {
                id
                name
            }
            attackerDamages
            defenderCountry {
                id
                name
            }
            defenderDamages
        }
        inflation(
            from: $from
            to: $to
        ) {
            dayStart
            pctChange24h
        }
    }
`;

function getLast30FullUtcDaysWindow() {
        const now = new Date();
        const to = new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
        const from = new Date(to);
        from.setUTCDate(from.getUTCDate() - 30);

        return {
                from: from.toISOString(),
                to: to.toISOString(),
        };
}

export const load: PageServerLoad = async ({ fetch }) => {
        try {
                const range = getLast30FullUtcDaysWindow();
                const result = await runGraphQL<IndexQueryResult>(
                        fetch,
                        INDEX_QUERY,
                        range,
                );

                if (result.errors?.length) {
                        return {
                                ok: false,
                                error: result.errors[0]?.message || "Unknown server error",
                                latestMarketState: null,
                                battles: [],
                                inflation: [],
                        } satisfies IndexPageLoadData;
                }

                return {
                        ok: true,
                        latestMarketState: result.data?.latestMarketState ?? null,
                        battles: result.data?.battles ?? [],
                        inflation: result.data?.inflation ?? [],
                } satisfies IndexPageLoadData;
        } catch (error) {
                return {
                        ok: false,
                        error: error instanceof Error ? error.message : "Unknown server error",
                        latestMarketState: null,
                        battles: [],
                        inflation: [],
                } satisfies IndexPageLoadData;
        }
};
