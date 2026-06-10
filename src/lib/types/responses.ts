import type {
    BattleSummary,
    InflationPoint,
    ItemHourlySeries,
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

export type ItemsPageLoadSuccess = {
    ok: true;
    items: ItemHourlySeries[];
};

export type ItemsPageLoadFailure = {
    ok: false;
    error: string;
    items: ItemHourlySeries[];
};

export type ItemsPageLoadData = ItemsPageLoadSuccess | ItemsPageLoadFailure;

export type ItemsQueryResult = Record<string, unknown>;

export interface SearchResponse {
    search: SearchResultItem[];
}

export type SearchApiResponse = {
    results: SearchResultItem[];
    error?: string;
};
