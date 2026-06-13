import type {
    Alliance,
    BattleSummary,
    InflationPoint,
    ItemCandle,
    ItemHourlySeries,
    ItemMarketReport,
    MarketState,
    Mu,
    Party,
    User,
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

export type AllianceQueryResult = {
    alliance: Alliance;
};

export type AlliancePageLoadSuccess = {
    ok: true;
    id: string;
    alliance: Alliance;
};

export type AlliancePageLoadFailure = {
    ok: false;
    id: string;
    error: string;
    alliance: null;
};

export type AlliancePageLoadData =
    | AlliancePageLoadSuccess
    | AlliancePageLoadFailure;

export type MuQueryResult = {
    mu: Mu;
};

export type MuPageLoadSuccess = {
    ok: true;
    id: string;
    mu: Mu;
};

export type MuPageLoadFailure = {
    ok: false;
    id: string;
    error: string;
    mu: null;
};

export type MuPageLoadData = MuPageLoadSuccess | MuPageLoadFailure;

export type PartyQueryResult = {
    party: Party;
};

export type PartyPageLoadSuccess = {
    ok: true;
    id: string;
    party: Party;
};

export type PartyPageLoadFailure = {
    ok: false;
    id: string;
    error: string;
    party: null;
};

export type PartyPageLoadData = PartyPageLoadSuccess | PartyPageLoadFailure;

export type UserQueryResult = {
    user: User;
};

export type UserPageLoadSuccess = {
    ok: true;
    id: string;
    user: User;
};

export type UserPageLoadFailure = {
    ok: false;
    id: string;
    error: string;
    user: null;
};

export type UserPageLoadData = UserPageLoadSuccess | UserPageLoadFailure;
