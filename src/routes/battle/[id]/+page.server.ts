import type { PageServerLoad } from "./$types";
import type { BattlePageLoadData, BattleQueryResult } from "$lib";
import { runGraphQL } from "$lib/server/graphql/client";

const BATTLE_QUERY = `
	query BattleDetailData($id: ID!) {
		battle(id: $id) {
			attackerDamages
			defenderDamages
			winnerSide
			isActive
			endedAt

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

			defenderRegion {
				id
				name

				country {
					id
					name
					code
				}

				initialCountry {
					id
					name
					code
				}
			}

			attackerAlliance {
				id
				name
			}

			defenderAlliance {
				id
				name
			}

			topDamage(limit: 10) {
				totalDamage
				user {
					id
					username
					avatarUrl

					country {
						code
					}
				}
			}

			orderChanges (
				first: 99999
			) {
				at
				side
				kind
				action
				entity {
					... on Country {
						id
						name
						code
						__typename
					}

					... on Mu {
						id
						name
						avatarUrl
						__typename
						region {
                          	initialCountry {
                            	code
                          	}
                        }
					}
				}
			}

			damageReports(entityKind: SIDE) {
				intervalStart
				side
				damage
				equipment {
					itemCode
					count
					value
				}
			}
		}
	}
`;

export const load: PageServerLoad = async ({ fetch, params }) => {
    const { id } = params;

    try {
        const result = await runGraphQL<BattleQueryResult>(
            fetch,
            BATTLE_QUERY,
            { id },
        );

        if (result.errors?.length) {
            return {
                ok: false,
                id,
                error: result.errors[0]?.message || "Unknown server error",
                battle: null,
            } satisfies BattlePageLoadData;
        }

        const battle = result.data?.battle;

        if (!battle) {
            return {
                ok: false,
                id,
                error: "No battle data returned",
                battle: null,
            } satisfies BattlePageLoadData;
        }

        return {
            ok: true,
            id,
            battle,
        } satisfies BattlePageLoadData;
    } catch (error) {
        return {
            ok: false,
            id,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            battle: null,
        } satisfies BattlePageLoadData;
    }
};
