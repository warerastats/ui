export const formatMoney = (amount: number, decimals = 4): string => {
    let min = 2;
    if (min > decimals) {
        min = decimals;
    }

    return `${amount.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: decimals })}`;
};

export const formatCompactNumber = (value: number): string => {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1_000_000_000) {
        return sign + (abs / 1_000_000_000).toFixed(1) + "B";
    }
    if (abs >= 1_000_000) {
        return sign + (abs / 1_000_000).toFixed(1) + "M";
    }
    if (abs >= 1_000) {
        return sign + (abs / 1_000).toFixed(1) + "K";
    }
    return value.toFixed(abs % 1 === 0 ? 0 : 1);
};

export const MARKET_ITEM_CODES = [
    "case1",
    "case2",
    "scraps",
    "cocain",
    "coca",
    "heavyAmmo",
    "ammo",
    "lightAmmo",
    "lead",
    "cookedFish",
    "steak",
    "bread",
    "fish",
    "livestock",
    "grain",
    "concrete",
    "limestone",
    "steel",
    "iron",
    "paper",
    "wood",
    "oil",
    "petroleum",
] as const;

export const EQUIPMENT_GROUPS = {
    Weapons: ["knife", "gun", "rifle", "sniper", "tank", "jet"],
    Boots: ["boots1", "boots2", "boots3", "boots4", "boots5", "boots6"],
    Helmets: ["helmet1", "helmet2", "helmet3", "helmet4", "helmet5", "helmet6"],
    Gloves: ["gloves1", "gloves2", "gloves3", "gloves4", "gloves5", "gloves6"],
    Chestplates: ["chest1", "chest2", "chest3", "chest4", "chest5", "chest6"],
    Pants: ["pants1", "pants2", "pants3", "pants4", "pants5", "pants6"],
} as const;

export const EQUIPMENT_ITEM_CODES = Object.values(EQUIPMENT_GROUPS).flat();

const EQUIPMENT_14D_CODES = new Set([
    "knife",
    "gun",
    "rifle",
    "boots1",
    "boots2",
    "boots3",
    "helmet1",
    "helmet2",
    "helmet3",
    "gloves1",
    "gloves2",
    "gloves3",
    "chest1",
    "chest2",
    "chest3",
    "pants1",
    "pants2",
    "pants3",
]);

export const getEquipmentWindowDays = (itemCode: string): number => {
    return EQUIPMENT_14D_CODES.has(itemCode) ? 14 : 30;
};

export const ITEM_NAMES: Record<string, string> = {
    case1: "Case",
    case2: "Elite Case",
    cocain: "Pill",
    coca: "Mysterious Plant",
    ammo: "Ammo",
    bread: "Bread",
    concrete: "Concrete",
    cookedFish: "Cooked Fish",
    fish: "Fish",
    grain: "Grain",
    heavyAmmo: "Heavy Ammo",
    iron: "Iron",
    lead: "Lead",
    lightAmmo: "Light Ammo",
    limestone: "Limestone",
    livestock: "Livestock",
    oil: "Oil",
    petroleum: "Petroleum",
    scraps: "Scraps",
    steak: "Steak",
    steel: "Steel",
    boots1: "Basic Boots",
    boots2: "Reinforced Boots",
    boots3: "Advanced Boots",
    boots4: "Elite Boots",
    boots5: "Legendary Boots",
    boots6: "Mythic Boots",
    helmet1: "Basic Helmet",
    helmet2: "Reinforced Helmet",
    helmet3: "Advanced Helmet",
    helmet4: "Elite Helmet",
    helmet5: "Legendary Helmet",
    helmet6: "Mythic Helmet",
    gloves1: "Basic Gloves",
    gloves2: "Reinforced Gloves",
    gloves3: "Advanced Gloves",
    gloves4: "Elite Gloves",
    gloves5: "Legendary Gloves",
    gloves6: "Mythic Gloves",
    chest1: "Basic Chest",
    chest2: "Reinforced Chest",
    chest3: "Advanced Chest",
    chest4: "Elite Chest",
    chest5: "Legendary Chest",
    chest6: "Mythic Chest",
    pants1: "Basic Pants",
    pants2: "Reinforced Pants",
    pants3: "Advanced Pants",
    pants4: "Elite Pants",
    pants5: "Legendary Pants",
    pants6: "Mythic Pants",
    knife: "Knife",
    gun: "Gun",
    rifle: "Rifle",
    sniper: "Sniper",
    tank: "Tank",
    jet: "Fighter Jet",
};

export type TierName =
    | "basic"
    | "reinforced"
    | "advanced"
    | "elite"
    | "legendary"
    | "mythic";

