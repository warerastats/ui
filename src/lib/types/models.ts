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

export type BattleCountry = {
    id: string;
    name: string;
    code: string;
};

export type BattleRegion = {
    id: string;
    name: string;
    country: BattleCountry;
    initialCountry: BattleCountry;
};

export type BattleAlliance = {
    id: string;
    name: string;
};

export type BattleTopDamageEntry = {
    totalDamage: number;
    user: {
        id: string;
        username: string;
        avatarUrl: string;
    };
};

export type BattleOrderChangeEntity =
    | { __typename: "Country"; id: string; name: string; code: string }
    | { __typename: "Mu"; id: string; name: string; avatarUrl: string };

export type BattleOrderChange = {
    at: string;
    side: string;
    kind: string;
    action: string;
    entity: BattleOrderChangeEntity;
};

export type DamageReportEquipment = {
    itemCode: string;
    count: number;
    value: number;
};

export type DamageReport = {
    intervalStart: string;
    side: string;
    damage: number;
    equipment: DamageReportEquipment[];
};

export type Battle = {
    attackerDamages: number;
    defenderDamages: number;
    winnerSide: string | null;
    isActive: boolean;
    endedAt: string | null;
    attackerCountry: BattleCountry | null;
    defenderCountry: BattleCountry | null;
    defenderRegion: BattleRegion | null;
    attackerAlliance: BattleAlliance | null;
    defenderAlliance: BattleAlliance | null;
    topDamage: BattleTopDamageEntry[];
    orderChanges: BattleOrderChange[];
    damageReports: DamageReport[];
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

export type MuUser = {
    id: string;
    username: string;
    avatarUrl: string;
};

export type MuRegionCountry = {
    code: string;
};

export type MuRegion = {
    id: string;
    name: string;
    country: MuRegionCountry | null;
    initialCountry: MuRegionCountry | null;
};

export type MuOrderChange = {
    at: string;
    action: string;
    battle: {
        id: string;
        defenderRegion: MuRegion | null;
    };
};

export type MuNameHistoryEntry = {
    at: string;
    name: string;
};

export type MuOwnerHistoryEntry = {
    at: string;
    owner: MuUser;
};

export type MuWealthReport = {
    dayStart: string;
    totalDamage: number;
    totalWealth: number;
};

export type Mu = {
    name: string;
    avatarUrl: string;
    hq: number;
    dorms: number;
    mercRep: number;
    owner: MuUser | null;
    region: MuRegion | null;
    members: MuUser[];
    orderChanges: MuOrderChange[];
    nameHistory: MuNameHistoryEntry[];
    ownerHistory: MuOwnerHistoryEntry[];
    wealthReports: MuWealthReport[];
};

export type PartyEthics = {
    unethical: number;
    militarism: number;
    isolationism: number;
    imperialism: number;
    industrialism: number;
};

export type PartyCountry = {
    id: string;
    name: string;
    code: string;
};

export type PartyRegionCountry = {
    code: string;
};

export type PartyRegion = {
    id: string;
    name: string;
    country: PartyRegionCountry | null;
    initialCountry: PartyRegionCountry | null;
};

export type PartyUser = {
    id: string;
    username: string;
    avatarUrl: string;
};

export type PartyNameHistoryEntry = {
    at: string;
    name: string;
};

export type PartyLeaderHistoryEntry = {
    at: string;
    leader: PartyUser;
};

export type PartyEthicsHistoryEntry = {
    at: string;
    ethics: PartyEthics;
};

export type PartyWealthReport = {
    dayStart: string;
    memberCount: number;
    totalDamage: number;
    totalWealth: number;
};

export type PartyMoneyFlowCounterpart = {
    country: PartyCountry;
    inEquipment: number;
    outEquipment: number;
    inItems: number;
    outItems: number;
    inWages: number;
    outWages: number;
};

export type PartyMoneyFlow = {
    dayStart: string;
    inEquipment: number;
    inEquipmentInsideParty: number;
    inEquipmentOutsideAlliance: number;
    inEquipmentSameCountryOutsideParty: number;
    inEquipmentSameAllianceCrossBorder: number;
    outEquipment: number;
    outEquipmentInsideParty: number;
    outEquipmentOutsideAlliance: number;
    outEquipmentSameCountryOutsideParty: number;
    outEquipmentSameAllianceCrossBorder: number;
    inItems: number;
    inItemsInsideParty: number;
    inItemsOutsideAlliance: number;
    inItemsSameCountryOutsideParty: number;
    inItemsSameAllianceCrossBorder: number;
    outItems: number;
    outItemsInsideParty: number;
    outItemsOutsideAlliance: number;
    outItemsSameCountryOutsideParty: number;
    outItemsSameAllianceCrossBorder: number;
    inWages: number;
    inWagesInsideParty: number;
    inWagesOutsideAlliance: number;
    inWagesSameCountryOutsideParty: number;
    inWagesSameAllianceCrossBorder: number;
    outWages: number;
    outWagesInsideParty: number;
    outWagesOutsideAlliance: number;
    outWagesSameCountryOutsideParty: number;
    outWagesSameAllianceCrossBorder: number;
    counterparts: PartyMoneyFlowCounterpart[];
};

export type Party = {
    name: string;
    description: string;
    avatarUrl: string;
    ethics: PartyEthics;
    country: PartyCountry | null;
    region: PartyRegion | null;
    leader: PartyUser | null;
    members: PartyUser[];
    rulesCountries: PartyCountry[];
    nameHistory: PartyNameHistoryEntry[];
    leaderHistory: PartyLeaderHistoryEntry[];
    ethicsHistory: PartyEthicsHistoryEntry[];
    wealthReports: PartyWealthReport[];
    moneyFlows: PartyMoneyFlow[];
};

export type UserSkill = {
    key: string;
    value: number;
};

export type UserCountry = {
    id: string;
    name: string;
    code: string;
};

export type UserParty = {
    id: string;
    name: string;
    avatarUrl: string;
};

export type UserMu = {
    id: string;
    name: string;
    avatarUrl: string;
};

export type MarketTransaction = {
    __typename: "MarketTransaction";
    id: string;
    money: number;
    item: {
        itemCode: string;
        skills: UserSkill[];
    };
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
};

export type CaseTransaction = {
    __typename: "CaseTransaction";
    id: string;
    case: string;
    item: {
        itemCode: string;
        skills: UserSkill[];
    };
};

export type TradeTransaction = {
    __typename: "TradeTransaction";
    id: string;
    itemCode: string;
    quantity: number;
    money: number;
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

export type CraftTransaction = {
    __typename: "CraftTransaction";
    id: string;
    item: {
        itemCode: string;
        skills: UserSkill[];
    };
};

export type LootTransaction = {
    __typename: "LootTransaction";
    id: string;
    item: {
        itemCode: string;
        skills: UserSkill[];
    };
};

export type UserTransaction =
    | MarketTransaction
    | CaseTransaction
    | TradeTransaction
    | CraftTransaction
    | LootTransaction;

export type UserBattle = {
    id: string;
    defenderRegion: {
        name: string;
    } | null;
    attackerCountry: {
        id: string;
        name: string;
        code: string;
    } | null;
    defenderCountry: {
        id: string;
        name: string;
        code: string;
    } | null;
};

export type UserItem = {
    itemCode: string;
};

export type CompanyEmployee = {
    wage: number;
    fidelity: number;
    user: {
        id: string;
        username: string;
        avatarUrl: string;
    };
};

export type CompanyRegion = {
    id: string;
    name: string;
    country: {
        code: string;
    };
    initialCountry: {
        code: string;
    };
};

export type OwnedCompany = {
    id: string;
    name: string;
    itemCode: string;
    region: CompanyRegion;
    employees: CompanyEmployee[];
};

export type TradeOffer = {
    itemCode: string;
    side: string;
    quantity: number;
    fulfilled: number;
    cancelled: boolean;
    price: number;
    since: string;
};

export type SkillSnapshot = {
    since: string;
    set: {
        energy: number;
        health: number;
        hunger: number;
        attack: number;
        companies: number;
        entrepreneurship: number;
        production: number;
        criticalChance: number;
        criticalDamages: number;
        armor: number;
        precision: number;
        dodge: number;
        lootChance: number;
        management: number;
    };
};

export type UserNameHistoryEntry = {
    at: string;
    username: string;
};

export type UserCountryHistoryEntry = {
    at: string;
    country: UserCountry;
};

export type UserMuHistoryEntry = {
    at: string;
    mu: UserMu;
};

export type UserPartyHistoryEntry = {
    at: string;
    party: UserParty;
};

export type UserWageHistoryEntry = {
    at: string;
    wage: number;
};

export type FinanceReport = {
    dayStart: string;
    wagesPaid: number;
    wagesEarned: number;
    itemsBought: number;
    itemsSold: number;
    equipBought: number;
    equipSold: number;
    valueDismantled: number;
    casesOpened: number;
    casesNet: number;
};

export type FlipEvent = {
    itemCode: string;
    quantity: number;
    buyCost: number;
    sellRevenue: number;
    profit: number;
    heldMs: number;
    at: string;
};

export type FlipState = {
    totalFlips: number;
    totalProfit: number;
};

export type BattleParticipation = {
    totalDamage: number;
    battlesParticipated: number;
    negativeDamage: number;
    ownCountryBattles: number;
    ownCountryParticipated: number;
    muOrderBattles: number;
    muOrderParticipated: number;
    updatedAt: string;
};

export type User = {
    username: string;
    level: number;
    militaryRank: string;
    avatarUrl: string;
    skills: UserSkill[];
    country: UserCountry | null;
    party: UserParty | null;
    mu: UserMu | null;
    transactions: UserTransaction[];
    battles: UserBattle[];
    perfectItems: UserItem[];
    usedItems: UserItem[];
    ownedCompanies: OwnedCompany[];
    tradeOffers: TradeOffer[];
    skillSnapshots: SkillSnapshot[];
    nameHistory: UserNameHistoryEntry[];
    countryHistory: UserCountryHistoryEntry[];
    muHistory: UserMuHistoryEntry[];
    partyHistory: UserPartyHistoryEntry[];
    wageHistory: UserWageHistoryEntry[];
    financeReports: FinanceReport[];
    flipEvents: FlipEvent[];
    flipState: FlipState;
    battleParticipation: BattleParticipation;
};
