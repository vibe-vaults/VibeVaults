/**
 * Main Responsibility: In-browser stand-in for the `/api/widget/*` endpoints,
 * used only by the public /demo sandbox. It installs `window.__vvDemoBackend`,
 * which `public/widget.js` checks before it boots and then routes every API
 * call through. The visitor gets the real widget (pins, screenshots, threads)
 * plus a scripted agency reply, with no account and no network traffic.
 *
 * Sensitive Dependencies:
 * - Must load BEFORE widget.js: the widget reads the hook once, at init.
 * - Response shapes mirror the real routes (`/api/widget`, `/feedback`,
 *   `/reply`, `/upload`, `/upload/confirm`). A shape the widget depends on
 *   changing there must change here too, or the demo breaks silently.
 *   `tests/widget-demo.spec.ts` drives the real widget against this file.
 * - The sandbox promise on the page ("nothing you type leaves your browser")
 *   rests on this file never calling fetch/XHR. State lives in sessionStorage
 *   so a refresh keeps the pins and closing the tab discards them.
 */
(function () {
  if (window.__vvDemoBackend) return;

  var STORE_KEY = 'vv_demo_state_v1';
  var VISITOR = 'You';
  var AGENCY = 'Dani @ Pixel & Pine';
  var CLIENT = 'Maria (Crumb & Co.)';

  // The seeded pins sit on the bakery's home page. Fixed rather than read from
  // the URL, because a visitor can load (or reload) any /demo/* page first.
  var pageKey = location.origin + '/demo';
  var uid = function (p) { return p + '-' + Math.random().toString(36).slice(2, 10); };
  var ago = function (minutes) { return new Date(Date.now() - minutes * 60000).toISOString(); };
  // Set by dispose() when the /demo page unmounts. Scripted replies run on
  // timers, and without this a left-behind instance would keep emitting
  // progress into (and saving over) the next visit's fresh run.
  var disposed = false;
  var emit = function (type, extra) {
    if (disposed) return;
    try { window.dispatchEvent(new CustomEvent('vv:demo', { detail: Object.assign({ type: type }, extra || {}) })); } catch { /* analytics only */ }
  };

  // Anchors use the exact shape widget.js writes (see resolveAnchor there):
  // an element selector plus a per-axis offset, `pct` being a 0..1 fraction.
  var idAnchor = function (id, px, py) {
    return {
      selector: '#' + id,
      selectorKind: 'id',
      offset: { x: { ref: 'pct', d: px }, y: { ref: 'pct', d: py } },
      fallback: { docX: 200, docY: 400, viewportW: 1280, docW: 1280 },
    };
  };

  var seed = function () {
    return {
      feedback: [
        {
          id: 'seed-hours', content: 'Sunday hours are wrong, we open at 9 now, not 8.', sender: CLIENT,
          status: 'in progress', created_at: ago(95), anchor: idAnchor('demo-hours', 0.3, 0.86), page_key: pageKey,
          attachments: [], script: 3,
        },
        {
          id: 'seed-cta', content: 'Could this button be our green instead of brown? Feels a bit heavy.', sender: CLIENT,
          status: 'open', created_at: ago(40), anchor: idAnchor('demo-order-btn', 0.85, 0.2), page_key: pageKey,
          attachments: [], script: 3,
        },
      ],
      replies: {
        'seed-hours': [
          { id: 'seed-hours-r1', content: 'Good catch, updating it now.', author_name: AGENCY, created_at: ago(80), metadata: null, attachments: [] },
        ],
        'seed-cta': [],
      },
    };
  };

  var state;
  try { state = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null'); } catch { state = null; }
  if (!state || !Array.isArray(state.feedback)) state = seed();

  var save = function () {
    if (disposed) return;
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch {
      // Quota: screenshots are the heavy part. Keep the threads, drop the
      // images, rather than losing the whole session on the next refresh.
      try {
        var slim = JSON.parse(JSON.stringify(state));
        slim.feedback.forEach(function (f) { f.attachments = []; });
        Object.keys(slim.replies).forEach(function (k) { slim.replies[k].forEach(function (r) { r.attachments = []; }); });
        sessionStorage.setItem(STORE_KEY, JSON.stringify(slim));
      } catch { /* memory only, then */ }
    }
  };

  var find = function (id) { return state.feedback.find(function (f) { return f.id === id; }); };
  var repliesOf = function (id) { return state.replies[id] || (state.replies[id] = []); };

  // --- The scripted agency side ---------------------------------------------
  // A new report walks open -> in progress (with a reply) -> in review (with a
  // "fixed" reply), which is the whole loop a prospect needs to see. `script`
  // on the row is the next step, so a refresh mid-script resumes it.
  var SCRIPT = [
    { delay: 2500, status: 'in progress', text: 'Thanks! Got it, I can see exactly what you mean from the pin. On it now.' },
    { delay: 6000, status: 'in review', text: 'Fixed on staging. Can you take a look and let me know if it works for you?' },
  ];
  // How long until the agency's next move, so the page can animate its
  // progress bar over the real interval instead of a copy of these numbers.
  var nextDelay = function (f) { var next = SCRIPT[f.script || 0]; return next ? next.delay : 0; };
  var runScript = function (f) {
    var step = SCRIPT[f.script || 0];
    if (!step) return;
    setTimeout(function () {
      if (disposed) return;
      var live = find(f.id);
      if (!live) return;
      live.status = step.status;
      repliesOf(live.id).push({
        id: uid('r'), content: step.text, author_name: AGENCY, created_at: new Date().toISOString(),
        metadata: null, attachments: [],
      });
      live.script = (live.script || 0) + 1;
      save();
      emit(live.script >= SCRIPT.length ? 'loop_complete' : 'agency_replied', { feedbackId: live.id, nextInMs: nextDelay(live) });
      runScript(live);
    }, step.delay);
  };
  state.feedback.forEach(function (f) { if ((f.script || 0) < SCRIPT.length) runScript(f); });

  // Tell the page how far the visitor already got, so its guide survives a
  // refresh without keeping a second copy of the progress. Stage: 0 nothing
  // pinned, 1 pinned, 2 agency replied, 3 marked fixed.
  var furthest = state.feedback.reduce(function (best, f) {
    return f.sender === VISITOR && (!best || (f.script || 0) > (best.script || 0)) ? f : best;
  }, null);
  if (furthest) setTimeout(function () {
    emit('progress', { stage: Math.min(1 + (furthest.script || 0), 3), nextInMs: nextDelay(furthest) });
  }, 0);

  // --- Uploads ---------------------------------------------------------------
  // The widget PUTs each file to the presigned URL we hand out; here that URL
  // is a sentinel, and the bytes are kept as a data URL so they survive a
  // refresh. They are SERVED as blob: URLs though: the widget opens an
  // attachment in a new tab, and browsers refuse top-level navigation to
  // data: URLs, so a data URL there shows a blank page.
  var uploaded = {};
  var blobUrls = {};
  var dataUrlToBlob = function (dataUrl) {
    var comma = dataUrl.indexOf(',');
    var mime = (dataUrl.slice(5, comma).split(';')[0]) || 'application/octet-stream';
    var bin = atob(dataUrl.slice(comma + 1));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };
  var served = function (att) {
    var data = att.data || '';
    if (data && !blobUrls[att.id]) {
      try { blobUrls[att.id] = URL.createObjectURL(dataUrlToBlob(data)); } catch { blobUrls[att.id] = ''; }
    }
    return { id: att.id, file_name: att.file_name, file_url: blobUrls[att.id] || '', file_size: att.file_size, mime_type: att.mime_type };
  };
  var servedAll = function (list) { return (list || []).map(served); };
  var readAsDataUrl = function (blob) {
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result)); };
      r.onerror = function () { resolve(''); };
      r.readAsDataURL(blob);
    });
  };

  // --- Routing ---------------------------------------------------------------
  var json = function (body, status) {
    return new Response(JSON.stringify(body), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
  };
  var parse = function (opts) { try { return JSON.parse(opts.body || '{}'); } catch { return {}; } };

  var listView = function () {
    return state.feedback
      .filter(function (f) { return f.status !== 'completed'; })
      .slice()
      .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; })
      .map(function (f) {
        var replies = repliesOf(f.id);
        return {
          id: f.id, content: f.content, sender: f.sender, status: f.status, created_at: f.created_at,
          reply_count: replies.length, attachments: servedAll(f.attachments), anchor: f.anchor || null,
          page_key: f.page_key || null,
          pins: replies.filter(function (r) { return r.metadata && r.metadata.anchor; }).map(function (r) {
            return { reply_id: r.id, anchor: r.metadata.anchor, page_key: r.metadata.page_key || null, created_at: r.created_at };
          }),
        };
      });
  };

  var handle = async function (rawUrl, opts) {
    var method = String(opts.method || 'GET').toUpperCase();

    if (rawUrl.indexOf('vv-demo-upload:') === 0) {
      uploaded[rawUrl] = opts.body instanceof Blob ? await readAsDataUrl(opts.body) : '';
      return new Response('', { status: 200 });
    }

    var url = new URL(rawUrl, location.href);
    var path = url.pathname.replace(/\/+$/, '');
    var body = parse(opts);

    if (path === '/api/widget' && method === 'GET') {
      return json({ identity: { email: VISITOR }, notifyReplies: false, showBranding: true, reviewPaused: false });
    }
    if (path === '/api/widget' && method === 'POST') {
      var meta = body.metadata || {};
      var f = {
        id: uid('fb'), content: String(body.content || '').slice(0, 5000), sender: VISITOR, status: 'open',
        created_at: new Date().toISOString(), anchor: meta.anchor || null, page_key: meta.page_key || null,
        attachments: [], script: 0,
      };
      state.feedback.push(f);
      state.replies[f.id] = [];
      save();
      emit('feedback_submitted', { feedbackId: f.id, nextInMs: nextDelay(f) });
      runScript(f);
      return json({ success: true, feedback_id: f.id });
    }
    if (path === '/api/widget/feedback') return json({ feedback: listView() });
    if (path === '/api/widget/reply' && method === 'GET') {
      return json({
        replies: repliesOf(url.searchParams.get('feedbackId')).map(function (r) {
          return Object.assign({}, r, { attachments: servedAll(r.attachments) });
        }),
      });
    }
    if (path === '/api/widget/reply' && method === 'POST') {
      if (!find(body.feedbackId)) return json({ error: 'Feedback not found' }, 404);
      var reply = {
        id: uid('r'), content: String(body.content || '').slice(0, 5000), author_name: VISITOR,
        created_at: new Date().toISOString(), metadata: body.metadata || null, attachments: [],
      };
      repliesOf(body.feedbackId).push(reply);
      save();
      emit('reply_sent', { feedbackId: body.feedbackId });
      return json({ success: true, replyId: reply.id });
    }
    if (path === '/api/widget/upload') {
      return json({
        projectId: 'demo',
        uploads: (body.files || []).map(function (file) {
          var fileId = uid('file');
          return { fileId: fileId, path: fileId, fileName: file.name, mimeType: file.type, signedUrl: 'vv-demo-upload:' + fileId };
        }),
      });
    }
    if (path === '/api/widget/upload/confirm') {
      var records = (body.files || []).map(function (file) {
        return {
          id: file.fileId, file_name: file.fileName, data: uploaded['vv-demo-upload:' + file.fileId] || '',
          file_size: file.size, mime_type: file.mimeType,
        };
      });
      var target = body.replyId
        ? repliesOf(body.feedbackId).find(function (r) { return r.id === body.replyId; })
        : find(body.feedbackId);
      if (target) target.attachments = (target.attachments || []).concat(records);
      save();
      return json({ attachments: servedAll(records) });
    }
    // Telemetry (errors, capture-info) and anything else: accepted, dropped.
    return json({});
  };

  window.__vvDemoBackend = {
    token: 'demo-sandbox',
    handle: handle,
    dispose: function () { disposed = true; },
    // Set by DemoGuide to the Next router. widget.js calls it to reach a pin
    // on another demo page without the full load that would drop the run.
    navigate: null,
  };
})();