export const ITEM_TIERS: Record<string, TierName> = {
    case1: "legendary",
    case2: "mythic",
    scraps: "advanced",
    cocain: "elite",
    coca: "basic",
    heavyAmmo: "elite",
    ammo: "advanced",
    lightAmmo: "reinforced",
    lead: "basic",
    cookedFish: "elite",
    steak: "advanced",
    bread: "reinforced",
    oil: "reinforced",
    steel: "reinforced",
    concrete: "reinforced",
    fish: "basic",
    livestock: "basic",
    grain: "basic",
    petroleum: "basic",
    iron: "basic",
    limestone: "basic",
    knife: "basic",
    gun: "reinforced",
    rifle: "advanced",
    sniper: "elite",
    tank: "legendary",
    jet: "mythic",
    boots1: "basic",
    boots2: "reinforced",
    boots3: "advanced",
    boots4: "elite",
    boots5: "legendary",
    boots6: "mythic",
    helmet1: "basic",
    helmet2: "reinforced",
    helmet3: "advanced",
    helmet4: "elite",
    helmet5: "legendary",
    helmet6: "mythic",
    gloves1: "basic",
    gloves2: "reinforced",
    gloves3: "advanced",
    gloves4: "elite",
    gloves5: "legendary",
    gloves6: "mythic",
    chest1: "basic",
    chest2: "reinforced",
    chest3: "advanced",
    chest4: "elite",
    chest5: "legendary",
    chest6: "mythic",
    pants1: "basic",
    pants2: "reinforced",
    pants3: "advanced",
    pants4: "elite",
    pants5: "legendary",
    pants6: "mythic",
};

export const TIER_GRADIENTS: Record<TierName, string> = {
    basic: "linear-gradient(45deg, rgb(37, 45, 53), rgb(16, 19, 23))",
    reinforced: "linear-gradient(45deg, rgb(22, 55, 34), rgb(11, 22, 15))",
    advanced: "linear-gradient(45deg, rgb(18, 35, 71), rgb(11, 16, 27))",
    elite: "linear-gradient(45deg, rgb(44, 30, 64), rgb(19, 15, 25))",
    legendary: "linear-gradient(45deg, rgb(59, 48, 23), rgb(23, 20, 12))",
    mythic: "linear-gradient(45deg, rgb(64, 21, 21), rgb(25, 11, 11))",
};

export type BattleSide = "attacker" | "defender";

export type BattleTimelinePoint = {
    intervalStart: string;
    attackerDamage: number;
    defenderDamage: number;
    attackerCumulative: number;
    defenderCumulative: number;
    winner: BattleSide | "tie";
};

export type BattleEquipmentSummaryItem = {
    itemCode: string;
    itemName: string;
    count: number;
    value: number;
};

export type BattleSideReportSummary = {
    damageTotals: Record<BattleSide, number>;
    equipmentValueTotals: Record<BattleSide, number>;
    equipmentBySide: Record<BattleSide, BattleEquipmentSummaryItem[]>;
    timeline: BattleTimelinePoint[];
    maxTimelineDamage: number;
};

type DamageReportLike = {
    intervalStart: string;
    side: string;
    damage: number;
    equipment: Array<{
        itemCode: string;
        count: number;
        value: number;
    }>;
};

export const getItemName = (itemCode: string): string => {
    return ITEM_NAMES[itemCode] ?? itemCode;
};

export const getItemTier = (itemCode: string): TierName => {
    return ITEM_TIERS[itemCode] ?? "basic";
};

export const getTierGradient = (tier: TierName): string => {
    return TIER_GRADIENTS[tier];
};

export const getItemTierGradient = (itemCode: string): string => {
    return getTierGradient(getItemTier(itemCode));
};

const normalizeBattleSide = (value: string): BattleSide | null => {
    const lower = value.toLowerCase();
    if (lower.includes("attacker")) {
        return "attacker";
    }
    if (lower.includes("defender")) {
        return "defender";
    }
    return null;
};

