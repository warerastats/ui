import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { runGraphQL } from "$lib/server/graphql/client";
import type { DamageReport } from "$lib";

const VALID_ENTITY_KINDS = ["USER", "COUNTRY", "PARTY", "MU", "ALLIANCE"];

const DAMAGE_REPORTS_QUERY = `
  query BattleDamageReports($id: ID!, $entityKind: EntityKind!, $entityIds: [ID!]) {
    battle(id: $id) {
      damageReports(entityKind: $entityKind, entityIds: $entityIds) {
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

type DamageReportsQueryResult = {
    battle: {
        damageReports: DamageReport[];
    };
};

export const GET: RequestHandler = async ({ url, fetch, params }) => {
    const { id } = params;

    const entityKind = url.searchParams.get("entityKind")?.trim().toUpperCase();
    if (!entityKind || !VALID_ENTITY_KINDS.includes(entityKind)) {
        return json(
            {
                error: `Invalid entityKind. Must be one of: ${VALID_ENTITY_KINDS.join(", ")}`,
                reports: [],
            },
            { status: 400 },
        );
    }

    const rawIds = url.searchParams.get("entityIds")?.trim();
    if (!rawIds) {
        return json(
            { error: "entityIds parameter is required", reports: [] },
            { status: 400 },
        );
    }

    const entityIds = rawIds
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    if (entityIds.length === 0) {
        return json(
            { error: "entityIds must contain at least one ID", reports: [] },
            { status: 400 },
        );
    }

    try {
        const result = await runGraphQL<DamageReportsQueryResult>(
            fetch,
            DAMAGE_REPORTS_QUERY,
            { id, entityKind, entityIds },
        );

        if (result.errors?.length) {
            return json(
                {
                    error: result.errors[0]?.message || "Unknown GraphQL error",
                    reports: [],
                },
                { status: 502 },
            );
        }

        return json({
            reports: result.data?.battle?.damageReports ?? [],
        });
    } catch (error) {
        return json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown server error",
                reports: [],
            },
            { status: 500 },
        );
    }
};
