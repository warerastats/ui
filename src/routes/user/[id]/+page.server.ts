import type { PageServerLoad } from "./$types";
import type { UserPageLoadData, UserQueryResult } from "$lib";
import { runGraphQL } from "$lib/server/graphql/client";

function getLast7CompletedDaysWindow() {
    const today = new Date();
    const to = new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
        ),
    );
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
        from: from.toISOString(),
        to: to.toISOString(),
    };
}

const USER_QUERY = `
	query UserDetailData($id: ID!, $from: DateTime!, $to: DateTime!) {
		user(id: $id) {
			username
			level
			militaryRank
			avatarUrl

			skills {
				key
				value
			}

			country {
				id
				name
				code
			}

			party {
				id
				name
				avatarUrl
			}

			mu {
				id
				name
				avatarUrl
			}

			transactions(first: 50) {
				edges {
					... on MarketTransaction {
						id
						money
						item {
							itemCode
							skills {
								key
								value
							}
						}
						seller {
							id
							username
							avatarUrl
						}
						buyer {
							id
							username
							avatarUrl
						}
					}

					... on CaseTransaction {
						id
						case
						item {
							itemCode
							skills {
								key
								value
							}
						}
					}

					... on TradeTransaction {
						id
						itemCode
						quantity
						money
						seller {
							id
							username
							avatarUrl
						}
						buyer {
							id
							username
							avatarUrl
						}
						sellerMu {
							id
							name
							avatarUrl
						}
						buyerMu {
							id
							name
							avatarUrl
						}
						sellerCountry {
							id
							name
							code
						}
						buyerCountry {
							id
							name
							code
						}
					}

					... on CraftTransaction {
						id
						item {
							itemCode
							skills {
								key
								value
							}
						}
					}

					... on LootTransaction {
						id
						item {
							itemCode
							skills {
								key
								value
							}
						}
					}
				}
			}

			battles(first: 10) {
				id

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
			}

			perfectItems: items(status: PERFECT) {
				itemCode
			}
			usedItems: items(status: USED) {
				itemCode
			}

			ownedCompanies {
				id
				name
				itemCode
				region {
					id
					name
					country {
						code
					}
					initialCountry {
						code
					}
				}
				employees {
					wage
					fidelity
					user {
						id
						username
						avatarUrl
					}
				}
			}

			tradeOffers(first: 20) {
				itemCode
				side
				quantity
				fulfilled
				cancelled
				price
				since
			}

			skillSnapshots(first: 10) {
				since
				set {
					energy
					health
					hunger
					attack
					companies
					entrepreneurship
					production
					criticalChance
					criticalDamages
					armor
					precision
					dodge
					lootChance
					management
				}
			}

			nameHistory(first: 10) {
				at
				username
			}

			countryHistory(first: 10) {
				at
				country {
					id
					name
					code
				}
			}

			muHistory(first: 10) {
				at
				mu {
					id
					name
					avatarUrl
				}
			}

			partyHistory(first: 10) {
				at
				party {
					id
					name
					avatarUrl
				}
			}

			wageHistory(first: 10) {
				at
				wage
			}

			financeReports(from: $from, to: $to) {
				dayStart

				wagesPaid
				wagesEarned
				itemsBought
				itemsSold
				equipBought
				equipSold
				valueDismantled
				casesOpened
				casesNet
			}

			flipEvents(from: $from, to: $to) {
				itemCode
				quantity
				buyCost
				sellRevenue
				profit
				heldMs
				at
			}

			flipState {
				totalFlips
				totalProfit
			}

			battleParticipation {
				totalDamage
				battlesParticipated
				negativeDamage
				ownCountryBattles
				ownCountryParticipated
				muOrderBattles
				muOrderParticipated
				updatedAt
			}
		}
	}
`;

export const load: PageServerLoad = async ({ fetch, params }) => {
    const { id } = params;

    try {
        const range = getLast7CompletedDaysWindow();
        const result = await runGraphQL<UserQueryResult>(fetch, USER_QUERY, {
            id,
            from: range.from,
            to: range.to,
        });

        if (result.errors?.length) {
            return {
                ok: false,
                id,
                error: result.errors[0]?.message || "Unknown server error",
                user: null,
            } satisfies UserPageLoadData;
        }

        const user = result.data?.user;

        if (!user) {
            return {
                ok: false,
                id,
                error: "No user data returned",
                user: null,
            } satisfies UserPageLoadData;
        }

        return {
            ok: true,
            id,
            user,
        } satisfies UserPageLoadData;
    } catch (error) {
        return {
            ok: false,
            id,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            user: null,
        } satisfies UserPageLoadData;
    }
};