export const buildBattleSideReportSummary = (
    reports: DamageReportLike[],
): BattleSideReportSummary => {
    const damageTotals: Record<BattleSide, number> = {
        attacker: 0,
        defender: 0,
    };
    const equipmentValueTotals: Record<BattleSide, number> = {
        attacker: 0,
        defender: 0,
    };

    const equipmentMaps: Record<
        BattleSide,
        Map<string, BattleEquipmentSummaryItem>
    > = {
        attacker: new Map(),
        defender: new Map(),
    };

    const perInterval = new Map<
        string,
        { attackerDamage: number; defenderDamage: number }
    >();

    for (const report of reports) {
        const side = normalizeBattleSide(report.side);
        if (!side) {
            continue;
        }

        const damage = Number.isFinite(report.damage) ? report.damage : 0;
        damageTotals[side] += damage;

        const point =
            perInterval.get(report.intervalStart) ??
            ({ attackerDamage: 0, defenderDamage: 0 } as {
                attackerDamage: number;
                defenderDamage: number;
            });

        if (side === "attacker") {
            point.attackerDamage += damage;
        } else {
            point.defenderDamage += damage;
        }

        perInterval.set(report.intervalStart, point);

        for (const equipment of report.equipment) {
            const itemCode = equipment.itemCode;
            const count = Number.isFinite(equipment.count)
                ? equipment.count
                : 0;
            const value = Number.isFinite(equipment.value)
                ? equipment.value
                : 0;

            equipmentValueTotals[side] += value;

            const existing = equipmentMaps[side].get(itemCode);
            if (existing) {
                existing.count += count;
                existing.value += value;
                continue;
            }

            equipmentMaps[side].set(itemCode, {
                itemCode,
                itemName: getItemName(itemCode),
                count,
                value,
            });
        }
    }

    let attackerCumulative = 0;
    let defenderCumulative = 0;

    const timeline: BattleTimelinePoint[] = [...perInterval.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([intervalStart, value]) => {
            attackerCumulative += value.attackerDamage;
            defenderCumulative += value.defenderDamage;

            let winner: BattleSide | "tie" = "tie";
            if (attackerCumulative > defenderCumulative) {
                winner = "attacker";
            } else if (defenderCumulative > attackerCumulative) {
                winner = "defender";
            }

            return {
                intervalStart,
                attackerDamage: value.attackerDamage,
                defenderDamage: value.defenderDamage,
                attackerCumulative,
                defenderCumulative,
                winner,
            };
        });

    const equipmentBySide: Record<BattleSide, BattleEquipmentSummaryItem[]> = {
        attacker: [...equipmentMaps.attacker.values()].sort(
            (a, b) =>
                b.value - a.value ||
                b.count - a.count ||
                a.itemName.localeCompare(b.itemName),
        ),
        defender: [...equipmentMaps.defender.values()].sort(
            (a, b) =>
                b.value - a.value ||
                b.count - a.count ||
                a.itemName.localeCompare(b.itemName),
        ),
    };

    const maxTimelineDamage = timeline.reduce((max, point) => {
        return Math.max(max, point.attackerDamage, point.defenderDamage);
    }, 0);

    return {
        damageTotals,
        equipmentValueTotals,
        equipmentBySide,
        timeline,
        maxTimelineDamage,
    };
};

// User skill helpers
export type SkillCategory = "eco" | "war" | "hybrid";

export type SkillAnalysis = {
    pointsEco: number;
    pointsWar: number;
    pointsTotal: number;
    category: SkillCategory;
    skills: Array<{ key: string; points: number; category: SkillCategory }>;
};

export const SKILL_KEYS = [
    "energy",
    "health",
    "hunger",
    "attack",
    "companies",
    "entrepreneurship",
    "production",
    "criticalChance",
    "criticalDamages",
    "armor",
    "precision",
    "dodge",
    "lootChance",
    "management",
] as const;

export type SkillSet = Record<(typeof SKILL_KEYS)[number], number>;

const ECONOMIC_SKILLS = new Set([
    "entrepreneurship",
    "energy",
    "production",
    "companies",
    "management",
]);

/** Map a skill snapshot `set` object to the array format used by calculateSkillPointsSpent */
export const snapshotSetToSkillArray = (
    set: SkillSet,
): Array<{ key: string; value: number }> => {
    return SKILL_KEYS.map((key) => ({ key, value: set[key] ?? 0 }));
};

/** Sum of war-skill levels (not points) — direct damage proxy */
export const getWarLevels = (set: SkillSet): number => {
    let total = 0;
    for (const key of SKILL_KEYS) {
        if (!ECONOMIC_SKILLS.has(key)) {
            total += set[key] ?? 0;
        }
    }
    return total;
};

/**
 * Convert total skill points to effective war levels using sqrt diminishing returns.
 * Each skill level N costs N points (cumulative N*(N+1)/2), so levels ∝ sqrt(2*points).
 * The constant factor cancels during calibration — only the shape matters.
 */
export const effWarLevels = (points: number): number => {
    if (points <= 0) return 0;
    return Math.sqrt(2 * points);
};

/** Tunable constant: reference military rank for weighting (relative, not absolute %) */
const RANK_REF = 100;

