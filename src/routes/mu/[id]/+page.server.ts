import type { PageServerLoad } from "./$types";
import type { MuPageLoadData, MuQueryResult } from "$lib";
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

const MU_PAGE_QUERY = `
	query MuPageData($id: ID!, $from: DateTime!, $to: DateTime!) {
		mu(id: $id) {
			name
			avatarUrl
			hq
			dorms
			mercRep

			owner {
				id
				username
				avatarUrl
			}

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

			members {
				id
				username
				avatarUrl
			}

			orderChanges(first: 16) {
				at
				action
				battle {
					id
					defenderRegion {
						id
						name
						country {
							code
						}
						initialCountry {
							code
						}
					}
				}
			}

			nameHistory(first: 10) {
				at
				name
			}

			ownerHistory(first: 10) {
				at
				owner {
					id
					username
					avatarUrl
				}
			}

			wealthReports(from: $from, to: $to) {
				dayStart
				totalDamage
				totalWealth
			}
		}
	}
`;

export const load: PageServerLoad = async ({ fetch, params }) => {
    const { id } = params;

    try {
        const range = getLast7CompletedDaysWindow();
        const result = await runGraphQL<MuQueryResult>(fetch, MU_PAGE_QUERY, {
            id,
            from: range.from,
            to: range.to,
        });

        if (result.errors?.length) {
            return {
                ok: false,
                id,
                error: result.errors[0]?.message || "Unknown server error",
                mu: null,
            } satisfies MuPageLoadData;
        }

        const mu = result.data?.mu;

        if (!mu) {
            return {
                ok: false,
                id,
                error: "No mu data returned",
                mu: null,
            } satisfies MuPageLoadData;
        }

        return {
            ok: true,
            id,
            mu,
        } satisfies MuPageLoadData;
    } catch (error) {
        return {
            ok: false,
            id,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            mu: null,
        } satisfies MuPageLoadData;
    }
};
