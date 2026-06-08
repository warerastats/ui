/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
  watchSchema: {
    url: "https://graph.warerastats.io/query",
    headers: {
      authorization: (env) => `Bearer ${env.GRAPHQL_BEARER_TOKEN ?? ""}`,
    },
  },
  runtimeDir: ".houdini",
  schemaPath: "./schema.graphql",
  plugins: {
    "houdini-svelte": {
      client: "./src/client.ts",
    },
  },
};

export default config;
