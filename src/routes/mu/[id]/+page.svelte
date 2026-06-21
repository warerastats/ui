<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<h1>MU: {data.mu?.name || "Unknown"}</h1>

{#if data.ok}
    <section>
        <h2>Details</h2>
        <ul>
            <li>Avatar: {data.mu.avatarUrl}</li>
            <li>HQ: {data.mu.hq}</li>
            <li>Dorms: {data.mu.dorms}</li>
            <li>Merc Rep: {data.mu.mercRep}</li>
        </ul>
    </section>

    <section>
        <h2>Owner</h2>
        {#if data.mu.owner}
            <ul>
                <li>ID: {data.mu.owner.id}</li>
                <li>Username: {data.mu.owner.username}</li>
                <li>Avatar: {data.mu.owner.avatarUrl}</li>
            </ul>
        {:else}
            <p>No owner data.</p>
        {/if}
    </section>

    <section>
        <h2>Region</h2>
        {#if data.mu.region}
            <ul>
                <li>ID: {data.mu.region.id}</li>
                <li>Name: {data.mu.region.name}</li>
                <li>Country Code: {data.mu.region.country?.code ?? "None"}</li>
                <li>
                    Initial Country Code: {data.mu.region.initialCountry
                        ?.code ?? "None"}
                </li>
            </ul>
        {:else}
            <p>No region data.</p>
        {/if}
    </section>

    <section>
        <h2>Members</h2>
        {#if data.mu.members.length === 0}
            <p>No members.</p>
        {:else}
            <ul>
                {#each data.mu.members as member (member.id)}
                    <li>
                        {member.username} (ID: {member.id}) - {member.avatarUrl}
                    </li>
                {/each}
            </ul>
        {/if}
    </section>

    <section>
        <h2>Order Changes</h2>
        {#if data.mu.orderChanges.length === 0}
            <p>No order changes.</p>
        {:else}
            <ul>
                {#each data.mu.orderChanges as change, index (`oc-${index}`)}
                    <li>
                        At: {change.at}
                        <br />
                        Action: {change.action}
                        <ul>
                            <li>Battle ID: {change.battle.id}</li>
                            <li>
                                Defender Region ID: {change.battle
                                    .defenderRegion?.id ?? "None"}
                            </li>
                            <li>
                                Defender Region Name: {change.battle
                                    .defenderRegion?.name ?? "None"}
                            </li>
                            <li>
                                Defender Region Country Code: {change.battle
                                    .defenderRegion?.country?.code ?? "None"}
                            </li>
                            <li>
                                Defender Region Initial Country Code: {change
                                    .battle.defenderRegion?.initialCountry
                                    ?.code ?? "None"}
                            </li>
                        </ul>
                    </li>
                {/each}
            </ul>
        {/if}
    </section>

    <section>
        <h2>Name History</h2>
        {#if data.mu.nameHistory.length === 0}
            <p>No name history.</p>
        {:else}
            <ul>
                {#each data.mu.nameHistory as entry, index (`nh-${index}`)}
                    <li>{entry.at}: {entry.name}</li>
                {/each}
            </ul>
        {/if}
    </section>

    <section>
        <h2>Owner History</h2>
        {#if data.mu.ownerHistory.length === 0}
            <p>No owner history.</p>
        {:else}
            <ul>
                {#each data.mu.ownerHistory as entry, index (`oh-${index}`)}
                    <li>
                        {entry.at}: {entry.owner.username} (ID: {entry.owner
                            .id}) - {entry.owner.avatarUrl}
                    </li>
                {/each}
            </ul>
        {/if}
    </section>

    <section>
        <h2>Wealth Reports</h2>
        {#if data.mu.wealthReports.length === 0}
            <p>No wealth reports.</p>
        {:else}
            <ul>
                {#each data.mu.wealthReports as report (report.dayStart)}
                    <li>
                        {report.dayStart}: totalDamage={report.totalDamage},
                        totalWealth={report.totalWealth}
                    </li>
                {/each}
            </ul>
        {/if}
    </section>
{:else}
    <p>GraphQL check failed: {data.error}</p>
{/if}
