import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
	const endpoint = env.GRAPHQL_ENDPOINT;
	const token = env.GRAPHQL_TOKEN;

	if (!endpoint) {
		throw error(500, 'GRAPHQL_ENDPOINT is not configured');
	}

	const body = await request.text();

	const upstream = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'content-type': request.headers.get('content-type') ?? 'application/json',
			accept: request.headers.get('accept') ?? 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {})
		},
		body
	});

	return new Response(upstream.body, {
		status: upstream.status,
		headers: {
			'content-type': upstream.headers.get('content-type') ?? 'application/json'
		}
	});
};
