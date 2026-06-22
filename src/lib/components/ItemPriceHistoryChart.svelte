<script lang="ts">
    import Coin from "$lib/components/Coin.svelte";
    import { onMount } from "svelte";
    import type { Chart, KLineData } from "klinecharts";
    import type { ItemCandle, ItemCandlesApiResponse } from "$lib";

    type TimeframeKey = "10m" | "30m" | "1h" | "2h" | "3h" | "4h" | "6h";

    const TIMEFRAMES: Array<{ key: TimeframeKey; minutes: number }> = [
        { key: "10m", minutes: 10 },
        { key: "30m", minutes: 30 },
        { key: "1h", minutes: 60 },
        { key: "2h", minutes: 120 },
        { key: "3h", minutes: 180 },
        { key: "4h", minutes: 240 },
        { key: "6h", minutes: 360 },
    ];

    let {
        itemCode,
        initialCandles,
    }: {
        itemCode: string;
        initialCandles: ItemCandle[];
    } = $props();

    let selectedTimeframe = $state<TimeframeKey>("1h");
    let allCandles = $state<ItemCandle[]>([]);
    let chartContainer: HTMLDivElement | null = null;
    let chart: Chart | null = null;
    let visibleCandles = $state<ItemCandle[]>([]);

    let displayedCandles = $derived.by(() =>
        aggregateCandles(allCandles, getSelectedMinutes()),
    );

    let statCandles = $derived.by(() =>
        visibleCandles.length > 0 ? visibleCandles : displayedCandles,
    );

    let latestCandle = $derived(statCandles.at(-1) ?? null);
    let earliestCandle = $derived(statCandles[0] ?? null);
    let visibleLow = $derived.by(() => {
        if (statCandles.length === 0) {
            return null;
        }

        return Math.min(...statCandles.map((candle) => candle.low));
    });
    let visibleHigh = $derived.by(() => {
        if (statCandles.length === 0) {
            return null;
        }

        return Math.max(...statCandles.map((candle) => candle.high));
    });
    let movePct = $derived.by(() => {
        if (!latestCandle || !earliestCandle || earliestCandle.open === 0) {
            return 0;
        }

        return (
            ((latestCandle.close - earliestCandle.open) / earliestCandle.open) *
            100
        );
    });

    $effect(() => {
        allCandles = sortAndDedupe(initialCandles);
    });

    function parseBucketStart(value: string): number {
        return new Date(value).getTime();
    }

    function sortAndDedupe(candles: ItemCandle[]): ItemCandle[] {
        const map = new Map<string, ItemCandle>();
        for (const candle of candles) {
            map.set(candle.bucketStart, candle);
        }

        return [...map.values()].sort(
            (a, b) =>
                parseBucketStart(a.bucketStart) -
                parseBucketStart(b.bucketStart),
        );
    }

    function getSelectedMinutes(): number {
        return (
            TIMEFRAMES.find((tf) => tf.key === selectedTimeframe)?.minutes ?? 60
        );
    }

    function aggregateCandles(
        candles: ItemCandle[],
        minutes: number,
    ): ItemCandle[] {
        if (candles.length === 0 || minutes <= 10) {
            return candles;
        }

        const bucketMs = minutes * 60 * 1000;
        const grouped = new Map<number, ItemCandle[]>();

        for (const candle of candles) {
            const timestamp = parseBucketStart(candle.bucketStart);
            const bucket = Math.floor(timestamp / bucketMs) * bucketMs;
            const list = grouped.get(bucket) ?? [];
            list.push(candle);
            grouped.set(bucket, list);
        }

        const buckets = [...grouped.entries()].sort((a, b) => a[0] - b[0]);
        return buckets.map(([bucket, list]) => {
            const sorted = [...list].sort(
                (a, b) =>
                    parseBucketStart(a.bucketStart) -
                    parseBucketStart(b.bucketStart),
            );
            const first = sorted[0];
            const last = sorted[sorted.length - 1];

            let high = Number.NEGATIVE_INFINITY;
            let low = Number.POSITIVE_INFINITY;
            let volume = 0;
            let money = 0;
            let count = 0;

            for (const item of sorted) {
                high = Math.max(high, item.high);
                low = Math.min(low, item.low);
                volume += item.volume;
                money += item.money;
                count += item.count;
            }

            return {
                bucketStart: new Date(bucket).toISOString(),
                open: first.open,
                high,
                low,
                close: last.close,
                avg:
                    sorted.reduce((acc, item) => acc + item.avg, 0) /
                    sorted.length,
                volume,
                money,
                count,
            };
        });
    }

    function toKlineData(candles: ItemCandle[]): KLineData[] {
        return candles.map((candle) => ({
            timestamp: parseBucketStart(candle.bucketStart),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            turnover: candle.money,
        }));
    }

    function syncChartData() {
        if (!chart) {
            return;
        }

        const span = getSelectedMinutes();
        const chartData = toKlineData(displayedCandles);

        chart.setPeriod({ type: "minute", span });
        chart.setDataLoader({
            getBars: ({ callback }) => {
                callback(chartData, false);
            },
        });
        chart.resetData();
        updateVisibleCandles();
    }

    function updateVisibleCandles() {
        if (!chart) {
            visibleCandles = displayedCandles;
            return;
        }

        const range = chart.getVisibleRange();
        const maxIndex = displayedCandles.length - 1;
        if (maxIndex < 0) {
            visibleCandles = [];
            return;
        }

        const fromIndex = Math.max(0, Math.floor(range.from));
        const toIndex = Math.min(maxIndex, Math.ceil(range.to));

        if (toIndex < fromIndex) {
            visibleCandles = displayedCandles;
            return;
        }

        visibleCandles = displayedCandles.slice(fromIndex, toIndex + 1);
    }

    async function pollCandles() {
        const newest = allCandles[allCandles.length - 1];
        const fromDate = newest
            ? new Date(
                  parseBucketStart(newest.bucketStart) - 2 * 60 * 60 * 1000,
              )
            : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const toDate = new Date();

        const from = encodeURIComponent(fromDate.toISOString());
        const to = encodeURIComponent(toDate.toISOString());

        try {
            const response = await fetch(
                `/api/item/${itemCode}/candles?from=${from}&to=${to}`,
            );

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as ItemCandlesApiResponse;
            if (payload.candles.length === 0) {
                return;
            }

            allCandles = sortAndDedupe([...allCandles, ...payload.candles]);
            syncChartData();
        } catch {
            // Best effort polling; keep current chart data on network failures.
        }
    }

    $effect(() => {
        selectedTimeframe;
        syncChartData();
    });

    onMount(() => {
        let pollTimer: number | null = null;
        const handleResize = () => chart?.resize();
        const handleVisibleRangeChange = () => {
            updateVisibleCandles();
        };
        let disposeChart: ((dcs: HTMLElement | Chart | string) => void) | null =
            null;

        const setup = async () => {
            if (!chartContainer) {
                return;
            }

            const { init } = await import("klinecharts");
            const { dispose } = await import("klinecharts");
            disposeChart = dispose;
            chart = init(chartContainer);

            if (!chart) {
                return;
            }

            chart.setStyles({
                candle: {
                    type: "candle_solid",
                    bar: {
                        upColor: "#4af0c0",
                        downColor: "#ff9e95",
                        noChangeColor: "#c2c6d6",
                        upBorderColor: "#4af0c0",
                        downBorderColor: "#ff9e95",
                        noChangeBorderColor: "#c2c6d6",
                        upWickColor: "#4af0c0",
                        downWickColor: "#ff9e95",
                        noChangeWickColor: "#c2c6d6",
                    },
                },
                grid: {
                    horizontal: {
                        show: true,
                        color: "rgba(255,255,255,0.07)",
                        style: "dashed",
                        dashedValue: [2, 4],
                        size: 1,
                    },
                    vertical: {
                        show: true,
                        color: "rgba(255,255,255,0.04)",
                        style: "dashed",
                        dashedValue: [2, 4],
                        size: 1,
                    },
                },
                xAxis: {
                    axisLine: { show: true, color: "#383838", size: 1 },
                    tickText: {
                        show: true,
                        color: "#8c909f",
                        size: 10,
                        family: "Inter, sans-serif",
                        weight: "500",
                    },
                },
                yAxis: {
                    axisLine: { show: true, color: "#383838", size: 1 },
                    tickText: {
                        show: true,
                        color: "#8c909f",
                        size: 10,
                        family: "Inter, sans-serif",
                        weight: "500",
                    },
                    tickLine: {
                        show: true,
                        color: "#383838",
                        size: 1,
                        length: 3,
                    },
                },
            });

            chart.setSymbol({
                ticker: itemCode,
                pricePrecision: 4,
                volumePrecision: 0,
            });

            syncChartData();
            chart.subscribeAction(
                "onVisibleRangeChange",
                handleVisibleRangeChange,
            );
            chart.subscribeAction("onZoom", handleVisibleRangeChange);
            chart.subscribeAction("onScroll", handleVisibleRangeChange);
            updateVisibleCandles();
            await pollCandles();

            pollTimer = window.setInterval(() => {
                void pollCandles();
            }, 30_000);
            window.addEventListener("resize", handleResize);
        };

        void setup();

        return () => {
            if (pollTimer !== null) {
                window.clearInterval(pollTimer);
            }
            window.removeEventListener("resize", handleResize);
            if (chart && disposeChart) {
                chart.unsubscribeAction(
                    "onVisibleRangeChange",
                    handleVisibleRangeChange,
                );
                chart.unsubscribeAction("onZoom", handleVisibleRangeChange);
                chart.unsubscribeAction("onScroll", handleVisibleRangeChange);
                disposeChart(chart);
            }
            chart = null;
        };
    });
