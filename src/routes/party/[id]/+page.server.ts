import type { PageServerLoad } from "./$types";
import type { PartyPageLoadData, PartyQueryResult } from "$lib";
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

const PARTY_QUERY = `
	query PartyDetailData($id: ID!, $from: DateTime!, $to: DateTime!) {
		party(id: $id) {
			name
			description
			avatarUrl

			ethics {
				unethical
				militarism
				isolationism
				imperialism
				industrialism
			}

			country {
				id
				name
				code
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

			leader {
				id
				username
				avatarUrl
			}

			members {
				id
				username
				avatarUrl
			}

			rulesCountries {
				id
				name
				code
			}

			nameHistory(first: 10) {
				at
				name
			}

			leaderHistory(first: 10) {
				at
				leader {
					id
					username
					avatarUrl
				}
			}

			ethicsHistory(first: 10) {
				at
				ethics {
					unethical
					militarism
					isolationism
					imperialism
					industrialism
				}
			}

			wealthReports(from: $from, to: $to) {
				dayStart
				memberCount
				totalDamage
				totalWealth
			}

			moneyFlows(from: $from, to: $to) {
				dayStart

				inEquipment
				inEquipmentInsideParty
				inEquipmentOutsideAlliance
				inEquipmentSameCountryOutsideParty
				inEquipmentSameAllianceCrossBorder

				outEquipment
				outEquipmentInsideParty
				outEquipmentOutsideAlliance
				outEquipmentSameCountryOutsideParty
				outEquipmentSameAllianceCrossBorder

				inItems
				inItemsInsideParty
				inItemsOutsideAlliance
				inItemsSameCountryOutsideParty
				inItemsSameAllianceCrossBorder

				outItems
				outItemsInsideParty
				outItemsOutsideAlliance
				outItemsSameCountryOutsideParty
				outItemsSameAllianceCrossBorder

				inWages
				inWagesInsideParty
				inWagesOutsideAlliance
				inWagesSameCountryOutsideParty
				inWagesSameAllianceCrossBorder

				outWages
				outWagesInsideParty
				outWagesOutsideAlliance
				outWagesSameCountryOutsideParty
				outWagesSameAllianceCrossBorder

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
		}
	}
`;

export const load: PageServerLoad = async ({ fetch, params }) => {
    const { id } = params;

    try {
        const range = getLast7CompletedDaysWindow();
        const result = await runGraphQL<PartyQueryResult>(fetch, PARTY_QUERY, {
            id,
            from: range.from,
            to: range.to,
        });

        if (result.errors?.length) {
            return {
                ok: false,
                id,
                error: result.errors[0]?.message || "Unknown server error",
                party: null,
            } satisfies PartyPageLoadData;
        }

        const party = result.data?.party;

        if (!party) {
            return {
                ok: false,
                id,
                error: "No party data returned",
                party: null,
            } satisfies PartyPageLoadData;
        }

        return {
            ok: true,
            id,
            party,
        } satisfies PartyPageLoadData;
    } catch (error) {
        return {
            ok: false,
            id,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            party: null,
        } satisfies PartyPageLoadData;
    }
};
