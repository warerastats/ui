import type { PageServerLoad } from "./$types";
import { runGraphQL } from "$lib/server/graphql/client";

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const result = await runGraphQL<{ __typename: string }>(
      fetch,
      `query HealthCheck { __typename }`,
    );

    if (result.errors?.length) {
      return {
        ok: false,
        error: result.errors[0]?.message || "Unknown GraphQL error",
      };
    }

    return {
      ok: true,
      typename: result.data?.__typename || "Unknown",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown server error",
    };
  }
};
