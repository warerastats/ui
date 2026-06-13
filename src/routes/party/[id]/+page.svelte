<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<h1>Party: {data.party?.name || 'Unknown'}</h1>

{#if data.ok}
	{#if data.party}
		<section>
			<h2>Overview</h2>
			{#if data.party.avatarUrl}
				<img src={data.party.avatarUrl} alt="{data.party.name} avatar" />
			{/if}
			{#if data.party.description}
				<p>{data.party.description}</p>
			{/if}
			{#if data.party.country}
				<p>Country: {data.party.country.name} ({data.party.country.code})</p>
			{/if}
			{#if data.party.region}
				<p>
					Region: {data.party.region.name}
					{#if data.party.region.country}
						({data.party.region.country.code})
					{/if}
					{#if data.party.region.initialCountry}
						— Initial: {data.party.region.initialCountry.code}
					{/if}
				</p>
			{/if}
		</section>

		<section>
			<h2>Ethics</h2>
			<ul>
				<li>Unethical: {data.party.ethics.unethical}</li>
				<li>Militarism: {data.party.ethics.militarism}</li>
				<li>Isolationism: {data.party.ethics.isolationism}</li>
				<li>Imperialism: {data.party.ethics.imperialism}</li>
				<li>Industrialism: {data.party.ethics.industrialism}</li>
			</ul>
		</section>

		<section>
			<h2>Leader</h2>
			{#if data.party.leader}
				<p>{data.party.leader.username} (ID: {data.party.leader.id})</p>
			{:else}
				<p>No leader.</p>
			{/if}
		</section>

		<section>
			<h2>Members ({data.party.members.length})</h2>
			{#if data.party.members.length === 0}
				<p>No members.</p>
			{:else}
				<ul>
					{#each data.party.members as member (member.id)}
						<li>{member.username} (ID: {member.id})</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Rules Countries</h2>
			{#if data.party.rulesCountries.length === 0}
				<p>No ruled countries.</p>
			{:else}
				<ul>
					{#each data.party.rulesCountries as country (country.id)}
						<li>{country.name} ({country.code})</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Name History</h2>
			{#if data.party.nameHistory.length === 0}
				<p>No name history.</p>
			{:else}
				<ul>
					{#each data.party.nameHistory as entry (entry.at)}
						<li>{entry.at}: {entry.name}</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Leader History</h2>
			{#if data.party.leaderHistory.length === 0}
				<p>No leader history.</p>
			{:else}
				<ul>
					{#each data.party.leaderHistory as entry (entry.at)}
						<li>{entry.at}: {entry.leader.username} (ID: {entry.leader.id})</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Ethics History</h2>
			{#if data.party.ethicsHistory.length === 0}
				<p>No ethics history.</p>
			{:else}
				<ul>
					{#each data.party.ethicsHistory as entry (entry.at)}
						<li>
							{entry.at}:
							Unethical {entry.ethics.unethical},
							Militarism {entry.ethics.militarism},
							Isolationism {entry.ethics.isolationism},
							Imperialism {entry.ethics.imperialism},
							Industrialism {entry.ethics.industrialism}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Wealth Reports</h2>
			{#if data.party.wealthReports.length === 0}
				<p>No wealth report data.</p>
			{:else}
				<ul>
					{#each data.party.wealthReports as report (report.dayStart)}
						<li>
							<strong>{report.dayStart}</strong>
							— Members: {report.memberCount},
							Damage: {report.totalDamage},
							Wealth: {report.totalWealth}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2>Money Flows</h2>
			{#if data.party.moneyFlows.length === 0}
				<p>No money flow data.</p>
			{:else}
				{#each data.party.moneyFlows as flow (flow.dayStart)}
					<details>
						<summary>{flow.dayStart}</summary>
						<ul>
							<li>In Equipment: {flow.inEquipment} (inside party: {flow.inEquipmentInsideParty}, outside alliance: {flow.inEquipmentOutsideAlliance}, same country outside party: {flow.inEquipmentSameCountryOutsideParty}, same alliance cross border: {flow.inEquipmentSameAllianceCrossBorder})</li>
							<li>Out Equipment: {flow.outEquipment} (inside party: {flow.outEquipmentInsideParty}, outside alliance: {flow.outEquipmentOutsideAlliance}, same country outside party: {flow.outEquipmentSameCountryOutsideParty}, same alliance cross border: {flow.outEquipmentSameAllianceCrossBorder})</li>
							<li>In Items: {flow.inItems} (inside party: {flow.inItemsInsideParty}, outside alliance: {flow.inItemsOutsideAlliance}, same country outside party: {flow.inItemsSameCountryOutsideParty}, same alliance cross border: {flow.inItemsSameAllianceCrossBorder})</li>
							<li>Out Items: {flow.outItems} (inside party: {flow.outItemsInsideParty}, outside alliance: {flow.outItemsOutsideAlliance}, same country outside party: {flow.outItemsSameCountryOutsideParty}, same alliance cross border: {flow.outItemsSameAllianceCrossBorder})</li>
							<li>In Wages: {flow.inWages} (inside party: {flow.inWagesInsideParty}, outside alliance: {flow.inWagesOutsideAlliance}, same country outside party: {flow.inWagesSameCountryOutsideParty}, same alliance cross border: {flow.inWagesSameAllianceCrossBorder})</li>
							<li>Out Wages: {flow.outWages} (inside party: {flow.outWagesInsideParty}, outside alliance: {flow.outWagesOutsideAlliance}, same country outside party: {flow.outWagesSameCountryOutsideParty}, same alliance cross border: {flow.outWagesSameAllianceCrossBorder})</li>
						</ul>
						{#if flow.counterparts.length > 0}
							<h4>Counterparts</h4>
							<ul>
								{#each flow.counterparts as cp (cp.country.id)}
									<li>
										{cp.country.name} ({cp.country.code}):
										Equipment in {cp.inEquipment} / out {cp.outEquipment},
										Items in {cp.inItems} / out {cp.outItems},
										Wages in {cp.inWages} / out {cp.outWages}
									</li>
								{/each}
							</ul>
						{/if}
					</details>
				{/each}
			{/if}
		</section>
	{:else}
		<p>No party data found.</p>
	{/if}
{:else}
	<p>GraphQL check failed: {data.error}</p>
{/if}
