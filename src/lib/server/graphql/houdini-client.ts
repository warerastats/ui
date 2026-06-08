import { HoudiniClient } from "$houdini";
import { env } from "$env/dynamic/private";

const DEFAULT_ENDPOINT = "https://graph.warerastats.io/query";

export default new HoudiniClient({
  url: env.GRAPHQL_ENDPOINT || DEFAULT_ENDPOINT,
  fetchParams() {
    const token = env.GRAPHQL_BEARER_TOKEN;
    if (!token) {
      throw new Error("GRAPHQL_BEARER_TOKEN is not set");
    }

    return {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
  },
});
