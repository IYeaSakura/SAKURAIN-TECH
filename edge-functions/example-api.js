import {
  verifyAuthHeaders,
  createAuthErrorResponse,
  handleCorsPreflight,
  addCorsHeaders,
} from './auth.js';

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight();
    }

    const authResult = await verifyAuthHeaders(request.headers, env);

    if (!authResult.success) {
      return addCorsHeaders(createAuthErrorResponse(authResult));
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === '/api/health') {
        return handleHealthCheck();
      }

      if (path === '/api/data') {
        return handleDataRequest(request);
      }

      return addCorsHeaders(
        new Response('Not found', { status: 404 })
      );
    } catch (error) {
      console.error('API error:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Internal server error' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      );
    }
  },
};

function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: Date.now(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

async function handleDataRequest(request) {
  const data = await request.json();

  return new Response(
    JSON.stringify({
      message: 'Data received successfully',
      receivedData: data,
      timestamp: Date.now(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
