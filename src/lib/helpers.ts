export const formatMoney = (amount: number, decimals = 4): string => {
    let min = 2;
    if (min > decimals) {
        min = decimals;
    }

    return `${amount.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: decimals })}`;
};

export const formatCompactNumber = (value: number): string => {
    if (value >= 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(1) + "B";
    }
    if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(1) + "M";
    }
    if (value >= 1_000) {
        return (value / 1_000).toFixed(1) + "K";
    }
    return value.toString();
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

const ECONOMIC_SKILLS = new Set([
    "entrepreneurship",
    "energy",
    "production",
    "companies",
    "management",
]);

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
    const skillDetails: Array<{ key: string; points: number; category: SkillCategory }> = [];

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
        const ratio = pointsWar === 0 ? Number.POSITIVE_INFINITY : pointsEco / pointsWar;
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
        damageReports: Array<{ equipment: Array<{ itemCode: string; count: number }> }>;
    }>,
): EquipmentAggregate[] => {
    const equipmentMap = new Map<string, { count: number }>();

    for (const battle of battles) {
        for (const report of battle.damageReports) {
            for (const equipment of report.equipment) {
                const existing = equipmentMap.get(equipment.itemCode) || { count: 0 };
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
