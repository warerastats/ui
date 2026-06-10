import type {
    BattleSummary,
    InflationPoint,
    ItemCandle,
    ItemHourlySeries,
    ItemMarketReport,
    MarketState,
    SearchResultItem,
    TradeTransactionEdge,
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

export type ItemDetailQueryResult = {
    itemMarketReport: ItemMarketReport | null;
    itemCandles: ItemCandle[];
    transactions: {
        edges: TradeTransactionEdge[];
    };
};

export type ItemDetailPageLoadSuccess = {
    ok: true;
    itemCode: string;
    marketReport: ItemMarketReport | null;
    candles: ItemCandle[];
    transactions: TradeTransactionEdge[];
};

export type ItemDetailPageLoadFailure = {
    ok: false;
    itemCode: string;
    error: string;
    marketReport: null;
    candles: ItemCandle[];
    transactions: TradeTransactionEdge[];
};

export type ItemDetailPageLoadData =
    | ItemDetailPageLoadSuccess
    | ItemDetailPageLoadFailure;

export type ItemTransactionsQueryResult = {
    transactions: {
        edges: TradeTransactionEdge[];
    };
};

export type ItemTransactionsApiResponse = {
    results: TradeTransactionEdge[];
    error?: string;
};

export interface SearchResponse {
    search: SearchResultItem[];
}

export type SearchApiResponse = {
    results: SearchResultItem[];
    error?: string;
};
