<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<h1>Region: {data.region?.name || "Unknown"}</h1>

{#if data.ok}
    {#if data.region}
        <section>
            <h2>Overview</h2>
            <ul>
                <li>Capital: {data.region.isCapital ? "Yes" : "No"}</li>
                {#if data.region.country}
                    <li>
                        Current Country: {data.region.country.name} ({data
                            .region.country.code})
                    </li>
                {/if}
                {#if data.region.initialCountry}
                    <li>
                        Initial Country: {data.region.initialCountry.name} ({data
                            .region.initialCountry.code})
                    </li>
                {/if}
            </ul>
        </section>

        <section>
            <h2>Neighbors</h2>
            {#if data.region.neighbors.length === 0}
                <p>No neighbors.</p>
            {:else}
                <ul>
                    {#each data.region.neighbors as neighbor (neighbor.country.id)}
                        <li>
                            {neighbor.country.name} ({neighbor.country.code})
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Parties</h2>
            {#if data.region.parties.length === 0}
                <p>No parties.</p>
            {:else}
                <ul>
                    {#each data.region.parties as party (party.id)}
                        <li>{party.name}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Military Units</h2>
            {#if data.region.mus.length === 0}
                <p>No military units.</p>
            {:else}
                <ul>
                    {#each data.region.mus as mu (mu.id)}
                        <li>{mu.name}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Companies</h2>
            {#if data.region.companies.length === 0}
                <p>No companies.</p>
            {:else}
                <ul>
                    {#each data.region.companies as company, index (company.itemCode + "-" + index)}
                        <li>{company.itemCode}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Recent Battles</h2>
            {#if data.region.battles.length === 0}
                <p>No recent battles.</p>
            {:else}
                <ul>
                    {#each data.region.battles as battle, index (index)}
                        <li>
                            {battle.attackerCountry?.code || "?"} vs {battle
                                .defenderCountry?.code || "?"}
                            — Winner: {battle.winnerSide || "N/A"}
                            — Damage: {battle.attackerDamages} / {battle.defenderDamages}
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Owner History</h2>
            {#if data.region.ownerHistory.length === 0}
                <p>No owner history.</p>
            {:else}
                <ul>
                    {#each data.region.ownerHistory as entry (entry.at)}
                        <li>
                            {entry.at}: {entry.country.name} ({entry.country
                                .code})
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Latest Deposit</h2>
            {#if data.region.deposits.length === 0}
                <p>No deposit data.</p>
            {:else}
                {#each data.region.deposits as deposit (deposit.at)}
                    <ul>
                        <li>At: {deposit.at}</li>
                        <li>Starts: {deposit.startsAt}</li>
                        <li>Ends: {deposit.endsAt}</li>
                        <li>Type: {deposit.type}</li>
                    </ul>
                {/each}
            {/if}
        </section>

        <section>
            <h2>Latest Strategic Resource</h2>
            {#if data.region.strategicResources.length === 0}
                <p>No strategic resource data.</p>
            {:else}
                {#each data.region.strategicResources as resource (resource.at)}
                    <p>{resource.at}: {resource.resource}</p>
                {/each}
            {/if}
        </section>
    {:else}
        <p>No region data found.</p>
    {/if}
{:else}
    <p>GraphQL check failed: {data.error}</p>
{/if}
