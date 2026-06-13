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

export type ItemMarketReportSummary = {
    itemCode: string;
    volume24h: number;
    avgWeighted24h: number;
    pctChange24h: number;
};

export type ItemHourlySeries = {
    itemCode: string;
    report: ItemMarketReportSummary | null;
    hourlyAvgPrices: number[];
};

export type ItemOrderbookLevel = {
    price: number;
    quantity: number;
};

export type ItemEffectivePrice = {
    size: number;
    avgPrice: number;
};

export type ItemMarketReport = {
    itemCode: string;
    volume24h: number;
    avgWeighted24h: number;
    pctChange24h: number;
    low24h: number;
    high24h: number;
    spread: number;
    bids: ItemOrderbookLevel[];
    asks: ItemOrderbookLevel[];
    effectiveBuy: ItemEffectivePrice[];
    effectiveSell: ItemEffectivePrice[];
    updatedAt: string;
};

export type ItemCandle = {
    bucketStart: string;
    open: number;
    high: number;
    low: number;
    close: number;
    avg: number;
    volume: number;
    money: number;
    count: number;
};

export type TradeTransactionEdge = {
    __typename: "TradeTransaction";
    money: number;
    quantity: number;
    timeTillSale: number;
    seller: {
        id: string;
        username: string;
        avatarUrl: string;
    };
    buyer: {
        id: string;
        username: string;
        avatarUrl: string;
    };
    sellerMu: {
        id: string;
        name: string;
        avatarUrl: string;
    } | null;
    buyerMu: {
        id: string;
        name: string;
        avatarUrl: string;
    } | null;
    sellerCountry: {
        id: string;
        name: string;
        code: string;
    } | null;
    buyerCountry: {
        id: string;
        name: string;
        code: string;
    } | null;
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

export type AllianceCountry = {
    id: string;
    name: string;
    code: string;
    userCount: number;
};

export type AllianceParticipation = {
    totalDamage: number;
    battleCount: number;
};

export type AllianceTopDamageUser = {
    id: string;
    username: string;
    avatarUrl: string;
};

export type AllianceTopDamageEntry = {
    user: AllianceTopDamageUser;
    totalDamage: number;
    battleCount: number;
};

export type AllianceMoneyFlow = {
    dayStart: string;
    inEquipment: number;
    outEquipment: number;
    inItems: number;
    outItems: number;
    inWages: number;
    outWages: number;
    inEquipmentInAlliance: number;
    outEquipmentInAlliance: number;
    inEquipmentOutsideAlliance: number;
    outEquipmentOutsideAlliance: number;
    inItemsInAlliance: number;
    outItemsInAlliance: number;
    inItemsOutsideAlliance: number;
    outItemsOutsideAlliance: number;
    inWagesInAlliance: number;
    outWagesInAlliance: number;
    inWagesOutsideAlliance: number;
    outWagesOutsideAlliance: number;
};

export type Alliance = {
    name: string;
    countries: AllianceCountry[];
    participation: AllianceParticipation;
    topDamage: AllianceTopDamageEntry[];
    moneyFlows: AllianceMoneyFlow[];
};
