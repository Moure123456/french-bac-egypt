/* ===== zoza-worker.js — خدمة وسيطة آمنة للوضع الذكي في «حوار مع صديقتي Zoza» =====
   تعمل على Cloudflare Workers (مجاني للاستخدام الخفيف). تحفظ مفتاح Anthropic سرًّا بعيدًا عن كود الموقع.
   الإعداد (مرة واحدة):
   1) أنشئ Worker جديدًا في Cloudflare والصق هذا الملف.
   2) في Settings ← Variables أضف:  ANTHROPIC_API_KEY (Secret) = مفتاحك
                                      ALLOWED_ORIGIN = https://اسم-المستخدم.github.io   (يمكن وضع عدة نطاقات مفصولة بفاصلة)
                                      MODEL (اختياري) = claude-haiku-5-5
   3) انسخ رابط الـ Worker وضعه في أول zoza-talk.js:  var AI_URL = 'https://....workers.dev';
      (أو من زر «⚙️ الوضع الذكي» داخل القسم لتجربته على جهازك فقط).
   تنبيه: كل رسالة طالب تستهلك رصيدك في Anthropic. أضف قاعدة Rate Limiting في Cloudflare لمنع الإسراف. */
const LEVELS = { b: 'A1 (débutant : phrases très courtes et simples)', m: 'A2-B1 (intermédiaire : phrases moyennes, vocabulaire courant)', a: 'B2 (avancé : phrases riches, nuances, opinions argumentées)' };
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = { 'Access-Control-Allow-Origin': okOrigin ? origin : 'null', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    const out = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST' || !okOrigin) return out({ error: 'forbidden' }, 403);
    if (!env.ANTHROPIC_API_KEY) return out({ error: 'missing key' }, 500);
    let body; try { body = await request.json(); } catch { return out({ error: 'bad json' }, 400); }
    const msg = String(body.message || '').slice(0, 500).trim(); if (!msg) return out({ error: 'empty' }, 400);
    // سجل المحادثة: آخر 10 رسائل، يبدأ بـ user ويتبادل الأدوار
    let msgs = []; (Array.isArray(body.history) ? body.history : []).slice(-10).forEach(h => { const role = h.role === 'assistant' ? 'assistant' : 'user', content = String(h.content || '').slice(0, 500).trim(); if (!content) return; if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n' + content; else msgs.push({ role, content }); });
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') msgs.push({ role: 'user', content: msg });
    const name = String(body.name || '').slice(0, 20), topic = String(body.topic || '').slice(0, 60);
    const system = `Tu es Zoza, une petite robot-professeure de français, joyeuse, patiente et encourageante (tu parles au féminin). Tu discutes avec ${name || 'un élève'}, un adolescent arabophone (Égypte) qui apprend le français.
Niveau de l’élève : ${LEVELS[body.level] || LEVELS.b}. ${topic ? 'Sujet en cours : ' + topic + '.' : 'Le sujet est libre : suis l’intérêt de l’élève.'}
Règles : réponds TOUJOURS en français adapté au niveau (niveau A1 : 1 à 2 phrases courtes ; B2 : jusqu’à 4 phrases), termine presque toujours par UNE seule question pour relancer le dialogue. Corrige gentiment les erreurs (orthographe, grammaire, conjugaison, accents) du DERNIER message de l’élève uniquement, sans le décourager. Contenu adapté aux adolescents : refuse poliment tout sujet inapproprié ou dangereux et propose un autre sujet. Ne demande jamais d’informations personnelles sensibles.
Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour, sans balises) de la forme :
{"reply_fr":"...","reply_ar":"traduction arabe simple de reply_fr","corrections":[{"wrong":"erreur de l'élève","right":"forme correcte","why_ar":"explication courte en arabe simple"}],"suggestions_fr":["2 ou 3 réponses courtes possibles pour l'élève (surtout au niveau A1)"],"new_words":[{"fr":"mot utile","ar":"sens en arabe"}],"tip_ar":"conseil bref en arabe (ou chaîne vide)"}`;
    let r; try {
      r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: env.MODEL || 'claude-haiku-5-5', max_tokens: 700, system, messages: msgs }) });
    } catch { return out({ error: 'upstream' }, 502); }
    if (!r.ok) return out({ error: 'upstream ' + r.status }, 502);
    const data = await r.json(); const txt = (data.content && data.content[0] && data.content[0].text) || '';
    let obj; try { const m = txt.match(/\{[\s\S]*\}/); obj = JSON.parse(m ? m[0] : txt); } catch { obj = { reply_fr: txt.slice(0, 400), reply_ar: '', corrections: [], suggestions_fr: [], new_words: [], tip_ar: '' }; }
    return out({ reply_fr: String(obj.reply_fr || ''), reply_ar: String(obj.reply_ar || ''), corrections: Array.isArray(obj.corrections) ? obj.corrections.slice(0, 5) : [], suggestions_fr: Array.isArray(obj.suggestions_fr) ? obj.suggestions_fr.slice(0, 3) : [], new_words: Array.isArray(obj.new_words) ? obj.new_words.slice(0, 4) : [], tip_ar: String(obj.tip_ar || '') });
  }
};
