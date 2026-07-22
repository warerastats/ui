import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { runGraphQL } from "$lib/server/graphql/client";
import type {
    CountryTaxFlowExplorerResponse,
    CountryTaxFlowExplorerSource,
} from "$lib";
import type { CountrySummary } from "$lib";

const TAX_FLOW_QUERY = `
  query CountryTaxFlowExplorer($id: ID!, $from: DateTime!, $to: DateTime!) {
    country(id: $id) {
      taxFlows(from: $from, to: $to) {
        totalTax
        sources {
          total
          hijacked
          foreignTaxRedirected
          country {
            id
            name
            code
          }
        }
      }
    }
  }
`;

type TaxFlowQueryResult = {
    country: {
        taxFlows: Array<{
            totalTax: number;
            sources: Array<{
                total: number;
                hijacked: number;
                foreignTaxRedirected: number;
                country: CountrySummary;
            }>;
        }>;
    } | null;
};

function getDefaultRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 14 * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
}

function asIsoDate(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

export const GET: RequestHandler = async ({ fetch, params, url }) => {
    const id = params.id?.trim();

    if (!id) {
        return json(
            {
                ok: false,
                error: "Missing country id",
                from: "",
                to: "",
                totalTax: 0,
                totalFromSources: 0,
                sources: [],
            } satisfies CountryTaxFlowExplorerResponse,
            { status: 400 },
        );
    }

    const defaultRange = getDefaultRange();
    const from = asIsoDate(url.searchParams.get("from")) ?? defaultRange.from;
    const to = asIsoDate(url.searchParams.get("to")) ?? defaultRange.to;

    if (new Date(from).getTime() >= new Date(to).getTime()) {
        return json(
            {
                ok: false,
                error: "Invalid range: from must be before to",
                from,
                to,
                totalTax: 0,
                totalFromSources: 0,
                sources: [],
            } satisfies CountryTaxFlowExplorerResponse,
            { status: 400 },
        );
    }

    try {
        const result = await runGraphQL<TaxFlowQueryResult>(
            fetch,
            TAX_FLOW_QUERY,
            { id, from, to },
        );

        if (result.errors?.length) {
            return json(
                {
                    ok: false,
                    error: result.errors[0]?.message || "Unknown GraphQL error",
                    from,
                    to,
                    totalTax: 0,
                    totalFromSources: 0,
                    sources: [],
                } satisfies CountryTaxFlowExplorerResponse,
                { status: 502 },
            );
        }

        const taxFlows = result.data?.country?.taxFlows ?? [];

        let totalTax = 0;
        const byCountry = new Map<string, CountryTaxFlowExplorerSource>();

        for (const tf of taxFlows) {
            totalTax += tf.totalTax;
            for (const src of tf.sources) {
                const key = src.country.id;
                const existing = byCountry.get(key);
                if (existing) {
                    existing.total += src.total;
                    existing.hijacked += src.hijacked;
                    existing.foreignTaxRedirected += src.foreignTaxRedirected;
                } else {
                    byCountry.set(key, {
                        country: src.country,
                        total: src.total,
                        hijacked: src.hijacked,
                        foreignTaxRedirected: src.foreignTaxRedirected,
                    });
                }
            }
        }

        const sources = [...byCountry.values()].sort(
            (a, b) => b.total - a.total,
        );
        const totalFromSources = sources.reduce((s, src) => s + src.total, 0);

        return json({
            ok: true,
            from,
            to,
            totalTax,
            totalFromSources,
            sources,
        } satisfies CountryTaxFlowExplorerResponse);
    } catch (error) {
        return json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown server error",
                from,
                to,
                totalTax: 0,
                totalFromSources: 0,
                sources: [],
            } satisfies CountryTaxFlowExplorerResponse,
            { status: 500 },
        );
    }
};
