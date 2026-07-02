import type { PageServerLoad } from "./$types";
import type { CountryPageLoadData, CountryQueryResult } from "$lib";
import { runGraphQL } from "$lib/server/graphql/client";

function getWindow(days: number) {
    const today = new Date();
    const to = new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
        ),
    );
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
}

const COUNTRY_QUERY = `
    query CountryDetailData($id: ID!, $from: DateTime!, $to: DateTime!, $wealthFrom: DateTime!) {
        country(id: $id) {
            name
            code
            userCount
            money
            specialisation

            taxes {
                income
                market
                selfWork
            }

            rulingParty {
                id
                name
                avatarUrl
                ethics {
                    unethical
                    militarism
                    isolationism
                    imperialism
                    industrialism
                }
            }

            rulingPartyHistory(first: 10) {
                at
                party {
                    id
                    name
                    avatarUrl
                }
            }

            alliance {
                name
                countries {
                    id
                    code
                    name
                    userCount
                }
            }

            wealthReports(from: $wealthFrom, to: $to) {
                dayStart
                memberCount
                totalDamage
                totalWealth
                wagesPaid
                wagesEarned
            }

            moneyFlows(from: $from, to: $to) {
                dayStart
                inEquipment
                outEquipment
                inEquipmentDomestic
                outEquipmentDomestic
                inEquipmentCrossBorder
                outEquipmentCrossBorder
                inItems
                outItems
                inItemsDomestic
                outItemsDomestic
                inItemsCrossBorder
                outItemsCrossBorder
                inWages
                outWages
                inWagesDomestic
                outWagesDomestic
                inWagesCrossBorder
                outWagesCrossBorder
                counterparts {
                    country {
                        id
                        name
                        code
                    }
                    inEquipment
                    outEquipment
                    inItems
                    outItems
                    inWages
                    outWages
                }
            }

            taxFlows(from: $from, to: $to) {
                hourStart
                totalTax
                coreEarned
                nonCoreEarned
                foreignTaxIn
                foreignTaxOut
                hijackedIn
                hijackedOut
                sources {
                    total
                    hijacked
                    foreignTaxRedirected
                    country {
                        id
                        name
                        code
                    }
                }
                hijackers {
                    amount
                    country {
                        id
                        name
                        code
                    }
                }
                foreignTaxRecipients {
                    amount
                    country {
                        id
                        name
                        code
                    }
                }
            }

            flipState {
                profitable
                totalProfit
                totalTrades
                updatedAt
            }

            inventory {
                lots {
                    itemCode
                    lots {
                        boughtAt
                        quantity
                        unitPrice
                    }
                }
                updatedAt
            }

            flipEvents(from: $from, to: $to, first: 50) {
                at
                itemCode
                quantity
                buyCost
                sellRevenue
                profit
            }

            orderChanges(first: 20) {
                at
                side
                kind
                action
                battle {
                    id
                    isActive
                    defenderRegion {
                        name
                    }
                    attackerCountry {
                        id
                        name
                        code
                    }
                    defenderCountry {
                        id
                        name
                        code
                    }
                    damageReports(entityIds: [$id], entityKind: COUNTRY) {
                        intervalStart
                        side
                        damage
                    }
                }
            }
        }
    }
`;

export const load: PageServerLoad = async ({ fetch, params }) => {
    const { id } = params;
    const win14 = getWindow(14);
    const win60 = getWindow(60);

    try {
        const result = await runGraphQL<CountryQueryResult>(
            fetch,
            COUNTRY_QUERY,
            {
                id,
                from: win14.from,
                to: win14.to,
                wealthFrom: win60.from,
            },
        );

        if (result.errors?.length) {
            return {
                ok: false,
                id,
                error: result.errors[0]?.message || "Unknown server error",
                country: null,
                currentPrices: {},
            } satisfies CountryPageLoadData;
        }

        const country = result.data?.country;

        if (!country) {
            return {
                ok: false,
                id,
                error: "No country data returned",
                country: null,
                currentPrices: {},
            } satisfies CountryPageLoadData;
        }

        // Phase 2: Fetch current market prices for inventory items
        let currentPrices: Record<string, number> = {};

        const inventoryItemCodes = (country.inventory?.lots ?? [])
            .filter((g) => g.lots.length > 0)
            .map((g) => g.itemCode);

        if (inventoryItemCodes.length > 0) {
            const aliases = inventoryItemCodes
                .map(
                    (code, i) =>
                        `p${i}: itemMarketReport(itemCode: "${code}") { itemCode avgWeighted24h }`,
                )
                .join("\n");
            const priceQuery = `query CurrentPrices { ${aliases} }`;

            const priceResult = await runGraphQL<
                Record<
                    string,
                    { itemCode: string; avgWeighted24h: number } | null
                >
            >(fetch, priceQuery, {});

            if (priceResult.data) {
                for (const key of Object.keys(priceResult.data)) {
                    const report = priceResult.data[key];
                    if (report) {
                        currentPrices[report.itemCode] = report.avgWeighted24h;
                    }
                }
            }
        }

        return {
            ok: true,
            id,
            country,
            currentPrices,
        } satisfies CountryPageLoadData;
    } catch (error) {
        return {
            ok: false,
            id,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            country: null,
            currentPrices: {},
        } satisfies CountryPageLoadData;
    }
};
