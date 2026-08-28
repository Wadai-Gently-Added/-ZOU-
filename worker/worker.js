// 報-HOU- Cloudflare Worker v0.3.0 + v0.4.0
// KV + Cron Push予約 + Web Push

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/push" && request.method === "POST") {
      const body = await request.json();
      // {key, title, body, when}
      const auth = request.headers.get("x-hou-key");
      if (auth !== env.HOU_CONNECT_KEY) return new Response("unauthorized", {status:401});
      await env.HOU_KV.put(`sub:${body.key}`, JSON.stringify(body.subscription), {expirationTtl: 60*60*24*30});
      if (body.when) {
        await env.HOU_KV.put(`sched:${body.key}:${Date.now()}`, JSON.stringify(body), {expirationTtl: 60*60*24*7});
      }
      return new Response("ok");
    }
    if (url.pathname === "/subscribe" && request.method === "POST") {
      const body = await request.json();
      const auth = request.headers.get("x-hou-key");
      if (auth !== env.HOU_CONNECT_KEY) return new Response("unauthorized", {status:401});
      await env.HOU_KV.put(`sub:${body.key}`, JSON.stringify(body.subscription));
      return new Response("subscribed");
    }
    return new Response("報-HOU- Worker alive");
  },
  async scheduled(event, env, ctx) {
    // Cron: 1分ごとに期限切れの制限解除をチェックしてPush
    const list = await env.HOU_KV.list({prefix: "sched:"});
    for (const key of list.keys) {
      const item = await env.HOU_KV.get(key.name, {type:"json"});
      if (!item) continue;
      if (Date.now() >= new Date(item.when).getTime()) {
        const sub = await env.HOU_KV.get(`sub:${item.key}`, {type:"json"});
        if (sub) {
          // web-push送信はライブラリ必要。ここではログのみ（実装時は web-push 依存追加）
          console.log(`[HOU] push ${item.title} to ${item.key}`);
        }
        await env.HOU_KV.delete(key.name);
      }
    }
  }
}