export type PopulationSummary = {
    total: number;
    war: number;
    hybrid: number;
    eco: number;
    unknown: number;
    warPct: number;
    hybridPct: number;
    ecoPct: number;
    unknownPct: number;
    avgWarShare: number;
};

export type DamageEstimate = {
    observedAvg: number;
    observedPeak: number;
    currentCapacity: number;
    potentialConservative: number;
    potentialOptimistic: number;
};

export type CountryUserSnapshot = {
    level: number;
    militaryRank: number;
    skillSnapshots: Array<{
        since: string;
        set: SkillSet;
    }>;
};

/** Classify a population of users by war/hybrid/eco mode */
export const summarizePopulationModes = (
    users: CountryUserSnapshot[],
): PopulationSummary => {
    let war = 0;
    let hybrid = 0;
    let eco = 0;
    let unknown = 0;
    let totalWarShare = 0;
    let classifiedCount = 0;

    for (const user of users) {
        const snapshot = user.skillSnapshots[0];
        if (!snapshot) {
            unknown++;
            continue;
        }

        const analysis = calculateSkillPointsSpent(
            snapshotSetToSkillArray(snapshot.set),
        );

        // Users who haven't allocated any skill points yet
        if (analysis.pointsTotal === 0) {
            unknown++;
            continue;
        }

        if (analysis.category === "war") war++;
        else if (analysis.category === "eco") eco++;
        else hybrid++;

        classifiedCount++;
        totalWarShare += analysis.pointsWar / analysis.pointsTotal;
    }

    const total = war + hybrid + eco + unknown;
    return {
        total,
        war,
        hybrid,
        eco,
        unknown,
        warPct: total > 0 ? (war / total) * 100 : 0,
        hybridPct: total > 0 ? (hybrid / total) * 100 : 0,
        ecoPct: total > 0 ? (eco / total) * 100 : 0,
        unknownPct: total > 0 ? (unknown / total) * 100 : 0,
        avgWarShare:
            classifiedCount > 0 ? (totalWarShare / classifiedCount) * 100 : 0,
    };
};

/**
 * Estimate a country's damage capacity by combining historical damage with
 * population war-mode distribution.
 *
 * Model:
 *   currentWarShare = Σ(pointsWar × rankWeight) / Σ(pointsTotal × rankWeight)
 *   damagePerUnit = observedAvg / currentWarShare
 *   conservative = damagePerUnit × (currentWarShare + rank-weighted eco boost)
 *   optimistic = damagePerUnit × 1.0  (everyone goes full war)
 *
 * Guarantees: optimistic >= conservative >= currentCapacity = observedAvg.
 */
export const estimateCountryDamageCapacity = (
    users: CountryUserSnapshot[],
    wealthReports: Array<{ dayStart: string; totalDamage: number }>,
): DamageEstimate => {
    let weightedWarPoints = 0;
    let weightedTotalPoints = 0;

    for (const user of users) {
        const snapshot = user.skillSnapshots[0];
        if (!snapshot) continue;
        const analysis = calculateSkillPointsSpent(
            snapshotSetToSkillArray(snapshot.set),
        );
        if (analysis.pointsTotal === 0) continue;
        const rankWeight = 1 + user.militaryRank / RANK_REF;
        weightedWarPoints += analysis.pointsWar * rankWeight;
        weightedTotalPoints += analysis.pointsTotal * rankWeight;
    }

    const validReports = wealthReports.filter((r) => r.totalDamage > 0);
    const totalDamage = validReports.reduce((s, r) => s + r.totalDamage, 0);
    const observedAvg =
        validReports.length > 0 ? totalDamage / validReports.length : 0;
    const observedPeak = validReports.reduce(
        (m, r) => Math.max(m, r.totalDamage),
        0,
    );

    if (weightedTotalPoints === 0 || observedAvg === 0) {
        return {
            observedAvg,
            observedPeak,
            currentCapacity: observedAvg,
            potentialConservative: observedAvg,
            potentialOptimistic: observedAvg,
        };
    }

    const currentWarShare = weightedWarPoints / weightedTotalPoints;
    const damagePerUnit = observedAvg / currentWarShare;

    // Conservative: eco players partially switch, weighted by their rank
    let conservativeEcoBoost = 0;
    for (const user of users) {
        const snapshot = user.skillSnapshots[0];
        if (!snapshot) continue;
        const analysis = calculateSkillPointsSpent(
            snapshotSetToSkillArray(snapshot.set),
        );
        if (analysis.pointsTotal === 0 || analysis.pointsEco === 0) continue;
        const rankWeight = 1 + user.militaryRank / RANK_REF;
        const switchProb = Math.min(1, user.militaryRank / RANK_REF);
        conservativeEcoBoost += analysis.pointsEco * rankWeight * switchProb;
    }

    const conservativeWarShare =
        (weightedWarPoints + conservativeEcoBoost) / weightedTotalPoints;

    return {
        observedAvg,
        observedPeak,
        currentCapacity: damagePerUnit * currentWarShare,
        potentialConservative: damagePerUnit * conservativeWarShare,
        potentialOptimistic: damagePerUnit * 1.0,
    };
};

