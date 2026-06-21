<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<h1>Alliance: {data.alliance?.name || "Unknown"}</h1>

{#if data.ok}
    {#if data.alliance}
        <section>
            <h2>Countries</h2>
            {#if data.alliance.countries.length === 0}
                <p>No countries.</p>
            {:else}
                <ul>
                    {#each data.alliance.countries as country (country.id)}
                        <li>
                            {country.name} ({country.code}) - {country.userCount}
                            users
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Participation</h2>
            <ul>
                <li>Total Damage: {data.alliance.participation.totalDamage}</li>
                <li>Battle Count: {data.alliance.participation.battleCount}</li>
            </ul>
        </section>

        <section>
            <h2>Top Damage (Top 10)</h2>
            {#if data.alliance.topDamage.length === 0}
                <p>No damage data.</p>
            {:else}
                <ul>
                    {#each data.alliance.topDamage as damageEntry, index (damageEntry.user.id)}
                        <li>
                            #{index + 1} - {damageEntry.user.username} (ID: {damageEntry
                                .user.id})
                            <ul>
                                <li>Avatar: {damageEntry.user.avatarUrl}</li>
                                <li>Total Damage: {damageEntry.totalDamage}</li>
                                <li>Battle Count: {damageEntry.battleCount}</li>
                            </ul>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Money Flows</h2>
            {#if data.alliance.moneyFlows.length === 0}
                <p>No money flow data.</p>
            {:else}
                <ul>
                    {#each data.alliance.moneyFlows as flow (flow.dayStart)}
                        <li>
                            <h3>Day: {flow.dayStart}</h3>
                            <ul>
                                <li>In Equipment: {flow.inEquipment}</li>
                                <li>Out Equipment: {flow.outEquipment}</li>
                                <li>In Items: {flow.inItems}</li>
                                <li>Out Items: {flow.outItems}</li>
                                <li>In Wages: {flow.inWages}</li>
                                <li>Out Wages: {flow.outWages}</li>
                                <li>
                                    In Equipment In Alliance: {flow.inEquipmentInAlliance}
                                </li>
                                <li>
                                    Out Equipment In Alliance: {flow.outEquipmentInAlliance}
                                </li>
                                <li>
                                    In Equipment Outside Alliance: {flow.inEquipmentOutsideAlliance}
                                </li>
                                <li>
                                    Out Equipment Outside Alliance: {flow.outEquipmentOutsideAlliance}
                                </li>
                                <li>
                                    In Items In Alliance: {flow.inItemsInAlliance}
                                </li>
                                <li>
                                    Out Items In Alliance: {flow.outItemsInAlliance}
                                </li>
                                <li>
                                    In Items Outside Alliance: {flow.inItemsOutsideAlliance}
                                </li>
                                <li>
                                    In Wages In Alliance: {flow.inWagesInAlliance}
                                </li>
                                <li>
                                    Out Wages In Alliance: {flow.outWagesInAlliance}
                                </li>
                                <li>
                                    In Wages Outside Alliance: {flow.inWagesOutsideAlliance}
                                </li>
                                <li>
                                    Out Wages Outside Alliance: {flow.outWagesOutsideAlliance}
                                </li>
                            </ul>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    {:else}
        <p>No alliance data found.</p>
    {/if}
{:else}
    <p>GraphQL check failed: {data.error}</p>
{/if}
