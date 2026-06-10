<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<h1>Item: {data.itemCode}</h1>

{#if data.ok}
	<section>
		<h2>Market Report</h2>
		{#if data.marketReport}
			<ul>
				<li>itemCode: {data.marketReport.itemCode}</li>
				<li>volume24h: {data.marketReport.volume24h}</li>
				<li>avgWeighted24h: {data.marketReport.avgWeighted24h}</li>
				<li>pctChange24h: {data.marketReport.pctChange24h}%</li>
				<li>low24h: {data.marketReport.low24h}</li>
				<li>high24h: {data.marketReport.high24h}</li>
				<li>spread: {data.marketReport.spread}</li>
				<li>updatedAt: {data.marketReport.updatedAt}</li>
			</ul>

			<h3>Bids</h3>
			{#if data.marketReport.bids.length === 0}
				<p>No bids.</p>
			{:else}
				<ul>
					{#each data.marketReport.bids as bid, index (`bid-${index}`)}
						<li>price: {bid.price}, quantity: {bid.quantity}</li>
					{/each}
				</ul>
			{/if}

			<h3>Asks</h3>
			{#if data.marketReport.asks.length === 0}
				<p>No asks.</p>
			{:else}
				<ul>
					{#each data.marketReport.asks as ask, index (`ask-${index}`)}
						<li>price: {ask.price}, quantity: {ask.quantity}</li>
					{/each}
				</ul>
			{/if}

			<h3>Effective Buy</h3>
			{#if data.marketReport.effectiveBuy.length === 0}
				<p>No effective buy entries.</p>
			{:else}
				<ul>
					{#each data.marketReport.effectiveBuy as level, index (`eb-${index}`)}
						<li>size: {level.size}, avgPrice: {level.avgPrice}</li>
					{/each}
				</ul>
			{/if}

			<h3>Effective Sell</h3>
			{#if data.marketReport.effectiveSell.length === 0}
				<p>No effective sell entries.</p>
			{:else}
				<ul>
					{#each data.marketReport.effectiveSell as level, index (`es-${index}`)}
						<li>size: {level.size}, avgPrice: {level.avgPrice}</li>
					{/each}
				</ul>
			{/if}
		{:else}
			<p>No market report available.</p>
		{/if}
	</section>

	<section>
		<h2>Candles</h2>
		{#if data.candles.length === 0}
			<p>No candles available.</p>
		{:else}
			<ul>
				{#each data.candles as candle (candle.bucketStart)}
					<li>
						bucketStart: {candle.bucketStart}, open: {candle.open},
						high: {candle.high}, low: {candle.low}, close: {candle.close},
						avg: {candle.avg}, volume: {candle.volume}, money: {candle.money},
						count: {candle.count}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{:else}
	<p>GraphQL check failed: {data.error}</p>
{/if}

<section>
    <h2>Transactions</h2>
	{#if data.transactions.length === 0}
		<p>No transactions found.</p>
	{:else}
		<ul>
			{#each data.transactions as transaction, index (`tx-${index}`)}
				<li>
					<p>money: {transaction.money}</p>
					<p>quantity: {transaction.quantity}</p>
					<p>timeTillSale: {transaction.timeTillSale}</p>
					<p>
						seller: {transaction.seller.username} | buyer:
						{transaction.buyer.username}
					</p>
					<p>
						sellerMu: {transaction.sellerMu?.name ?? "None"} | buyerMu:
						{transaction.buyerMu?.name ?? "None"}
					</p>
					<p>
						sellerCountry:
						{transaction.sellerCountry
							? `${transaction.sellerCountry.name} (${transaction.sellerCountry.code})`
							: "None"}
						| buyerCountry:
						{transaction.buyerCountry
							? `${transaction.buyerCountry.name} (${transaction.buyerCountry.code})`
							: "None"}
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</section>
