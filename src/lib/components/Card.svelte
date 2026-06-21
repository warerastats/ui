<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        title,
        class: className = "",
        headerBorder = true,
        children,
        header,
    }: {
        title?: string;
        class?: string;
        headerBorder?: boolean;
        children: Snippet;
        header?: Snippet;
    } = $props();
</script>

<div class="card {className}">
    {#if title || header}
        <div class="header" class:no-border={!headerBorder}>
            {#if header}
                {@render header()}
            {:else}
                {#if title}<h3 class="title">{title}</h3>{/if}
            {/if}
        </div>
    {/if}

    <div class="body" class:has-title={title || header}>
        {@render children()}
    </div>
</div>

<style lang="scss">
    div.card {
        background: #262626;
        border: #262626 1px solid;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    div.header {
        padding: 24px 24px 0;

        &:has(.title) {
            border-bottom: #353535 1px solid;
        }

        &.no-border {
            border-bottom: none;
        }
    }

    h3.title {
        margin: 0;
        color: #fff;
        font-family: "Inter", sans-serif;
        font-size: 20px;
        font-weight: 700;
        line-height: 1.2;
    }

    div.body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;

        &.has-title {
            padding-top: 8px;
        }
    }
</style>