const getCumulativeSkillPoints = (level: number): number => {
    if (level <= 0) {
        return 0;
    }

    return (level * (level + 1)) / 2;
};

export const calculateSkillPointsSpent = (
    skills: Array<{ key: string; value: number }>,
): SkillAnalysis => {
    let pointsEco = 0;
    let pointsWar = 0;
    const skillDetails: Array<{
        key: string;
        points: number;
        category: SkillCategory;
    }> = [];

    for (const skill of skills) {
        const points = getCumulativeSkillPoints(skill.value);
        const isEco = ECONOMIC_SKILLS.has(skill.key);
        const category: SkillCategory = isEco ? "eco" : "war";

        if (isEco) {
            pointsEco += points;
        } else {
            pointsWar += points;
        }

        skillDetails.push({ key: skill.key, points, category });
    }

    const pointsTotal = pointsEco + pointsWar;
    let category: SkillCategory = "hybrid";

    if (pointsTotal > 0) {
        const ratio =
            pointsWar === 0 ? Number.POSITIVE_INFINITY : pointsEco / pointsWar;
        if (ratio > 1.5) {
            category = "eco";
        } else if (ratio < 0.667) {
            category = "war";
        }
    }

    return {
        pointsEco,
        pointsWar,
        pointsTotal,
        category,
        skills: skillDetails,
    };
};

export const calculateCostPerDamage = (
    wealth: Array<{ key: string; value: number }> | null,
    totalDamage: number,
): number | null => {
    if (!wealth || wealth.length === 0 || totalDamage <= 0) {
        return null;
    }

    const totalWealth = wealth.reduce((sum, w) => sum + w.value, 0);
    if (totalWealth <= 0) {
        return null;
    }

    return totalWealth / totalDamage;
};

export type EquipmentAggregate = {
    itemCode: string;
    itemName: string;
    totalCount: number;
    totalValue: number;
};

export const aggregateEquipmentUsed = (
    battles: Array<{
        damageReports: Array<{
            equipment: Array<{ itemCode: string; count: number }>;
        }>;
    }>,
): EquipmentAggregate[] => {
    const equipmentMap = new Map<string, { count: number }>();

    for (const battle of battles) {
        for (const report of battle.damageReports) {
            for (const equipment of report.equipment) {
                const existing = equipmentMap.get(equipment.itemCode) || {
                    count: 0,
                };
                equipmentMap.set(equipment.itemCode, {
                    count: existing.count + equipment.count,
                });
            }
        }
    }

    return Array.from(equipmentMap.entries())
        .map(([itemCode, data]) => ({
            itemCode,
            itemName: getItemName(itemCode),
            totalCount: data.count,
            totalValue: 0, // Value would need market data to calculate
        }))
        .sort((a, b) => b.totalCount - a.totalCount);
};

export const calculateFlipROI = (
    totalProfit: number,
    totalFlips: number,
): number | null => {
    if (totalFlips === 0 || totalProfit === 0) {
        return null;
    }

    // Rough estimate: assume average initial investment per flip
    // ROI = profit / (number of flips * estimated cost per flip)
    // Since we don't have investment data, just return profit per flip
    return totalProfit / totalFlips;
};

export const ETHICS_LABELS: Record<string, string[]> = {
    militarism: [
        "Fanatic Pacifist",
        "Pacifist",
        "Unethical",
        "Expansionist",
        "Fanatic Expansionist",
    ],
    isolationism: [
        "Fanatic Diplomatic",
        "Diplomatic",
        "Unethical",
        "Isolationist",
        "Fanatic Isolationist",
    ],
    imperialism: [
        "Fanatic Republican",
        "Republican",
        "Unethical",
        "Imperialist",
        "Fanatic Imperialist",
    ],
    industrialism: [
        "Fanatic Agrarian",
        "Agrarian",
        "Unethical",
        "Industrialist",
        "Fanatic Industrialist",
    ],
};

export const getEthicsLabel = (axis: string, value: number): string => {
    const labels = ETHICS_LABELS[axis];
    if (!labels) return `${value}`;
    const idx = value + 2;
    return labels[idx] ?? `${value}`;
};
