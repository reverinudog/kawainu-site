// =============================================
//  KAWAKEN OFFICIAL — Worker Entry Point
//  API routes + static assets serving
// =============================================

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // --- /api/count ルーティング ---
        if (url.pathname === '/api/count') {
            const corsHeaders = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            };

            // OPTIONS (CORS preflight)
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 204,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                });
            }

            try {
                if (request.method === 'POST') {
                    const current = await env.VISITOR_KV.get('count');
                    const currentNum = current ? parseInt(current, 10) : 0;
                    const newCount = currentNum + 1;
                    await env.VISITOR_KV.put('count', String(newCount));
                    return new Response(
                        JSON.stringify({ count: newCount }),
                        { status: 200, headers: corsHeaders }
                    );
                } else {
                    const current = await env.VISITOR_KV.get('count');
                    const count = current ? parseInt(current, 10) : 0;
                    return new Response(
                        JSON.stringify({ count }),
                        { status: 200, headers: corsHeaders }
                    );
                }
            } catch {
                return new Response(
                    JSON.stringify({ error: 'Internal Server Error' }),
                    { status: 500, headers: corsHeaders }
                );
            }
        }

        // --- その他: 静的アセットを返す ---
        return env.ASSETS.fetch(request);
    },
};
