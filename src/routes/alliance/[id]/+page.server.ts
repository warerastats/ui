import type { PageServerLoad } from "./$types";
import type { AlliancePageLoadData, AllianceQueryResult } from "$lib";
import { runGraphQL } from "$lib/server/graphql/client";

function getLast7CompletedDaysWindow() {
    const today = new Date();
    // Set to start of today (00:00:00 UTC)
    const to = new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
        ),
    );
    // Set from to 7 days before
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
        from: from.toISOString(),
        to: to.toISOString(),
    };
}

const ALLIANCE_QUERY = `
	query AllianceDetailData($id: ID!, $from: DateTime!, $to: DateTime!) {
		alliance(id: $id) {
			name
			
			countries {
				id
				name
				code
				userCount
			}

			participation {
				totalDamage
				battleCount
			}

			topDamage(limit: 10) {
				user {
					id
					username
					avatarUrl
				}
				totalDamage
				battleCount
			}

			moneyFlows(from: $from, to: $to) {
				dayStart
				
				inEquipment
				outEquipment

				inItems
				outItems

				inWages
				outWages

				inEquipmentInAlliance
				outEquipmentInAlliance

				inEquipmentOutsideAlliance
				outEquipmentOutsideAlliance

				inItemsInAlliance
				outItemsInAlliance

				inItemsOutsideAlliance
				outItemsOutsideAlliance

				inWagesInAlliance
				outWagesInAlliance

				inWagesOutsideAlliance
				outWagesOutsideAlliance
			}
		}
	}
`;

export const load: PageServerLoad = async ({ fetch, params }) => {
    const { id } = params;

    try {
        const range = getLast7CompletedDaysWindow();
        const result = await runGraphQL<AllianceQueryResult>(
            fetch,
            ALLIANCE_QUERY,
            { id, from: range.from, to: range.to },
        );

        if (result.errors?.length) {
            return {
                ok: false,
                id,
                error: result.errors[0]?.message || "Unknown server error",
                alliance: null,
            } satisfies AlliancePageLoadData;
        }

        const alliance = result.data?.alliance;

        if (!alliance) {
            return {
                ok: false,
                id,
                error: "No alliance data returned",
                alliance: null,
            } satisfies AlliancePageLoadData;
        }

        return {
            ok: true,
            id,
            alliance,
        } satisfies AlliancePageLoadData;
    } catch (error) {
        return {
            ok: false,
            id,
            error:
                error instanceof Error ? error.message : "Unknown server error",
            alliance: null,
        } satisfies AlliancePageLoadData;
    }
};
