<script lang="ts">
    const flags = import.meta.glob("$lib/icons/flags/*.svg", {
        eager: true,
        query: "?url",
        import: "default",
    }) as Record<string, string>;

    let {
        code,
        height = "24px",
        width = "auto",
        alt = "",
    }: {
        code: string;
        height?: string;
        width?: string;
        alt?: string;
    } = $props();

    const flagUrl = $derived(
        flags[`/src/lib/icons/flags/${code.toLowerCase()}.svg`],
    );
</script>

{#if flagUrl}
    <img src={flagUrl} {height} {width} alt={alt || `${code} flag`} />
{/if}
