import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { runGraphQL } from "$lib/server/graphql/client";

type SearchResultItem =
    | { __typename: "Country"; id: string; name: string; code: string }
    | { __typename: "Mu"; id: string; name: string; avatarUrl: string }
    | { __typename: "Party"; id: string; name: string; avatarUrl: string }
    | { __typename: "User"; id: string; username: string; avatarUrl: string };

interface SearchResponse {
    search: SearchResultItem[];
}

const SEARCH_QUERY = `
  query Search($term: String!, $limit: Int) {
    search(term: $term, limit: $limit) {
      __typename
      ... on Country {
        id
        name
        code
      }
      ... on Mu {
        id
        name
        avatarUrl
      }
      ... on Party {
        id
        name
        avatarUrl
      }
      ... on User {
        id
        username
        avatarUrl
      }
    }
  }
`;

export const GET: RequestHandler = async ({ url, fetch }) => {
    const term = url.searchParams.get("term")?.trim() ?? "";
    if (term.length <= 2) {
        return json({ results: [] as SearchResultItem[] });
    }

    const rawLimit = url.searchParams.get("limit");
    const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
    const limit =
        typeof parsedLimit === "number" &&
        !Number.isNaN(parsedLimit) &&
        parsedLimit > 0
            ? parsedLimit
            : undefined;

    try {
        const result = await runGraphQL<SearchResponse>(fetch, SEARCH_QUERY, {
            term,
            limit,
        });

        if (result.errors?.length) {
            return json(
                {
                    error: result.errors[0]?.message || "Unknown GraphQL error",
                    results: [],
                },
                { status: 502 },
            );
        }

        return json({ results: result.data?.search ?? [] });
    } catch (error) {
        return json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown server error",
                results: [] as SearchResultItem[],
            },
            { status: 500 },
        );
    }
};
