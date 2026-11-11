/* ===== zoza-worker.js — النسخة التفاعلية المحدثة ===== */
const LEVELS = { b: 'A1 (débutant : phrases courtes et simples)', m: 'A2-B1 (intermédiaire : phrases moyennes)', a: 'B2 (avancé : nuances et arguments)' };
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin) || allowed.includes('*') || true; // السماح بالاتصال
    const cors = { 'Access-Control-Allow-Origin': okOrigin ? (origin || '*') : 'null', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    const out = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return out({ error: 'forbidden' }, 403);
    if (!env.ANTHROPIC_API_KEY) return out({ error: 'missing key' }, 500);
    let body; try { body = await request.json(); } catch { return out({ error: 'bad json' }, 400); }
    const msg = String(body.message || '').slice(0, 500).trim(); if (!msg) return out({ error: 'empty' }, 400);

    let msgs = []; (Array.isArray(body.history) ? body.history : []).slice(-12).forEach(h => { 
      const role = h.role === 'assistant' ? 'assistant' : 'user';
      const content = String(h.content || '').slice(0, 500).trim(); 
      if (!content) return; 
      if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n' + content; 
      else msgs.push({ role, content }); 
    });
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') msgs.push({ role: 'user', content: msg });

    const system = `Tu es Zoza, une professeure de français virtuelle, dynamique, interactive et bienveillante (tu parles au féminin). Tu dialogues avec un élève arabophone (Égypte).
Le niveau de l'élève est ${LEVELS[body.level] || LEVELS.b}.
Règles strictes pour rendre le dialogue 100% interactif :
1. Ne donne pas de réponses sèches ou de phrases uniques fermées. Engage une vraie conversation (comme dans des situations réelles : à l'école, à l'hôpital, au restaurant, au voyage, etc.).
2. Tu dois OBLIGATOIREMENT terminer ta réponse par une question ouverte ou un encouragement direct pour que l'élève continue à parler et à répondre.
3. Corrige gentiment les erreurs du dernier message si nécessaire.
Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour, sans balises markdown) sous ce format exact :
{"reply_fr":"...","reply_ar":"traduction arabe","corrections":[{"wrong":"...","right":"...","why_ar":"..."}]}`;

    let r; try {
      r = await fetch('https://api.anthropic.com/v1/messages', { 
        method: 'POST', 
        headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, 
        body: JSON.stringify({ model: env.MODEL || 'claude-haiku-5-5', max_tokens: 600, system, messages: msgs }) 
      });
    } catch { return out({ error: 'upstream' }, 502); }
    if (!r.ok) return out({ error: 'upstream ' + r.status }, 502);
    
    const data = await r.json(); 
    const txt = (data.content && data.content[0] && data.content[0].text) || '';
    let obj; try { const m = txt.match(/\{[\s\S]*\}/); obj = JSON.parse(m ? m[0] : txt); } catch { obj = { reply_fr: txt.slice(0, 400), reply_ar: '', corrections: [] }; }
    
    return out({ 
      reply_fr: String(obj.reply_fr || ''), 
      reply_ar: String(obj.reply_ar || ''), 
      corrections: Array.isArray(obj.corrections) ? obj.corrections.slice(0, 3) : [] 
    });
  }
};
