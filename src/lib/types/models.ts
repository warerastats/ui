export type CountrySummary = {
    id: string;
    name: string;
};

export type BattleSummary = {
    id: string;
    winnerSide: string | null;
    attackerCountry: CountrySummary | null;
    attackerDamages: number;
    defenderCountry: CountrySummary | null;
    defenderDamages: number;
};

export type MarketState = {
    avgWage24h: number;
    wageVolume24h: number;
    marketVolume24h: number;
    wageMin: number;
    wageMax: number;
    wageAvgWeighted: number;
};

export type InflationPoint = {
    dayStart: string;
    pctChange24h: number;
};

export type SearchResultItem =
    | { __typename: "Country"; id: string; name: string; code: string }
    | { __typename: "Mu"; id: string; name: string; avatarUrl: string }
    | { __typename: "Party"; id: string; name: string; avatarUrl: string }
    | {
          __typename: "User";
          id: string;
          username: string;
          avatarUrl: string;
      };
