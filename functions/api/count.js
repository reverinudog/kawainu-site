// =============================================
//  KAWAKEN OFFICIAL — Visitor Counter API
//  Cloudflare Pages Functions + KV
// =============================================

// GET /api/count — 現在値を返す（カウントアップしない）
export async function onRequestGet(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    try {
        const current = await context.env.VISITOR_KV.get('count');
        const count = current ? parseInt(current, 10) : 0;

        return new Response(
            JSON.stringify({ count }),
            { status: 200, headers: corsHeaders }
        );
    } catch {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500, headers: corsHeaders }
        );
    }
}

// POST /api/count — カウントアップして新しい値を返す
export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    try {
        const current = await context.env.VISITOR_KV.get('count');
        const currentNum = current ? parseInt(current, 10) : 0;
        const newCount = currentNum + 1;
        await context.env.VISITOR_KV.put('count', String(newCount));

        return new Response(
            JSON.stringify({ count: newCount }),
            { status: 200, headers: corsHeaders }
        );
    } catch {
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500, headers: corsHeaders }
        );
    }
}

// OPTIONS /api/count — CORS プリフライト
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
