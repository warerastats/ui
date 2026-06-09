import type { PageServerLoad } from "./$types";
import { runGraphQL } from "$lib/server/graphql/client";

type CountrySummary = {
    id: string;
    name: string;
};

type BattleSummary = {
    id: string;
    winnerSide: string | null;
    attackerCountry: CountrySummary | null;
    attackerDamages: number;
    defenderCountry: CountrySummary | null;
    defenderDamages: number;
};

type MarketState = {
    avgWage24h: number;
    wageVolume24h: number;
    marketVolume24h: number;
    wageMin: number;
    wageMax: number;
    wageAvgWeighted: number;
};

type Inflation = {
    dayStart: string;
    pctChange24h: number;
};

type IndexQueryResult = {
    latestMarketState: MarketState | null;
    battles: BattleSummary[];
    latestInflation: Inflation | null;
};

const INDEX_QUERY = `
  query IndexPageData {
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
    latestInflation {
      dayStart
      pctChange24h
    }
  }
`;

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        const result = await runGraphQL<IndexQueryResult>(fetch, INDEX_QUERY);

        if (result.errors?.length) {
            return {
                ok: false,
                error: result.errors[0]?.message || "Unknown GraphQL error",
                latestMarketState: null,
                battles: [] as BattleSummary[],
                latestInflation: null,
            };
        }

        return {
            ok: true,
            latestMarketState: result.data?.latestMarketState ?? null,
            battles: result.data?.battles ?? [],
            latestInflation: result.data?.latestInflation ?? null,
        };
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            latestMarketState: null,
            battles: [] as BattleSummary[],
            latestInflation: null,
        };
    }
};
