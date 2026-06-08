import { env } from "$env/dynamic/private";

const DEFAULT_ENDPOINT = "https://graph.warerastats.io/query";

export type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export async function runGraphQL<T>(
  fetchFn: typeof fetch,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>> {
  const token = env.GRAPHQL_BEARER_TOKEN;
  if (!token) {
    throw new Error("GRAPHQL_BEARER_TOKEN is not set");
  }

  const endpoint = env.GRAPHQL_ENDPOINT || DEFAULT_ENDPOINT;
  const response = await fetchFn(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL upstream failed with status ${response.status}`);
  }

  return (await response.json()) as GraphQLResponse<T>;
}
