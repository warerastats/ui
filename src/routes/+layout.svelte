<script lang="ts">
    import { navigating } from "$app/state";
    import favicon from "$lib/assets/favicon.svg";
    import Header from "$lib/components/Header.svelte";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<Header />

{@render children()}

{#if navigating.to}
    <div class="navigation-overlay" aria-live="polite" aria-busy="true">
        <div class="navigation-overlay__panel">
            <div class="navigation-overlay__spinner"></div>
            <p>Loading page…</p>
        </div>
    </div>
{/if}

<style lang="scss">
    div.navigation-overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background:
            linear-gradient(rgba(20, 20, 20, 0.6), rgba(20, 20, 20, 0.72)),
            radial-gradient(circle at top, rgba(80, 80, 80, 0.2), transparent 45%);
        backdrop-filter: blur(6px);
    }

    div.navigation-overlay__panel {
        min-width: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px 24px;
        background: rgba(31, 31, 31, 0.9);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);

        p {
            margin: 0;
            color: #c2c6d6;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.7px;
        }
    }

    div.navigation-overlay__spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(194, 198, 214, 0.18);
        border-top-color: #c2c6d6;
        border-radius: 999px;
        animation: navigation-overlay-spin 0.8s linear infinite;
    }

    @keyframes navigation-overlay-spin {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }
 </style>