</script>

<div class="price-history">
    <div class="chart-meta">
        <div class="meta-row">
            <span class="meta-label">Last</span>
            <span class="meta-value money-value">
                <Coin width="11px" height="11px" />
                {latestCandle
                    ? latestCandle.close.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                      })
                    : "-"}
            </span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Range</span>
            <span class="meta-value money-value">
                <Coin width="11px" height="11px" />
                {visibleLow !== null && visibleHigh !== null
                    ? `${visibleLow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} - ${visibleHigh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                    : "-"}
            </span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Move</span>
            <span
                class="meta-value"
                class:positive={movePct >= 0}
                class:negative={movePct < 0}
            >
                {movePct >= 0 ? "+" : ""}{movePct.toFixed(2)}%
            </span>
        </div>
    </div>

    <div class="timeframe-selector">
        {#each TIMEFRAMES as timeframe (timeframe.key)}
            <button
                type="button"
                class:active={selectedTimeframe === timeframe.key}
                onclick={() => (selectedTimeframe = timeframe.key)}
            >
                {timeframe.key}
            </button>
        {/each}
    </div>

    <div class="chart-shell" bind:this={chartContainer}></div>
</div>

<style lang="scss">
    div.price-history {
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
        min-height: 480px;
    }

    div.chart-meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
    }

    div.meta-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 10px;
        border: 1px solid #353535;
        background: #1f1f1f;
    }

    span.meta-label {
        color: #8c909f;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    span.meta-value {
        color: #c2c6d6;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
        font-variant-numeric: tabular-nums;

        &.positive {
            color: #4af0c0;
        }

        &.negative {
            color: #ffb4ab;
        }

        &.money-value {
            display: inline-flex;
            align-items: center;
            gap: 4px;

            :global(svg) {
                vertical-align: baseline;
                flex-shrink: 0;
            }
        }
    }

    div.timeframe-selector {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    button {
        border: 1px solid #353535;
        background: #1f1f1f;
        color: #8c909f;
        border-radius: 5px;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.3px;
        cursor: pointer;
        transition:
            border-color 0.15s ease,
            color 0.15s ease;

        &:hover {
            border-color: #4b4b4b;
            color: #c2c6d6;
        }

        &.active {
            color: #0f1722;
            background: #4af0c0;
            border-color: #4af0c0;
        }
    }

    div.chart-shell {
        flex: 1;
        min-height: 0;
        width: 100%;
        border: 1px solid #353535;
        background: #1f1f1f;
    }

    @media (max-width: 900px) {
        div.chart-meta {
            grid-template-columns: 1fr;
        }

        div.price-history {
            min-height: 480px;
        }
    }
</style>
