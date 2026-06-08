import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { runGraphQL } from "$lib/server/graphql/client";

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const body = (await request.json()) as {
      query?: string;
      variables?: Record<string, unknown>;
    };

    if (!body.query) {
      return json(
        { errors: [{ message: "Missing GraphQL query" }] },
        { status: 400 },
      );
    }

    const result = await runGraphQL(fetch, body.query, body.variables);
    return json(result);
  } catch (error) {
    return json(
      {
        errors: [
          {
            message:
              error instanceof Error ? error.message : "Unknown server error",
          },
        ],
      },
      { status: 500 },
    );
  }
};
