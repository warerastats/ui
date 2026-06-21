<script lang="ts">
    let {
        src: inputSrc,
        alt,
        width,
        height,
    }: {
        src?: string | undefined;
        alt: string;
        width?: string | undefined;
        height?: string | undefined;
    } = $props();

    let src = $derived(
        typeof inputSrc !== "undefined" && inputSrc !== ""
            ? inputSrc
            : "/placeholder3.png",
    );
</script>

<img {src} {alt} height={height ?? "32px"} width={width ?? "32px"} />
