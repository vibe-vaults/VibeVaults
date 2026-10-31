/**
 * Main Responsibility: In-browser stand-in for the `/api/widget/*` endpoints
 * AND for the agency's dashboard data, used only by the public /demo sandbox.
 * It installs `window.__vvDemoBackend`, which `public/widget.js` checks before
 * it boots and then routes every API call through, and which the agency pane
 * on /demo reads and writes through `agency.*`. The visitor plays both sides
 * (the client pinning in the widget, the agency answering in the dashboard
 * look-alike) against one shared state, with no account and no network
 * traffic.
 *
 * Sensitive Dependencies:
 * - Must load BEFORE widget.js: the widget reads the hook once, at init. On
 *   /demo the backend lives in the TOP window and the bakery iframe borrows
 *   it (`window.__vvDemoBackend = parent.__vvDemoBackend`) before loading
 *   widget.js, so a reload of the iframe never loses the run and both panes
 *   see one state. That makes every call below potentially cross-realm: never
 *   use `instanceof` on what the widget passes in (an iframe's Blob is not
 *   this window's Blob).
 * - Response shapes mirror the real routes (`/api/widget`, `/feedback`,
 *   `/reply`, `/upload`, `/upload/confirm`). A shape the widget depends on
 *   changing there must change here too, or the demo breaks silently.
 *   `agency.replies()` / `agency.get()` mirror what `FeedbackDetail` reads
 *   from Supabase. `tests/widget-demo.spec.ts` drives both.
 * - The sandbox promise on the page ("nothing you type leaves your browser")
 *   rests on this file never calling fetch/XHR. State lives in sessionStorage
 *   so a refresh keeps the pins and closing the tab discards them.
 * - `STORE_KEY` is also cleared by `src/components/demo/demo-split.tsx` to
 *   start a fresh run; keep the two in step.
 */
