<script lang="ts">
    import type { InflationPoint } from "$lib";

    let { points }: { points: InflationPoint[] } = $props();

    let maxAbs = $derived(
        points.length > 0
            ? Math.max(...points.map((p) => Math.abs(p.pctChange24h)))
            : 1,
    );

    let dateStep = $derived(points.length > 15 ? 5 : 1);

    function shortDate(iso: string): string {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        });
    }

    function barPct(value: number): number {
        return maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0;
    }

    function fmtPct(value: number): string {
        const sign = value > 0 ? "+" : "";
        return `${sign}${value.toFixed(2)}%`;
    }
</script>

<div class="bar-chart">
    {#each points as point, i (point.dayStart)}
        <div class="bar-col" data-pct={fmtPct(point.pctChange24h)}>
            <div class="bar-top">
                {#if point.pctChange24h > 0}
                    <div
                        class="bar-fill up"
                        style="height: {barPct(point.pctChange24h)}%"
                    ></div>
                {/if}
            </div>
            <div class="bar-bottom">
                {#if point.pctChange24h < 0}
                    <div
                        class="bar-fill down"
                        style="height: {barPct(point.pctChange24h)}%"
                    ></div>
                {/if}
            </div>
            <span
                class="bar-date"
                class:hidden={i % dateStep !== 0 && i !== points.length - 1}
            >
                {shortDate(point.dayStart)}
            </span>
        </div>
    {/each}
</div>

<style lang="scss">
    .bar-chart {
        display: flex;
        align-items: stretch;
        gap: 6px;
        height: 120px;
    }

    .bar-col {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1;
        align-items: center;

        &:hover::after {
            content: attr(data-pct);
            position: absolute;
            bottom: calc(100% + 4px);
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            border: 1px solid #353535;
            color: #c2c6d6;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            padding: 3px 6px;
            border-radius: 4px;
            pointer-events: none;
            z-index: 10;
        }
    }

    .bar-top {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        width: 100%;
    }

    .bar-bottom {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        width: 100%;
        border-top: 1px solid #353535;
    }

    .bar-fill {
        width: 100%;

        &.up {
            background: #4ae176;
            border-radius: 2px 2px 0 0;
        }

        &.down {
            background: #ffb4ab;
            border-radius: 0 0 2px 2px;
        }
    }

    .bar-date {
        font-size: 9px;
        color: #8c909f;
        margin-top: 5px;
        text-align: center;
        white-space: nowrap;

        &.hidden {
            visibility: hidden;
        }
    }
</style>
