<script lang="ts">
    import {
        getItemName,
        getItemTier,
        getItemTierGradient,
    } from "$lib/helpers";

    let {
        itemCode,
        size = 20,
        alt,
    }: {
        itemCode: string;
        size?: number;
        alt?: string;
    } = $props();

    let failed = $state(false);

    const imageSrc = $derived(`/items/${itemCode}.png`);
    const imageAlt = $derived(alt ?? getItemName(itemCode));
    const itemTier = $derived(getItemTier(itemCode));
    const tierGradient = $derived(getItemTierGradient(itemCode));
</script>

{#if !failed}
    <img
        src={imageSrc}
        alt={imageAlt}
        width={size}
        height={size}
        title={`${getItemName(itemCode)} (${itemTier})`}
        style={`background: ${tierGradient};`}
        loading="lazy"
        onerror={() => {
            failed = true;
        }}
    />
{:else}
    <div
        class="fallback"
        aria-label={imageAlt}
        title={`${getItemName(itemCode)} (${itemTier})`}
        style={`width: ${size}px; height: ${size}px; background: ${tierGradient};`}
    >
        {itemCode.slice(0, 2).toUpperCase()}
    </div>
{/if}

<style lang="scss">
    img {
        display: block;
        object-fit: contain;
        border-radius: 2px;
        background: #1a1a1a;
        border: 1px solid #353535;
    }

    div.fallback {
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
        background: #1a1a1a;
        border: 1px solid #353535;
        color: #8c909f;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
</style>
