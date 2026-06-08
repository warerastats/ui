<script lang="ts">
  type PageData = {
    ok: boolean;
    typename?: string;
    error?: string;
  };

  let { data }: { data: PageData } = $props();
</script>

<h1>WareraStats UI</h1>
<p>This page loads GraphQL data through server-only code.</p>

{#if data.ok}
  <p>GraphQL reachable. Root typename: {data.typename}</p>
{:else}
  <p>GraphQL check failed: {data.error}</p>
{/if}
