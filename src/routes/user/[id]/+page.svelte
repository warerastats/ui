<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<h1>User: {data.user?.username || "Unknown"}</h1>

{#if data.ok}
    {#if data.user}
        <section>
            <h2>Overview</h2>
            {#if data.user.avatarUrl}
                <img
                    src={data.user.avatarUrl}
                    alt="{data.user.username} avatar"
                />
            {/if}
            <ul>
                <li>Level: {data.user.level}</li>
                <li>Military Rank: {data.user.militaryRank}</li>
                {#if data.user.country}
                    <li>
                        Country: {data.user.country.name} ({data.user.country
                            .code})
                    </li>
                {/if}
                {#if data.user.party}
                    <li>Party: {data.user.party.name}</li>
                {/if}
                {#if data.user.mu}
                    <li>Military Unit: {data.user.mu.name}</li>
                {/if}
            </ul>
        </section>

        <section>
            <h2>Skills</h2>
            {#if data.user.skills.length === 0}
                <p>No skills.</p>
            {:else}
                <ul>
                    {#each data.user.skills as skill (skill.key)}
                        <li>{skill.key}: {skill.value}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Transactions</h2>
            {#if data.user.transactions.length === 0}
                <p>No transactions.</p>
            {:else}
                <ul>
                    {#each data.user.transactions as transaction (transaction.id)}
                        <li>
                            {#if transaction.__typename === "MarketTransaction"}
                                Market: {transaction.money} for {transaction
                                    .item.itemCode}
                                {#if transaction.seller}
                                    from {transaction.seller.username}
                                {/if}
                                {#if transaction.buyer}
                                    to {transaction.buyer.username}
                                {/if}
                            {:else if transaction.__typename === "CaseTransaction"}
                                Case: {transaction.case} ({transaction.item
                                    .itemCode})
                            {:else if transaction.__typename === "TradeTransaction"}
                                Trade: {transaction.quantity}x {transaction.itemCode}
                                for {transaction.money}
                                {#if transaction.sellerCountry}
                                    ({transaction.sellerCountry.name} → {transaction
                                        .buyerCountry?.name})
                                {/if}
                            {:else if transaction.__typename === "CraftTransaction"}
                                Crafted: {transaction.item.itemCode}
                            {:else if transaction.__typename === "LootTransaction"}
                                Looted: {transaction.item.itemCode}
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Battles ({data.user.battles.length})</h2>
            {#if data.user.battles.length === 0}
                <p>No battles.</p>
            {:else}
                <ul>
                    {#each data.user.battles as battle (battle.id)}
                        <li>
                            {battle.defenderRegion?.name || "Unknown region"}
                            ({battle.attackerCountry?.code || "?"} vs {battle
                                .defenderCountry?.code || "?"})
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Perfect Items ({data.user.perfectItems.length})</h2>
            {#if data.user.perfectItems.length === 0}
                <p>No perfect items.</p>
            {:else}
                <ul>
                    {#each data.user.perfectItems as item (item.itemCode)}
                        <li>{item.itemCode}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Used Items ({data.user.usedItems.length})</h2>
            {#if data.user.usedItems.length === 0}
                <p>No used items.</p>
            {:else}
                <ul>
                    {#each data.user.usedItems as item (item.itemCode)}
                        <li>{item.itemCode}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Owned Companies</h2>
            {#if data.user.ownedCompanies.length === 0}
                <p>No owned companies.</p>
            {:else}
                <ul>
                    {#each data.user.ownedCompanies as company (company.id)}
                        <li>
                            <strong>{company.name}</strong> (produces {company.itemCode})
                            <ul>
                                <li>Region: {company.region.name}</li>
                                <li>
                                    Country: {company.region.country.code}
                                    {#if company.region.initialCountry.code !== company.region.country.code}
                                        (originally {company.region
                                            .initialCountry.code})
                                    {/if}
                                </li>
                                <li>
                                    Employees: {company.employees.length}
                                    {#if company.employees.length > 0}
                                        <ul>
                                            {#each company.employees as employee (employee.user.id)}
                                                <li>
                                                    {employee.user.username}:
                                                    wage {employee.wage},
                                                    fidelity {employee.fidelity}
                                                </li>
                                            {/each}
                                        </ul>
                                    {/if}
                                </li>
                            </ul>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Trade Offers</h2>
            {#if data.user.tradeOffers.length === 0}
                <p>No trade offers.</p>
            {:else}
                <ul>
                    {#each data.user.tradeOffers as offer (offer.itemCode + offer.side)}
                        <li>
                            {offer.side}: {offer.quantity}x {offer.itemCode} @ {offer.price}
                            {#if offer.cancelled}
                                (cancelled)
                            {:else}
                                ({offer.fulfilled}/{offer.quantity} fulfilled)
                            {/if}
                            <br />
                            Since: {offer.since}
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Skill Snapshots</h2>
            {#if data.user.skillSnapshots.length === 0}
                <p>No skill snapshots.</p>
            {:else}
                <ul>
                    {#each data.user.skillSnapshots as snapshot (snapshot.since)}
                        <details>
                            <summary>{snapshot.since}</summary>
                            <ul>
                                <li>Energy: {snapshot.set.energy}</li>
                                <li>Health: {snapshot.set.health}</li>
                                <li>Hunger: {snapshot.set.hunger}</li>
                                <li>Attack: {snapshot.set.attack}</li>
                                <li>Companies: {snapshot.set.companies}</li>
                                <li>
                                    Entrepreneurship: {snapshot.set
                                        .entrepreneurship}
                                </li>
                                <li>Production: {snapshot.set.production}</li>
                                <li>
                                    Critical Chance: {snapshot.set
                                        .criticalChance}
                                </li>
                                <li>
                                    Critical Damages: {snapshot.set
                                        .criticalDamages}
                                </li>
                                <li>Armor: {snapshot.set.armor}</li>
                                <li>Precision: {snapshot.set.precision}</li>
                                <li>Dodge: {snapshot.set.dodge}</li>
                                <li>Loot Chance: {snapshot.set.lootChance}</li>
                                <li>Management: {snapshot.set.management}</li>
                            </ul>
                        </details>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Name History</h2>
            {#if data.user.nameHistory.length === 0}
                <p>No name history.</p>
            {:else}
                <ul>
                    {#each data.user.nameHistory as entry (entry.at)}
                        <li>{entry.at}: {entry.username}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Country History</h2>
            {#if data.user.countryHistory.length === 0}
                <p>No country history.</p>
            {:else}
                <ul>
                    {#each data.user.countryHistory as entry (entry.at)}
                        <li>
                            {entry.at}: {entry.country.name} ({entry.country
                                .code})
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Military Unit History</h2>
            {#if data.user.muHistory.length === 0}
                <p>No military unit history.</p>
            {:else}
                <ul>
                    {#each data.user.muHistory as entry (entry.at)}
                        <li>{entry.at}: {entry.mu.name}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Party History</h2>
            {#if data.user.partyHistory.length === 0}
                <p>No party history.</p>
            {:else}
                <ul>
                    {#each data.user.partyHistory as entry (entry.at)}
                        <li>{entry.at}: {entry.party.name}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Wage History</h2>
            {#if data.user.wageHistory.length === 0}
                <p>No wage history.</p>
            {:else}
                <ul>
                    {#each data.user.wageHistory as entry (entry.at)}
                        <li>{entry.at}: {entry.wage}</li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Finance Reports</h2>
            {#if data.user.financeReports.length === 0}
                <p>No finance reports.</p>
            {:else}
                <ul>
                    {#each data.user.financeReports as report (report.dayStart)}
                        <details>
                            <summary>{report.dayStart}</summary>
                            <ul>
                                <li>Wages Paid: {report.wagesPaid}</li>
                                <li>Wages Earned: {report.wagesEarned}</li>
                                <li>Items Bought: {report.itemsBought}</li>
                                <li>Items Sold: {report.itemsSold}</li>
                                <li>Equipment Bought: {report.equipBought}</li>
                                <li>Equipment Sold: {report.equipSold}</li>
                                <li>
                                    Value Dismantled: {report.valueDismantled}
                                </li>
                                <li>Cases Opened: {report.casesOpened}</li>
                                <li>Cases Net: {report.casesNet}</li>
                            </ul>
                        </details>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Flip Events</h2>
            {#if data.user.flipEvents.length === 0}
                <p>No flip events.</p>
            {:else}
                <ul>
                    {#each data.user.flipEvents as event (event.at + event.itemCode)}
                        <li>
                            {event.at}: {event.quantity}x {event.itemCode}
                            — Bought: {event.buyCost}, Sold: {event.sellRevenue},
                            Profit: {event.profit}
                            (held for {(event.heldMs / 1000 / 60 / 60).toFixed(
                                1,
                            )} hours)
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>

        <section>
            <h2>Flip State</h2>
            <ul>
                <li>Total Flips: {data.user.flipState.totalFlips}</li>
                <li>Total Profit: {data.user.flipState.totalProfit}</li>
            </ul>
        </section>

        <section>
            <h2>Battle Participation</h2>
            <ul>
                <li>
                    Total Damage: {data.user.battleParticipation.totalDamage}
                </li>
                <li>
                    Battles Participated: {data.user.battleParticipation
                        .battlesParticipated}
                </li>
                <li>
                    Negative Damage: {data.user.battleParticipation
                        .negativeDamage}
                </li>
                <li>
                    Own Country Battles: {data.user.battleParticipation
                        .ownCountryBattles}
                </li>
                <li>
                    Own Country Participated: {data.user.battleParticipation
                        .ownCountryParticipated}
                </li>
                <li>
                    MU Order Battles: {data.user.battleParticipation
                        .muOrderBattles}
                </li>
                <li>
                    MU Order Participated: {data.user.battleParticipation
                        .muOrderParticipated}
                </li>
                <li>Updated At: {data.user.battleParticipation.updatedAt}</li>
            </ul>
        </section>
    {:else}
        <p>No user data found.</p>
    {/if}
{:else}
    <p>GraphQL check failed: {data.error}</p>
{/if}