(function () {
  if (window.__vvDemoBackend) return;

  var STORE_KEY = 'vv_demo_state_v2';
  var CLIENT = 'Maria (Crumb & Co.)';
  var AGENCY = 'Dani @ Pixel & Pine';

  // The seeded pins sit on the bakery's home page. Fixed rather than read from
  // the URL, because a visitor can load (or reload) any bakery page first.
  var pageKey = location.origin + '/demo/site';
  var uid = function (p) { return p + '-' + Math.random().toString(36).slice(2, 10); };
  var ago = function (minutes) { return new Date(Date.now() - minutes * 60000).toISOString(); };
  // Set by dispose() when /demo unmounts, so a left-behind instance cannot
  // emit into (or save over) the next visit's fresh run.
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
  // What getMetadata() would have captured on Maria's laptop, so the seeded
  // reports fill the same tiles in the agency pane as a fresh one does.
  var seedMeta = function (anchor) {
    return {
      url: pageKey, userAgent: navigator.userAgent, screen: '1920x1080', viewport: '1440x812', language: 'en-US',
      anchor: anchor, page_key: pageKey,
      logs: [{ type: 'warn', time: '09:41:07', content: 'Image "hero-croissant.jpg" is larger than it needs to be (2.4 MB).' }],
    };
  };

  var seed = function () {
    return {
      feedback: [
        {
          id: 'seed-hours', content: 'Sunday hours are wrong, we open at 9 now, not 8.', sender: CLIENT,
          status: 'in progress', created_at: ago(95), metadata: seedMeta(idAnchor('demo-hours', 0.3, 0.86)), attachments: [],
        },
        {
          id: 'seed-cta', content: 'Could this button be our green instead of brown? Feels a bit heavy.', sender: CLIENT,
          status: 'open', created_at: ago(40), metadata: seedMeta(idAnchor('demo-order-btn', 0.85, 0.2)), attachments: [],
        },
      ],
      replies: {
        'seed-hours': [
          { id: 'seed-hours-r1', content: 'Good catch, updating it now.', author_name: AGENCY, created_at: ago(80), metadata: null, attachments: [] },
        ],
        'seed-cta': [],
      },
      // The guided run: the visitor's first pin, and how far it got around
      // the loop. Both guide cards derive their step from this alone.
      tour: { feedbackId: null, opened: false, replied: false, seen: false },
    };
  };

  var state;
  try { state = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null'); } catch { state = null; }
  if (!state || !Array.isArray(state.feedback) || !state.tour) state = seed();

  var listeners = [];
  var changed = function () {
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
    listeners.slice().forEach(function (fn) { try { fn(); } catch { /* one pane must not break the other */ } });
  };

  var find = function (id) { return state.feedback.find(function (f) { return f.id === id; }); };
  var repliesOf = function (id) { return state.replies[id] || (state.replies[id] = []); };

  // 0 nothing pinned, 1 pinned (agency's turn to open it), 2 opened (agency's
  // turn to reply), 3 replied (client's turn to read it), 4 the whole loop.
  var stage = function () {
    var t = state.tour;
    if (!t.feedbackId) return 0;
    if (!t.opened) return 1;
    if (!t.replied) return 2;
    if (!t.seen) return 3;
    return 4;
  };
  var advance = function (key, eventType) {
    if (state.tour[key]) return;
    state.tour[key] = true;
    emit(eventType, { feedbackId: state.tour.feedbackId, stage: stage() });
  };

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
    return {
      id: att.id, file_name: att.file_name, file_url: blobUrls[att.id] || '', file_size: att.file_size,
      mime_type: att.mime_type, uploaded_by: att.uploaded_by || null,
    };
  };
  var servedAll = function (list) { return (list || []).map(served); };
  // Duck-typed on purpose: the widget's Blob comes from the iframe's realm.
  var isBlob = function (v) { return !!v && typeof v === 'object' && typeof v.size === 'number' && typeof v.slice === 'function'; };
  var readAsDataUrl = function (blob) {
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result)); };
      r.onerror = function () { resolve(''); };
      r.readAsDataURL(blob);
    });
  };

  // --- Widget routing ----------------------------------------------------------
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
        var meta = f.metadata || {};
        return {
          id: f.id, content: f.content, sender: f.sender, status: f.status, created_at: f.created_at,
          reply_count: replies.length, attachments: servedAll(f.attachments), anchor: meta.anchor || null,
          page_key: meta.page_key || null,
          pins: replies.filter(function (r) { return r.metadata && r.metadata.anchor; }).map(function (r) {
            return { reply_id: r.id, anchor: r.metadata.anchor, page_key: r.metadata.page_key || null, created_at: r.created_at };
          }),
        };
      });
  };

  var handle = async function (rawUrl, opts) {
    var method = String(opts.method || 'GET').toUpperCase();

    if (rawUrl.indexOf('vv-demo-upload:') === 0) {
      uploaded[rawUrl] = isBlob(opts.body) ? await readAsDataUrl(opts.body) : '';
      return new Response('', { status: 200 });
    }

    var url = new URL(rawUrl, location.href);
    var path = url.pathname.replace(/\/+$/, '');
    var body = parse(opts);

    if (path === '/api/widget' && method === 'GET') {
      return json({ identity: { email: CLIENT }, notifyReplies: false, showBranding: true, reviewPaused: false });
    }
    if (path === '/api/widget' && method === 'POST') {
      var f = {
        id: uid('fb'), content: String(body.content || '').slice(0, 5000), sender: CLIENT, status: 'open',
        created_at: new Date().toISOString(), metadata: body.metadata || {}, attachments: [],
      };
      state.feedback.push(f);
      state.replies[f.id] = [];
      if (!state.tour.feedbackId) state.tour.feedbackId = f.id;
      emit('feedback_submitted', { feedbackId: f.id, stage: stage() });
      changed();
      return json({ success: true, feedback_id: f.id });
    }
    if (path === '/api/widget/feedback') return json({ feedback: listView() });
    if (path === '/api/widget/reply' && method === 'GET') {
      var threadId = url.searchParams.get('feedbackId');
      // The widget fetches a thread's replies when it is opened (and polls it
      // while it stays open), so this is the moment the client reads the
      // agency's answer.
      if (threadId && threadId === state.tour.feedbackId && state.tour.replied && !state.tour.seen) {
        advance('seen', 'loop_complete');
        changed();
      }
      return json({
        replies: repliesOf(threadId).map(function (r) {
          return Object.assign({}, r, { attachments: servedAll(r.attachments) });
        }),
      });
    }
    if (path === '/api/widget/reply' && method === 'POST') {
      if (!find(body.feedbackId)) return json({ error: 'Feedback not found' }, 404);
      var reply = {
        id: uid('r'), content: String(body.content || '').slice(0, 5000), author_name: CLIENT,
        created_at: new Date().toISOString(), metadata: body.metadata || null, attachments: [],
      };
      repliesOf(body.feedbackId).push(reply);
      emit('reply_sent', { feedbackId: body.feedbackId });
      changed();
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
          file_size: file.size, mime_type: file.mimeType, uploaded_by: CLIENT,
        };
      });
      var target = body.replyId
        ? repliesOf(body.feedbackId).find(function (r) { return r.id === body.replyId; })
        : find(body.feedbackId);
      if (target) target.attachments = (target.attachments || []).concat(records);
      changed();
      return json({ attachments: servedAll(records) });
    }
    // Telemetry (errors, capture-info) and anything else: accepted, dropped.
    return json({});
  };

  // --- Agency side ---------------------------------------------------------------
  // What the dashboard look-alike reads and writes. Same rows the widget sees,
  // in the shapes the real dashboard gets from Supabase.
  var agency = {
    name: AGENCY,
    list: function () {
      return state.feedback.slice()
        .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; })
        .map(function (f) {
          var attachmentCount = (f.attachments || []).length;
          repliesOf(f.id).forEach(function (r) { attachmentCount += (r.attachments || []).length; });
          return {
            id: f.id, content: f.content, sender: f.sender, status: f.status, created_at: f.created_at,
            reply_count: repliesOf(f.id).length, attachment_count: attachmentCount,
          };
        });
    },
    get: function (id) {
      var f = find(id);
      return f ? { id: f.id, content: f.content, sender: f.sender, status: f.status, created_at: f.created_at, metadata: f.metadata || null } : null;
    },
    replies: function (id) {
      return repliesOf(id).map(function (r) {
        return {
          id: r.id, content: r.content, author_role: r.author_name === AGENCY ? 'agency' : 'client',
          author_name: r.author_name, created_at: r.created_at, metadata: r.metadata || null,
          attachments: servedAll(r.attachments),
        };
      });
    },
    attachments: function (id) { var f = find(id); return f ? servedAll(f.attachments) : []; },
    open: function (id) {
      if (id !== state.tour.feedbackId) return;
      if (!state.tour.opened) { advance('opened', 'agency_opened'); changed(); }
    },
    reply: async function (id, content, files) {
      if (!find(id)) return { error: 'Feedback not found' };
      var records = [];
      for (var i = 0; i < (files || []).length; i++) {
        var file = files[i];
        records.push({
          id: uid('file'), file_name: file.name, data: await readAsDataUrl(file), file_size: file.size,
          mime_type: file.type || 'application/octet-stream', uploaded_by: AGENCY,
        });
      }
      repliesOf(id).push({
        id: uid('r'), content: String(content || '').slice(0, 5000), author_name: AGENCY,
        created_at: new Date().toISOString(), metadata: null, attachments: records,
      });
      if (id === state.tour.feedbackId) { state.tour.opened = true; advance('replied', 'agency_replied'); }
      changed();
      return {};
    },
    setStatus: function (id, status) {
      var f = find(id);
      if (!f) return { error: 'Feedback not found' };
      f.status = status;
      emit('status_changed', { feedbackId: id, status: status });
      changed();
      return {};
    },
    remove: function (id) {
      state.feedback = state.feedback.filter(function (f) { return f.id !== id; });
      delete state.replies[id];
      // Deleting the report the run is about starts the run over.
      if (id === state.tour.feedbackId) state.tour = { feedbackId: null, opened: false, replied: false, seen: false };
      changed();
      return {};
    },
  };

  window.__vvDemoBackend = {
    token: 'demo-sandbox',
    handle: handle,
    agency: agency,
    stage: stage,
    tourFeedbackId: function () { return state.tour.feedbackId; },
    // Any change from either pane. Returns the unsubscribe function, which is
    // the shape React's useSyncExternalStore expects.
    subscribe: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (l) { return l !== fn; }); };
    },
    dispose: function () { disposed = true; listeners = []; },
    // Set by the bakery iframe to its Next router. widget.js calls it to
    // reach a pin on another bakery page without the full load of the frame.
    navigate: null,
  };
})();
