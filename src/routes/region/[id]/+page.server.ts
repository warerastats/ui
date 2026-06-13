import type { PageServerLoad } from "./$types";
import type { RegionPageLoadData, RegionQueryResult } from "$lib";
import { runGraphQL } from "$lib/server/graphql/client";

const REGION_QUERY = `
	query RegionDetailData($id: ID!) {
		region(id: $id) {
			name
			isCapital

			country {
				id
				name
				code
				specialisation

				regions {
					strategicResources {
						at
						resource
					}
				}

				rulingParty {
					ethics {
						unethical
						militarism
						isolationism
						imperialism
						industrialism
					}
				}
			}

			initialCountry {
				id
				name
				code
			}

			neighbors {
				country {
					id
					name
					code
				}
			}

			parties {
				id
				name
				avatarUrl
			}

			mus {
				id
				name
				avatarUrl
			}

			companies {
				itemCode
			}

			battles(first: 10) {
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

				winnerSide
				attackerDamages
				defenderDamages
			}

			ownerHistory(first: 10) {
				at
				country {
					id
					name
					code
				}
			}

			deposits(first: 1) {
				at
				startsAt
				endsAt
				type
			}

			strategicResources(first: 1) {
				at
				resource
			}
		}
	}
`;

export const load: PageServerLoad = async ({ fetch, params }) => {
    const { id } = params;

    try {
        const result = await runGraphQL<RegionQueryResult>(
            fetch,
            REGION_QUERY,
            { id },
        );

        if (result.errors?.length) {
            return {
                ok: false,
                id,
                error: result.errors[0]?.message || "Unknown server error",
                region: null,
            } satisfies RegionPageLoadData;
        }

        const region = result.data?.region;

        if (!region) {
            return {
                ok: false,
                id,
                error: "No region data returned",
                region: null,
            } satisfies RegionPageLoadData;
        }

        return {
            ok: true,
            id,
            region,
        } satisfies RegionPageLoadData;
    } catch (error) {
        return {
            ok: false,
            id,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            region: null,
        } satisfies RegionPageLoadData;
    }
};
