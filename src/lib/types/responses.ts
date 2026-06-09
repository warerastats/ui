import type {
    BattleSummary,
    InflationPoint,
    MarketState,
    SearchResultItem,
} from "./models";

export type IndexQueryResult = {
    latestMarketState: MarketState | null;
    battles: BattleSummary[];
    inflation: InflationPoint[];
};

export type IndexPageLoadSuccess = {
    ok: true;
    latestMarketState: MarketState | null;
    battles: BattleSummary[];
    inflation: InflationPoint[];
};

export type IndexPageLoadFailure = {
    ok: false;
    error: string;
    latestMarketState: null;
    battles: BattleSummary[];
    inflation: InflationPoint[];
};

export type IndexPageLoadData = IndexPageLoadSuccess | IndexPageLoadFailure;

export interface SearchResponse {
    search: SearchResultItem[];
}

export type SearchApiResponse = {
    results: SearchResultItem[];
    error?: string;
};
