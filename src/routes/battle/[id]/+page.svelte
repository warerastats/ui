<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<h1>Battle</h1>

{#if data.ok}
	{#if data.battle}
		<section>
			<h2>Overview</h2>
			<ul>
				<li>Status: {data.battle.isActive ? 'Active' : 'Ended'}</li>
				{#if data.battle.endedAt}
					<li>Ended At: {data.battle.endedAt}</li>
				{/if}
				{#if data.battle.winnerSide}
					<li>Winner: {data.battle.winnerSide}</li>
				{/if}
				<li>
					Attacker: {data.battle.attackerCountry?.name ?? 'Unknown'} ({data.battle.attackerCountry?.code ?? '?'})
					{#if data.battle.attackerAlliance}
						— {data.battle.attackerAlliance.name}
					{/if}
					— Damage: {data.battle.attackerDamages}
				</li>
				<li>
					Defender: {data.battle.defenderCountry?.name ?? 'Unknown'} ({data.battle.defenderCountry?.code ?? '?'})
					{#if data.battle.defenderAlliance}
						— {data.battle.defenderAlliance.name}
					{/if}
					— Damage: {data.battle.defenderDamages}
				</li>
				{#if data.battle.defenderRegion}
					<li>
						Region: {data.battle.defenderRegion.name}
						(country: {data.battle.defenderRegion.country.code},
						initial: {data.battle.defenderRegion.initialCountry.code})
					</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2>Top Damage (Top 10)</h2>
			{#if data.battle.topDamage.length === 0}
				<p>No damage data.</p>
			{:else}
				<ol>
					{#each data.battle.topDamage as entry (entry.user.id)}
						<li>{entry.user.username} — {entry.totalDamage}</li>
					{/each}
				</ol>
			{/if}
		</section>

		<section>
			<h2>Order Changes</h2>
			{#if data.battle.orderChanges.length === 0}
				<p>No order changes.</p>
			{:else}
				<ul>
					{#each data.battle.orderChanges as change (change.at + change.side + change.kind)}
						<li>
							{change.at} — {change.side} {change.action} ({change.kind}):
							{#if change.entity.__typename === 'Country'}
								{change.entity.name} ({change.entity.code})
							{:else if change.entity.__typename === 'Mu'}
								{change.entity.name}
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Damage Reports</h2>
			{#if data.battle.damageReports.length === 0}
				<p>No damage reports.</p>
			{:else}
				<ul>
					{#each data.battle.damageReports as report (report.intervalStart + report.side)}
						<li>
							{report.intervalStart} — {report.side}: {report.damage}
							{#if report.equipment.length > 0}
								<ul>
									{#each report.equipment as eq (eq.itemCode)}
										<li>{eq.itemCode}: {eq.count} used (value: {eq.value})</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{:else}
		<p>No battle data found.</p>
	{/if}
{:else}
	<p>GraphQL check failed: {data.error}</p>
{/if}
