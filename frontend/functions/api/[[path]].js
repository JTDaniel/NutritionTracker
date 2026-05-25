/**
 * Cloudflare Pages Function — API proxy
 *
 * Forwards all /api/* requests to your local backend via Cloudflare Tunnel.
 * Set the TUNNEL_URL environment variable in Pages dashboard to your tunnel URL.
 * Example: https://random-words.trycloudflare.com
 *
 * Environment variable changes take effect immediately — no redeploy needed.
 */
export async function onRequest(context) {
  const { request, env } = context;

  const tunnelUrl = (env.TUNNEL_URL || '').replace(/\/$/, '');

  if (!tunnelUrl) {
    return new Response(
      JSON.stringify({ error: 'Backend not configured. Set TUNNEL_URL in Cloudflare Pages environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const target = `${tunnelUrl}${url.pathname}${url.search}`;

  // Forward request to tunnel, stripping Cloudflare-added headers that may cause issues
  const headers = new Headers(request.headers);
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');
  headers.delete('x-forwarded-proto');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: 'follow',
    });

    // Return response with CORS headers for good measure
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Could not reach backend tunnel', detail: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
