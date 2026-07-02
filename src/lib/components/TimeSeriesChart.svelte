<script lang="ts">
    let {
        points,
        height = 160,
        color = "#4af0c0",
        formatY = (v: number) => v.toLocaleString(),
    }: {
        points: { label: string; value: number }[];
        height?: number;
        color?: string;
        formatY?: (v: number) => string;
    } = $props();

    const W = 600;
    const PAD_X = 50;
    const PAD_TOP = 16;
    const PAD_BOTTOM = 24;

    let chartW = $derived(W - PAD_X * 2);
    let chartH = $derived(height - PAD_TOP - PAD_BOTTOM);

    let minY = $derived(
        points.length > 0 ? Math.min(...points.map((p) => p.value)) : 0,
    );
    let maxY = $derived(
        points.length > 0 ? Math.max(...points.map((p) => p.value)) : 1,
    );
    let rangeY = $derived(maxY - minY || 1);

    function x(i: number): number {
        if (points.length <= 1) return PAD_X + chartW / 2;
        return PAD_X + (i / (points.length - 1)) * chartW;
    }

    function y(val: number): number {
        return PAD_TOP + chartH - ((val - minY) / rangeY) * chartH;
    }

    let polylinePoints = $derived(
        points.map((p, i) => `${x(i)},${y(p.value)}`).join(" "),
    );

    let areaPath = $derived.by(() => {
        if (points.length < 2) return "";
        const bottom = PAD_TOP + chartH;
        let d = `M ${x(0)},${bottom}`;
        points.forEach((p, i) => {
            d += ` L ${x(i)},${y(p.value)}`;
        });
        d += ` L ${x(points.length - 1)},${bottom} Z`;
        return d;
    });

    let yTicks = $derived.by(() => {
        const count = 4;
        const ticks: number[] = [];
        for (let i = 0; i <= count; i++) {
            ticks.push(minY + (rangeY * i) / count);
        }
        return ticks;
    });

    let labelStep = $derived(
        points.length > 10 ? Math.ceil(points.length / 6) : 1,
    );

    let hoverIndex: number | null = $state(null);

    function handleMouseMove(e: MouseEvent) {
        const svg = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const relX = ((e.clientX - svg.left) / svg.width) * W;
        if (points.length <= 1) {
            hoverIndex = 0;
            return;
        }
        const idx = Math.round(((relX - PAD_X) / chartW) * (points.length - 1));
        hoverIndex = Math.max(0, Math.min(points.length - 1, idx));
    }

    function handleMouseLeave() {
        hoverIndex = null;
    }
</script>

{#if points.length > 0}
    <svg
        viewBox="0 0 {W} {height}"
        class="ts-chart"
        role="img"
        onmousemove={handleMouseMove}
        onmouseleave={handleMouseLeave}
    >
        {#each yTicks as tick}
            <line
                x1={PAD_X}
                y1={y(tick)}
                x2={W - PAD_X}
                y2={y(tick)}
                class="grid"
            />
            <text x={PAD_X - 6} y={y(tick) + 4} class="y-label">
                {formatY(tick)}
            </text>
        {/each}

        <path d={areaPath} class="area" fill={color} />
        <polyline points={polylinePoints} class="line" stroke={color} />

        {#each points as point, i}
            {#if i % labelStep === 0 || i === points.length - 1}
                <text x={x(i)} y={height - 4} class="x-label">
                    {point.label}
                </text>
            {/if}
        {/each}

        {#if hoverIndex !== null && points[hoverIndex]}
            <circle
                cx={x(hoverIndex)}
                cy={y(points[hoverIndex].value)}
                r="4"
                class="dot"
                fill={color}
            />
            <g
                transform="translate({x(hoverIndex)},{y(
                    points[hoverIndex].value,
                ) - 12})"
            >
                <rect
                    x="-40"
                    y="-14"
                    width="80"
                    height="18"
                    rx="4"
                    class="tooltip-bg"
                />
                <text class="tooltip-text">
                    {formatY(points[hoverIndex].value)}
                </text>
            </g>
        {/if}
    </svg>
{:else}
    <p class="no-data">No data available</p>
{/if}

<style lang="scss">
    .ts-chart {
        width: 100%;
        height: auto;
        display: block;
    }

    .grid {
        stroke: #353535;
        stroke-width: 0.5;
    }

    .y-label {
        fill: #8c909f;
        font-size: 10px;
        text-anchor: end;
    }

    .x-label {
        fill: #8c909f;
        font-size: 9px;
        text-anchor: middle;
    }

    .area {
        opacity: 0.1;
    }

    .line {
        fill: none;
        stroke-width: 2;
    }

    .dot {
        stroke: #1f1f1f;
        stroke-width: 2;
    }

    .tooltip-bg {
        fill: #1a1a1a;
        stroke: #353535;
        stroke-width: 1;
    }

    .tooltip-text {
        fill: #c2c6d6;
        font-size: 10px;
        font-weight: 600;
        text-anchor: middle;
    }

    .no-data {
        color: #8c909f;
        text-align: center;
        padding: 24px;
    }
</style>
