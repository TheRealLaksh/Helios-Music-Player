/* ==========================================================================
   Helios — UI chrome
   Toasts · layers (focus management) · waveform seekbar · player bar ·
   Now Playing + visualizer · queue · Tune sheet · command palette ·
   context menu · shortcuts dialog
   ========================================================================== */
(function () {
    'use strict';
    var H = window.Helios, util = H.util, lib = H.lib, player = H.player, engine = H.engine, bus = H.bus;
    var esc = util.esc, icon = util.icon, fmt = util.fmt;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var audio = engine.audio;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ui = H.ui = {};

    function setIcon(btn, id) { var u = btn.querySelector('use'); if (u) u.setAttribute('href', '#i-' + id); }

    // ================================================================= toasts
    var toastHost = $('#toasts');
    function toast(msg, o) {
        o = o || {};
        var t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = (o.icon ? icon(o.icon) : '') + '<span>' + esc(msg) + '</span>';
        toastHost.appendChild(t);
        while (toastHost.children.length > 3) toastHost.removeChild(toastHost.firstChild);
        requestAnimationFrame(function () { t.classList.add('in'); });
        setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 400); }, o.ms || 2600);
    }
    ui.toast = toast;

    // ================================================================= layers
    var layers = [];
    var scrim = $('#scrim');
    function focusables(el) { return $$('button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])', el).filter(function (n) { return n.offsetParent !== null; }); }
    function openLayer(el, opts) {
        opts = opts || {};
        if (layers.some(function (l) { return l.el === el; })) return;
        var layer = { el: el, opener: document.activeElement, scrim: !!opts.scrim, modal: opts.modal !== false, onClose: opts.onClose };
        layers.push(layer);
        el.hidden = false;
        el.removeAttribute('inert'); el.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(function () { el.classList.add('open'); });
        if (opts.scrim) { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add('on'); }); }
        if (opts.focus !== false) setTimeout(function () { var f = (opts.focusEl && $(opts.focusEl, el)) || focusables(el)[0]; if (f) f.focus({ preventScroll: true }); }, 60);
        bus.emit('layer', el.id);
    }
    function closeLayer(el) {
        var i = layers.findIndex(function (l) { return l.el === el; });
        if (i < 0) return;
        var layer = layers.splice(i, 1)[0];
        el.classList.remove('open');
        el.setAttribute('aria-hidden', 'true'); el.setAttribute('inert', '');
        if (el.dataset.hideAfter) setTimeout(function () { if (!el.classList.contains('open')) el.hidden = true; }, 320);
        if (layer.scrim && !layers.some(function (l) { return l.scrim; })) { scrim.classList.remove('on'); setTimeout(function () { if (!scrim.classList.contains('on')) scrim.hidden = true; }, 300); }
        if (layer.onClose) layer.onClose();                                   // may un-inert the opener's subtree
        if (layer.opener && layer.opener.focus && document.contains(layer.opener)) layer.opener.focus({ preventScroll: true });
        bus.emit('layer', el.id);
    }
    function isOpen(el) { return layers.some(function (l) { return l.el === el; }); }
    function closeTop() { if (!layers.length) return false; closeLayer(layers[layers.length - 1].el); return true; }
    ui.openLayer = openLayer; ui.closeLayer = closeLayer; ui.isOpen = isOpen; ui.closeTop = closeTop;
    ui.anyLayer = function () { return layers.length > 0; };

    scrim.addEventListener('click', function () { closeTop(); });
    document.addEventListener('keydown', function (e) {                       // light focus trap for modal layers
        if (e.key !== 'Tab' || !layers.length) return;
        var topLayer = layers[layers.length - 1];
        if (!topLayer.modal) return;                                         // e.g. the docked desktop queue
        var top = topLayer.el, f = focusables(top);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (!top.contains(document.activeElement)) { first.focus(); e.preventDefault(); }
        else if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    });
    document.addEventListener('click', function (e) {
        var c = e.target.closest('[data-close]');
        if (c) { var m = { tune: '#tune', queue: '#queue-panel', shortcuts: '#shortcuts' }[c.dataset.close]; if (m) closeLayer($(m)); }
    });

    // ============================================================== waveform
    function Waveform(root, o) {
        o = o || {};
        var cv = $('canvas', root), g = cv.getContext('2d'), tip = $('.wave-tip', root);
        var self = this;
        self.root = root; self.peaks = null; self.p = 0; self.dur = 0; self.hover = -1; self.dragging = false;
        self.barW = o.barW || 3; self.gap = o.gap || 2; self.dirty = true; self.colorKey = ''; self.k = -1;
        var w = 0, h = 0, dpr = 1, n = 0;

        function size() {
            var r = root.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
            w = r.width; h = r.height; if (!w || !h) return;
            cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
            n = Math.max(8, Math.floor((w + self.gap) / (self.barW + self.gap)));
            self.dirty = true;
        }
        if (window.ResizeObserver) new ResizeObserver(size).observe(root); else window.addEventListener('resize', size);
        size();

        self.setPeaks = function (pk) { self.peaks = pk; self.dirty = true; };
        self.setProgress = function (p, dur) {
            self.dur = dur;
            if (self.dragging) return;
            var k = Math.floor(p * n * 2);
            if (k !== self.k) { self.k = k; self.p = p; self.dirty = true; }
        };

        function pFromEvent(e) { var r = root.getBoundingClientRect(); return util.clamp((e.clientX - r.left) / r.width, 0, 1); }
        function showTip(p) {
            if (!tip) return;
            tip.hidden = false; tip.textContent = fmt(p * (self.dur || 0));
            var tw = tip.offsetWidth || 40;
            tip.style.left = util.clamp(p * w, tw / 2, w - tw / 2) + 'px';
        }
        root.addEventListener('pointermove', function (e) {
            var p = pFromEvent(e);
            if (self.dragging) { self.p = p; self.k = -1; if (o.onPreview) o.onPreview(p); }
            self.hover = p; showTip(p); self.dirty = true;
        });
        root.addEventListener('pointerleave', function () { if (!self.dragging) { self.hover = -1; if (tip) tip.hidden = true; self.dirty = true; } });
        root.addEventListener('pointerdown', function (e) {
            if (e.button !== 0) return;
            self.dragging = true; root.setPointerCapture(e.pointerId); root.classList.add('is-dragging');
            self.p = pFromEvent(e); self.dirty = true; showTip(self.p);
            if (o.onPreview) o.onPreview(self.p);
        });
        function end(e) {
            if (!self.dragging) return;
            self.dragging = false; root.classList.remove('is-dragging');
            var p = e.type === 'pointercancel' ? self.p : pFromEvent(e);
            self.p = p; self.dirty = true;
            if (o.onSeek) o.onSeek(p);
            if (e.pointerType !== 'mouse') { self.hover = -1; if (tip) tip.hidden = true; }
        }
        root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
        root.addEventListener('keydown', function (e) {
            var d = self.dur || audio.duration || 0, cur = audio.currentTime || 0, t = null;
            if (e.key === 'ArrowRight') t = cur + (e.shiftKey ? 15 : 5);
            else if (e.key === 'ArrowLeft') t = cur - (e.shiftKey ? 15 : 5);
            else if (e.key === 'Home') t = 0;
            else if (e.key === 'End') t = d - 0.5;
            if (t === null) return;
            e.preventDefault(); e.stopPropagation(); engine.seek(t);
        });

        self.draw = function () {
            var col = H.ambience.colors, key = col[0].map(Math.round).join() + col[1].map(Math.round).join();
            if (key !== self.colorKey) { self.colorKey = key; self.dirty = true; }
            if (!self.dirty || !w || !h) return;
            self.dirty = false;
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, w, h);
            var pk = self.peaks, bw = self.barW, gap = self.gap, mid = h / 2;
            var grad = g.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, 'rgb(' + col[0].map(Math.round).join(',') + ')');
            grad.addColorStop(1, 'rgb(' + col[1].map(Math.round).join(',') + ')');
            var span = pk ? pk.length / n : 1;
            for (var i = 0; i < n; i++) {
                var v = 0.3;
                if (pk) { var a = Math.floor(i * span), b = Math.max(a + 1, Math.floor((i + 1) * span)); v = 0; for (var k = a; k < b; k++) if (pk[k] > v) v = pk[k]; }
                var bh = Math.max(3, v * (h - 2)), x = i * (bw + gap), y = mid - bh / 2, frac = (i + 0.5) / n;
                var played = frac <= self.p, hov = self.hover >= 0 && !played && frac <= self.hover;
                g.fillStyle = played ? grad : (hov ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.2)');
                if (g.roundRect) { g.beginPath(); g.roundRect(x, y, bw, bh, bw / 2); g.fill(); } else g.fillRect(x, y, bw, bh);
            }
            if (self.hover >= 0 || self.dragging) {
                var hx = (self.dragging ? self.p : self.hover) * w;
                g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(Math.round(hx) - 0.5, 0, 1.5, h);
            }
        };
        self.markDirty = function () { self.dirty = true; };
        self.size = size;
    }

    var waveBar, waveNp;
    function setPeaksBoth(pk) { waveBar.setPeaks(pk); waveNp.setPeaks(pk); }

    // ============================================================== elements
    var el = {
        barCover: $('#bar-cover'), barTitle: $('#bar-title'), barArtist: $('#bar-artist'), barLike: $('#bar-like'),
        play: $('#btn-play'), miniPlay: $('#mini-play'), npPlay: $('#np-play'),
        shuffle: [$('#btn-shuffle'), $('#np-shuffle')], repeat: [$('#btn-repeat'), $('#np-repeat')],
        barCur: $('#bar-cur'), barDur: $('#bar-dur'), npCur: $('#np-cur'), npDur: $('#np-dur'), miniFill: $('#mini-fill'),
        vol: $('#vol'), mute: $('#btn-mute'),
        np: $('#np'), npStage: $('#np-stage'), npArt: $('#np-art'), npCover: $('#np-cover'), npTitle: $('#np-title'), npArtist: $('#np-artist'), npFrom: $('#np-from'), npLike: $('#np-like'),
        npViz: $('#np-viz'), npVizMode: $('#np-viz-mode'),
        queuePanel: $('#queue-panel'), queueBody: $('#queue-body'), npQueue: $('#np-queue'), queueBadge: $('#queue-badge'), btnQueue: $('#btn-queue'),
        tune: $('#tune'), palette: $('#palette'), shortcuts: $('#shortcuts'), ctx: $('#ctx')
    };

    // ================================================================ player bar
    function measureMarquee() {
        var m = el.barTitle.parentNode;
        el.barTitle.style.removeProperty('--shift'); m.classList.remove('scroll');
        requestAnimationFrame(function () {
            var over = el.barTitle.scrollWidth - m.clientWidth;
            if (over > 6 && !reduced) { el.barTitle.style.setProperty('--shift', -(over + 16) + 'px'); el.barTitle.style.setProperty('--dur', Math.max(6, over / 18 + 4) + 's'); m.classList.add('scroll'); }
        });
    }

    function onTrack(song) {
        el.barTitle.textContent = song.displayName; el.barArtist.textContent = song.artist;
        el.barCover.src = lib.thumb(song); el.barCover.alt = song.displayName + ' cover';
        el.npTitle.textContent = song.displayName; el.npArtist.textContent = song.artist;
        el.npCover.src = lib.cover(song); el.npCover.alt = 'Cover art for ' + song.displayName;
        el.npFrom.textContent = player.state.ctx.name;
        measureMarquee();
        syncLike();
        el.barCur.textContent = el.npCur.textContent = '0:00';
        el.barDur.textContent = el.npDur.textContent = '0:00';
        el.miniFill.style.transform = 'scaleX(0)';
        waveBar.setProgress(0, 0); waveNp.setProgress(0, 0);
        engine.loadWaveform(song, setPeaksBoth);
        highlightCurrent();
        document.title = song.displayName + ' · ' + song.artist + ' — Helios';
        el.npArt.classList.remove('swap'); void el.npArt.offsetWidth; el.npArt.classList.add('swap');
        renderQueues();
    }

    function syncLike() {
        var s = player.state.current; if (!s) return;
        var liked = player.isLiked(s.name);
        [el.barLike, el.npLike].forEach(function (b) {
            b.classList.toggle('is-liked', liked);
            b.setAttribute('aria-pressed', liked); b.setAttribute('aria-label', liked ? 'Remove from Liked Songs' : 'Add to Liked Songs');
        });
    }

    function syncPlay() {
        var p = engine.playing;
        document.body.classList.toggle('is-playing', p);
        [el.play, el.miniPlay, el.npPlay].forEach(function (b) { setIcon(b, p ? 'pause' : 'play'); b.setAttribute('aria-label', p ? 'Pause' : 'Play'); });
        highlightCurrent();
        H.ambience.setPlaying(p);
    }

    function highlightCurrent() {
        var cur = player.state.current && player.state.current.name, p = engine.playing;
        $$('[data-song]').forEach(function (n) {
            if (!n.classList.contains('row') && !n.classList.contains('card') && !n.classList.contains('qitem') && !n.classList.contains('top-result')) return;
            var is = n.dataset.song === cur;
            n.classList.toggle('is-current', is); n.classList.toggle('is-playing', is && p);
        });
        $$('[data-ctx-play]').forEach(function (n) {
            var is = n.dataset.ctxPlay === player.state.ctx.id && player.state.current;
            n.classList.toggle('is-current', !!is); n.classList.toggle('is-playing', !!is && p);
        });
    }

    function syncModes() {
        var s = player.state;
        el.shuffle.forEach(function (b) { b.classList.toggle('is-on', s.shuffle); b.setAttribute('aria-pressed', s.shuffle); b.setAttribute('aria-label', 'Shuffle: ' + (s.shuffle ? 'on' : 'off')); });
        var lab = ['off', 'all', 'one'][s.repeat];
        el.repeat.forEach(function (b) { b.classList.toggle('is-on', s.repeat > 0); b.setAttribute('aria-pressed', s.repeat > 0); b.setAttribute('aria-label', 'Repeat: ' + lab); setIcon(b, s.repeat === 2 ? 'repeat-1' : 'repeat'); });
    }

    function syncVolume() {
        var v = audio.muted ? 0 : audio.volume;
        el.vol.value = v; el.vol.style.setProperty('--v', (v * 100) + '%');
        setIcon(el.mute, v === 0 ? 'vol-x' : v < 0.5 ? 'vol-1' : 'vol-2');
        el.mute.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute');
    }

    function syncQueueBadge() {
        var n = player.state.userQueue.length;
        el.queueBadge.hidden = !n; el.queueBadge.textContent = n;
    }

    // time + progress, called every animation frame by app.js
    var lastSec = -1, lastDur = -1;
    ui.frame = function (lv, dt) {
        var dur = audio.duration, cur = audio.currentTime || 0, ok = isFinite(dur) && dur > 0, p = ok ? cur / dur : 0;
        var sec = Math.floor(cur);
        if (sec !== lastSec || dur !== lastDur) {
            lastSec = sec; lastDur = dur;
            var c = fmt(cur), d = ok ? fmt(dur) : '0:00';
            el.barCur.textContent = el.npCur.textContent = c;
            el.barDur.textContent = el.npDur.textContent = d;
            var txt = c + ' of ' + d, pct = Math.round(p * 100);
            [waveBar.root, waveNp.root].forEach(function (r) { r.setAttribute('aria-valuenow', pct); r.setAttribute('aria-valuetext', txt); });
        }
        el.miniFill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        waveBar.setProgress(p, ok ? dur : 0); waveNp.setProgress(p, ok ? dur : 0);
        waveBar.draw();
        if (isOpen(el.np)) { waveNp.draw(); drawViz(lv, dt); }
    };

    // =================================================================== NP
    var VIZ = ['bars', 'ring', 'wave'], vizMode = H.store.get('viz', 'bars');
    var vctx = el.npViz.getContext('2d'), vw = 0, vh = 0, vdpr = 1, geo = { cx: 0, cy: 0, r: 0, bx: 0, bw: 0, by: 0 };
    var vbars = new Float32Array(96), vpeak = new Float32Array(96), vphase = 0;

    function sizeViz() {
        var r = el.npStage.getBoundingClientRect(); if (!r.width) return;
        vdpr = Math.min(2, window.devicePixelRatio || 1);
        vw = r.width; vh = r.height;
        el.npViz.width = Math.round(vw * vdpr); el.npViz.height = Math.round(vh * vdpr);
        var a = el.npArt.getBoundingClientRect();
        // geometry of the art relative to the stage (art may be scaled in ring mode, so use layout box)
        var side = el.npArt.offsetWidth, ox = el.npArt.offsetLeft, oy = el.npArt.offsetTop;
        geo.cx = ox + side / 2; geo.cy = oy + el.npArt.offsetHeight / 2; geo.r = side / 2; geo.side = side;
        geo.bx = vw * 0.04; geo.bw = vw * 0.92; geo.by = oy + el.npArt.offsetHeight + (vh - oy - el.npArt.offsetHeight) * 0.55;
        geo.bh = Math.max(40, (vh - oy - el.npArt.offsetHeight) * 0.42);
    }
    if (window.ResizeObserver) new ResizeObserver(sizeViz).observe(el.npStage);
    window.addEventListener('resize', sizeViz);

    function setViz(m) {
        vizMode = m; H.store.set('viz', m);
        el.npStage.setAttribute('data-viz', m);
        $('span', el.npVizMode).textContent = { bars: 'Bars', ring: 'Ring', wave: 'Wave' }[m];
        requestAnimationFrame(sizeViz);
    }
    ui.cycleViz = function () { setViz(VIZ[(VIZ.indexOf(vizMode) + 1) % VIZ.length]); };
    el.npVizMode.addEventListener('click', ui.cycleViz);

    function drawViz(lv, dt) {
        if (!vw) { sizeViz(); if (!vw) return; }
        var g = vctx, col = H.ambience.colors, a = col[0], b = col[1], i, bins = lv.bins;
        g.setTransform(vdpr, 0, 0, vdpr, 0, 0); g.clearRect(0, 0, vw, vh);
        var ca = 'rgb(' + a.map(Math.round).join(',') + ')', cb = 'rgb(' + b.map(Math.round).join(',') + ')';
        vphase += dt * (0.15 + lv.level * 1.2);
        if (vizMode === 'bars') {
            var N = 64, bw = geo.bw / N, base = geo.by;
            var grad = g.createLinearGradient(0, base - geo.bh, 0, base + geo.bh); grad.addColorStop(0, ca); grad.addColorStop(0.5, cb); grad.addColorStop(1, ca);
            for (i = 0; i < N; i++) {
                var idx = Math.floor(Math.pow(i / N, 1.65) * 230) + 1, v = bins[idx] / 255;
                v = Math.pow(v, 1.35);
                vbars[i] += (v - vbars[i]) * (v > vbars[i] ? 0.6 : 0.14);
                vpeak[i] = Math.max(vbars[i], vpeak[i] - dt * 0.35);
                var h = Math.max(2, vbars[i] * geo.bh), x = geo.bx + i * bw + bw * 0.16, ww = bw * 0.68;
                g.fillStyle = grad;
                if (g.roundRect) { g.beginPath(); g.roundRect(x, base - h, ww, h * 2, ww / 2); g.fill(); } else g.fillRect(x, base - h, ww, h * 2);
                g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(x, base - vpeak[i] * geo.bh - 3, ww, 2);
            }
        } else if (vizMode === 'ring') {
            var M = 96, r0 = geo.r * 0.66 + 6, rot = vphase;
            g.lineCap = 'round';
            for (i = 0; i < M; i++) {
                var m = i < M / 2 ? i : M - 1 - i;                       // mirror so the ring is symmetric
                var ix = Math.floor(Math.pow(m / (M / 2), 1.55) * 200) + 1, vv = Math.pow(bins[ix] / 255, 1.3);
                vbars[i] += (vv - vbars[i]) * (vv > vbars[i] ? 0.6 : 0.14);
                var ang = rot + (i / M) * Math.PI * 2 - Math.PI / 2, len = 5 + vbars[i] * geo.r * 0.38;
                var t = Math.abs(i / M - 0.5) * 2;
                g.strokeStyle = 'rgb(' + [0, 1, 2].map(function (j) { return Math.round(util.lerp(a[j], b[j], t)); }).join(',') + ')';
                g.lineWidth = Math.max(2.2, geo.r * 0.028);
                g.beginPath();
                g.moveTo(geo.cx + Math.cos(ang) * r0, geo.cy + Math.sin(ang) * r0);
                g.lineTo(geo.cx + Math.cos(ang) * (r0 + len), geo.cy + Math.sin(ang) * (r0 + len));
                g.stroke();
            }
        } else {
            var wv = lv.wave, W = geo.bw, X = geo.bx, Y = geo.by, amp = geo.bh * 0.95, step = Math.floor(wv.length / 160);
            var lg = g.createLinearGradient(X, 0, X + W, 0); lg.addColorStop(0, ca); lg.addColorStop(1, cb);
            g.lineWidth = 3; g.lineJoin = 'round'; g.lineCap = 'round';
            [[1, 1], [-1, 0.22]].forEach(function (pass) {
                g.globalAlpha = pass[1]; g.strokeStyle = lg; g.beginPath();
                for (i = 0; i < 160; i++) {
                    var s = (wv[i * step] - 128) / 128, x2 = X + (i / 159) * W, y2 = Y + s * amp * pass[0] * (0.25 + lv.level * 2.4);
                    if (i === 0) g.moveTo(x2, y2); else g.lineTo(x2, y2);
                }
                g.stroke();
            });
            g.globalAlpha = 1;
        }
    }

    function openNP(opener) {
        if (isOpen(el.np)) return;
        openLayer(el.np, { focusEl: '#np-play', onClose: function () {
            document.body.classList.remove('np-open'); $('#shell').inert = false;
            if (history.state && history.state.np) history.back();                 // drop the entry we pushed
        } });
        document.body.classList.add('np-open'); $('#shell').inert = true;
        if (!(history.state && history.state.np)) history.pushState({ np: 1 }, '', location.href);   // phone Back button closes the player instead of leaving
        requestAnimationFrame(function () { sizeViz(); waveNp.size(); waveNp.markDirty(); renderQueues(); });
        setTimeout(function () { sizeViz(); waveNp.size(); }, 500);
    }
    ui.openNP = openNP;
    ui.closeNP = function () { closeLayer(el.np); };
    ui.toggleNP = function () { isOpen(el.np) ? ui.closeNP() : openNP(); };

    window.addEventListener('popstate', function () { if (isOpen(el.np) && !(history.state && history.state.np)) closeLayer(el.np); });

    // swipe-down to dismiss on touch devices
    (function swipe() {
        var y0 = null, dy = 0, t0 = 0;
        var top = $('#np-top'), stage = el.npStage;
        function finish(dismiss) {
            if (y0 === null) return;
            el.np.style.transition = ''; el.np.style.transform = '';
            if (dismiss && (dy > 110 || (dy > 40 && Date.now() - t0 < 220))) ui.closeNP();
            y0 = null;
        }
        [top, stage].forEach(function (t) {
            t.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); el.np.style.transition = 'none'; } }, { passive: true });
            t.addEventListener('touchmove', function (e) {
                if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0);
                el.np.style.transform = 'translateY(' + dy + 'px)';
            }, { passive: true });
            t.addEventListener('touchend', function () { finish(true); });
            t.addEventListener('touchcancel', function () { finish(false); });      // OS interrupted the gesture: snap back
        });
    })();

    // ============================================================ queue render
    function qItemHTML(s, kind, i, opts) {
        opts = opts || {};
        var drag = kind === 'uq';
        return '<div class="qitem' + (opts.current ? ' is-current' : '') + '" data-song="' + esc(s.name) + '"' + (drag ? ' draggable="true" data-qi="' + i + '"' : '') + '>' +
            (drag ? '<span class="qgrip" aria-hidden="true">' + icon('grip') + '</span>' : '') +
            '<button class="qmain" type="button" data-act="' + (kind === 'uq' ? 'play-q' : kind === 'up' ? 'play-up' : 'toggle') + '" data-i="' + i + '" aria-label="Play ' + esc(s.displayName) + '">' +
            '<img src="' + lib.thumb(s) + '" alt="" loading="lazy" decoding="async" width="44" height="44">' +
            '<span class="qtxt"><b>' + esc(s.displayName) + '</b><small>' + esc(s.artist) + '</small></span>' +
            (opts.current ? '<span class="eqbars" aria-hidden="true"><i></i><i></i><i></i></span>' : '') + '</button>' +
            (kind === 'uq' ? '<button class="icon-btn qx" type="button" data-act="remove-q" data-i="' + i + '" aria-label="Remove from queue">' + icon('x') + '</button>' : '') +
            '</div>';
    }
    function queueHTML() {
        var st = player.state, cur = st.current, html = '';
        if (cur) html += '<h3 class="qh">Now playing</h3>' + qItemHTML(cur, 'now', 0, { current: true });
        if (st.userQueue.length) {
            html += '<h3 class="qh">Next in queue<button class="link-btn" type="button" data-act="clear-q">Clear</button></h3>';
            html += st.userQueue.map(function (n, i) { return qItemHTML(lib.byName(n), 'uq', i); }).join('');
        }
        var up = player.upcoming(30);
        if (up.length) {
            html += '<h3 class="qh">Next from ' + esc(st.ctx.name) + (st.shuffle ? ' · shuffled' : '') + '</h3>';
            html += up.map(function (s, i) { return qItemHTML(s, 'up', i); }).join('');
        } else if (!st.userQueue.length) {
            html += '<div class="empty-mini">' + icon('queue') + '<p>Nothing queued up.<br>Use <b>Add to queue</b> on any song.</p></div>';
        }
        return html;
    }
    function renderQueues() {
        syncQueueBadge();
        var open = isOpen(el.queuePanel), np = isOpen(el.np);
        if (!open && !np) return;
        var html = queueHTML();
        if (open) el.queueBody.innerHTML = html;
        if (np) el.npQueue.innerHTML = html;
        highlightCurrent();
    }
    ui.renderQueues = renderQueues;

    function toggleQueue(force) {
        var open = isOpen(el.queuePanel);
        if (force === undefined) force = !open;
        if (force && !open) {
            var narrow = window.matchMedia('(max-width: 1099px)').matches;
            if (isOpen(el.np) || window.matchMedia('(max-width: 759px)').matches) { openNP(); return; }   // phones: queue lives inside Now Playing
            openLayer(el.queuePanel, { scrim: narrow, modal: narrow, focus: narrow, focusEl: '.panel-head .icon-btn', onClose: function () { el.btnQueue.setAttribute('aria-pressed', 'false'); document.body.classList.remove('queue-open'); H.store.set('queueOpen', false); } });
            document.body.classList.add('queue-open'); el.btnQueue.setAttribute('aria-pressed', 'true'); H.store.set('queueOpen', true);
            renderQueues();
        } else if (!force && open) closeLayer(el.queuePanel);
    }
    ui.toggleQueue = toggleQueue;

    // drag & drop reordering (user queue)
    var dragFrom = -1;
    document.addEventListener('dragstart', function (e) {
        var it = e.target.closest && e.target.closest('.qitem[data-qi]'); if (!it) return;
        dragFrom = +it.dataset.qi; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', it.dataset.song); } catch (x) { /* old browsers */ }
        it.classList.add('dragging');
    });
    document.addEventListener('dragover', function (e) {
        var it = e.target.closest && e.target.closest('.qitem[data-qi]'); if (!it || dragFrom < 0) return;
        e.preventDefault(); $$('.qitem.drag-over').forEach(function (n) { n.classList.remove('drag-over'); }); it.classList.add('drag-over');
    });
    document.addEventListener('drop', function (e) {
        var it = e.target.closest && e.target.closest('.qitem[data-qi]'); if (!it || dragFrom < 0) return;
        e.preventDefault(); player.moveInQueue(dragFrom, +it.dataset.qi); dragFrom = -1;
    });
    document.addEventListener('dragend', function () { dragFrom = -1; $$('.qitem.dragging, .qitem.drag-over').forEach(function (n) { n.classList.remove('dragging', 'drag-over'); }); });

    // =============================================================== Tune sheet
    var AMB_PREVIEW = { art: 'prev-art', aurora: 'prev-aurora', vinyl: 'prev-vinyl', vortex: 'prev-vortex', calm: 'prev-calm' };
    function buildTune() {
        $('#tune-amb').innerHTML = H.ambience.modes.map(function (m) {
            return '<button class="amb-opt" type="button" role="radio" data-amb="' + m.id + '" aria-checked="false"><span class="prev ' + AMB_PREVIEW[m.id] + '"></span><b>' + m.name + '</b><small>' + m.desc + '</small></button>';
        }).join('');
        $('#tune-presets').innerHTML = engine.PRESETS.map(function (p) { return '<button class="chip" type="button" role="radio" data-preset="' + p.id + '" aria-checked="false">' + p.name + '</button>'; }).join('');
        $('#tune-speed').innerHTML = engine.SPEEDS.map(function (s) { return '<button class="chip" type="button" role="radio" data-speed="' + s + '" aria-checked="false">' + (s === 1 ? 'Normal' : s + '×') + '</button>'; }).join('');
        $('#tune-sleep').innerHTML = [['0', 'Off'], ['5', '5 min'], ['15', '15 min'], ['30', '30 min'], ['45', '45 min'], ['60', '1 hour'], ['track', 'End of track']].map(function (s) { return '<button class="chip" type="button" role="radio" data-sleep="' + s[0] + '" aria-checked="false">' + s[1] + '</button>'; }).join('');
        $('#eq-note').hidden = engine.canGraph;
    }
    function setChecked(list, attr, val) { $$('[' + attr + ']', list).forEach(function (b) { var on = b.getAttribute(attr) === String(val); b.setAttribute('aria-checked', on); b.classList.toggle('is-on', on); }); }
    function syncTune() {
        setChecked($('#tune-amb'), 'data-amb', H.ambience.mode);
        var eq = engine.state.eq;
        setChecked($('#tune-presets'), 'data-preset', eq.preset);
        setChecked($('#tune-speed'), 'data-speed', engine.state.speed);
        ['bass', 'mid', 'treble'].forEach(function (k) {
            var inp = $('#eq-' + k); if (document.activeElement !== inp) inp.value = eq[k];
            $('#eq-' + k + '-v').textContent = (eq[k] > 0 ? '+' : '') + eq[k] + ' dB';
            inp.style.setProperty('--fill', ((eq[k] + 12) / 24 * 100) + '%');
        });
        var s = engine.state, mode = s.sleepEndOfTrack ? 'track' : s.sleepEndAt ? 'timer' : '0';
        setChecked($('#tune-sleep'), 'data-sleep', mode === 'timer' ? 'none' : mode);
        var left = $('#sleep-left');
        if (s.sleepEndAt) { var ms = Math.max(0, s.sleepEndAt - Date.now()); left.textContent = 'stops in ' + fmt(ms / 1000); }
        else left.textContent = s.sleepEndOfTrack ? 'after this track' : '';
        document.body.classList.toggle('has-sleep', !!(s.sleepEndAt || s.sleepEndOfTrack));
    }
    function openTune() { syncTune(); openLayer(el.tune, { scrim: true, focusEl: '.chip.is-on, .amb-opt.is-on' }); }
    ui.openTune = openTune;
    ui.toggleTune = function () { isOpen(el.tune) ? closeLayer(el.tune) : openTune(); };

    el.tune.addEventListener('click', function (e) {
        var t;
        if ((t = e.target.closest('[data-amb]'))) H.ambience.setMode(t.dataset.amb);
        else if ((t = e.target.closest('[data-preset]'))) engine.setPreset(t.dataset.preset);
        else if ((t = e.target.closest('[data-speed]'))) engine.setSpeed(parseFloat(t.dataset.speed));
        else if ((t = e.target.closest('[data-sleep]'))) {
            var v = t.dataset.sleep; engine.setSleep(v === 'track' ? 'track' : parseInt(v, 10));
            if (v !== '0') toast(v === 'track' ? 'Sleep timer: stops after this track' : 'Sleep timer set for ' + v + ' min', { icon: 'moon' });
        }
    });
    ['bass', 'mid', 'treble'].forEach(function (k) {
        $('#eq-' + k).addEventListener('input', function (e) { var p = {}; p[k] = parseFloat(e.target.value); engine.setEQ(p); });
        $('#eq-' + k).addEventListener('dblclick', function () { var p = {}; p[k] = 0; engine.setEQ(p); });
    });
    // sleep countdown keeps ticking while the sheet is open
    bus.on('sleep', syncTune); bus.on('tune', syncTune); bus.on('ambience', syncTune);
    bus.on('sleep:done', function () { toast('Sleep timer finished. Sweet dreams.', { icon: 'moon', ms: 4000 }); });

    // =============================================================== context menu
    var menuSong = null, menuOpenedAt = 0;
    function openMenu(name, x, y, anchor) {
        var s = lib.byName(name); if (!s) return;
        menuSong = s; menuOpenedAt = performance.now();
        var liked = player.isLiked(name);
        var items = [
            ['play', 'play', 'Play'],
            ['next', 'queue', 'Play next'],
            ['queue', 'plus', 'Add to queue'],
            ['like', 'heart', liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'],
            ['link', 'link', 'Copy link'],
            ['artist', 'user', 'More by ' + s.artists[0]]
        ];
        el.ctx.innerHTML = '<div class="ctx-head"><img src="' + lib.thumb(s) + '" alt="" width="40" height="40"><div><b>' + esc(s.displayName) + '</b><small>' + esc(s.artist) + '</small></div></div>' +
            items.map(function (it) { return '<button type="button" role="menuitem" data-menu="' + it[0] + '">' + icon(it[1]) + '<span>' + esc(it[2]) + '</span></button>'; }).join('');
        el.ctx.hidden = false; el.ctx.classList.add('open');
        var mobile = window.matchMedia('(max-width: 759px)').matches;
        if (mobile) { el.ctx.style.left = el.ctx.style.top = ''; document.body.classList.add('ctx-sheet'); scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add('on'); }); }
        else {
            var r = el.ctx.getBoundingClientRect();
            el.ctx.style.left = util.clamp(x, 8, innerWidth - r.width - 8) + 'px';
            el.ctx.style.top = util.clamp(y, 8, innerHeight - r.height - 8) + 'px';
        }
        var f = el.ctx.querySelector('button'); if (f) f.focus({ preventScroll: true });
        el.ctx._anchor = anchor;
    }
    function closeMenu() {
        if (el.ctx.hidden) return;
        el.ctx.hidden = true; el.ctx.classList.remove('open');
        if (document.body.classList.contains('ctx-sheet')) { document.body.classList.remove('ctx-sheet'); if (!layers.some(function (l) { return l.scrim; })) { scrim.classList.remove('on'); setTimeout(function () { if (!scrim.classList.contains('on')) scrim.hidden = true; }, 300); } }
        if (el.ctx._anchor && document.contains(el.ctx._anchor)) el.ctx._anchor.focus({ preventScroll: true });
    }
    ui.openMenu = openMenu; ui.closeMenu = closeMenu; ui.menuOpen = function () { return !el.ctx.hidden; };
    el.ctx.addEventListener('click', function (e) {
        var b = e.target.closest('[data-menu]'); if (!b || !menuSong) return;
        var s = menuSong; closeMenu();
        var act = b.dataset.menu;
        if (act === 'play') player.playContext(H.views.ctxFor(s), s.name);
        else if (act === 'next') player.enqueue(s.name, true);
        else if (act === 'queue') player.enqueue(s.name, false);
        else if (act === 'like') player.toggleLike(s.name);
        else if (act === 'link') ui.copyLink(s);
        else if (act === 'artist') location.hash = '#/artist/' + encodeURIComponent(util.norm(s.artists[0]));
    });
    document.addEventListener('pointerdown', function (e) { if (!el.ctx.hidden && !el.ctx.contains(e.target)) closeMenu(); });
    document.addEventListener('scroll', function () { if (performance.now() - menuOpenedAt > 250) closeMenu(); }, true);   // ignore scroll inertia right after opening
    el.ctx.addEventListener('keydown', function (e) {
        var bs = $$('button', el.ctx), i = bs.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { bs[(i + 1) % bs.length].focus(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { bs[(i - 1 + bs.length) % bs.length].focus(); e.preventDefault(); }
    });

    ui.copyLink = function (s) {
        var url = location.origin + location.pathname + '#/track/' + encodeURIComponent(s.name);
        if (location.protocol === 'file:') url = 'player.html#/track/' + s.name;
        var done = function () { toast('Link copied', { icon: 'link' }); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link', url); });
        else { var ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { prompt('Copy this link', url); } ta.remove(); }
    };

    // ============================================================ shortcuts dialog
    var SHORTCUTS = [
        ['Playback', [['Space', 'Play / pause'], ['← / →', 'Seek 5 seconds'], ['Shift + ← / →', 'Previous / next track'], ['N / P', 'Next / previous track'], ['↑ / ↓', 'Volume'], ['M', 'Mute'], ['0 – 9', 'Jump to 0% – 90%']]],
        ['Modes', [['S', 'Shuffle'], ['R', 'Repeat: off → all → one'], ['L', 'Like current song'], ['V', 'Cycle visualizer'], ['A', 'Cycle ambience']]],
        ['Navigate', [['Ctrl / ⌘ + K', 'Command palette'], ['/', 'Search'], ['F', 'Now playing'], ['Q', 'Queue'], ['T', 'Tune'], ['G then H', 'Go home'], ['?', 'This help'], ['Esc', 'Close anything']]]
    ];
    $('#keys-grid').innerHTML = SHORTCUTS.map(function (g) {
        return '<section><h3>' + g[0] + '</h3><dl>' + g[1].map(function (r) {
            return '<div><dt>' + r[0].split(' ').map(function (k) { return r[0] !== '/' && /^[+/→←↑↓–]$|^then$|^to$/.test(k) ? '<i>' + k + '</i>' : '<kbd>' + k + '</kbd>'; }).join('') + '</dt><dd>' + r[1] + '</dd></div>';
        }).join('') + '</dl></section>';
    }).join('');
    ui.openShortcuts = function () { openLayer(el.shortcuts, { scrim: true, focusEl: '.icon-btn' }); el.shortcuts.dataset.hideAfter = '1'; };

    // =========================================================== command palette
    var pal = { items: [], active: 0, q: '' };
    var palInput = $('#palette-input'), palList = $('#palette-list');

    function commands() {
        var st = player.state, A = H.ambience, go = function (h) { return function () { location.hash = h; }; };
        var list = [
            { label: engine.playing ? 'Pause' : 'Play', icon: engine.playing ? 'pause' : 'play', kbd: 'Space', run: player.toggle, kw: 'play pause toggle' },
            { label: 'Next track', icon: 'next', kbd: 'N', run: function () { player.next(false); } },
            { label: 'Previous track', icon: 'prev', kbd: 'P', run: player.prev },
            { label: 'Shuffle: ' + (st.shuffle ? 'turn off' : 'turn on'), icon: 'shuffle', kbd: 'S', run: player.toggleShuffle },
            { label: 'Repeat: ' + ['off', 'all', 'one'][st.repeat] + ' → ' + ['all', 'one', 'off'][st.repeat], icon: 'repeat', kbd: 'R', run: player.cycleRepeat },
            { label: 'Like / unlike current song', icon: 'heart', kbd: 'L', run: function () { toggleLikeCurrent(); } },
            { label: 'Open Now Playing', icon: 'disc', kbd: 'F', run: ui.toggleNP },
            { label: 'Show queue', icon: 'queue', kbd: 'Q', run: function () { toggleQueue(); } },
            { label: 'Open Tune (ambience, EQ, speed, sleep)', icon: 'tune', kbd: 'T', run: openTune, kw: 'settings equalizer eq' },
            { label: 'Play today’s Daily mix', icon: 'sun', run: function () { player.playContext(player.contextFrom('mix'), null, { shuffle: false }); }, kw: 'daily mix discover' },
            { label: 'Shuffle the whole library', icon: 'shuffle', run: function () { player.playContext(player.contextFrom('all'), null, { shuffle: true }); }, kw: 'everything all' },
            { label: 'Go to Home', icon: 'home', run: go('#/home') },
            { label: 'Go to Liked Songs', icon: 'heart', run: go('#/liked') },
            { label: 'Go to Recently played', icon: 'clock', run: go('#/recent') }
        ];
        lib.playlists.forEach(function (p) { list.push({ label: 'Go to ' + p.name, icon: 'library', run: go('#/playlist/' + p.id), kw: 'playlist language ' + p.name }); });
        A.modes.forEach(function (m) { list.push({ label: 'Ambience: ' + m.name, icon: 'sun', run: function () { A.setMode(m.id); toast('Ambience: ' + m.name, { icon: 'sun' }); }, kw: 'background theme ' + m.desc }); });
        engine.PRESETS.forEach(function (p) { list.push({ label: 'EQ: ' + p.name, icon: 'eq', run: function () { engine.setPreset(p.id); toast('EQ: ' + p.name, { icon: 'eq' }); }, kw: 'equalizer equaliser preset' }); });
        engine.SPEEDS.forEach(function (s) { list.push({ label: 'Speed: ' + (s === 1 ? 'Normal' : s + '×'), icon: 'gauge', run: function () { engine.setSpeed(s); toast('Speed ' + (s === 1 ? 'normal' : s + '×'), { icon: 'gauge' }); }, kw: 'playback rate tempo' }); });
        [[15, '15 minutes'], [30, '30 minutes'], [60, '1 hour']].forEach(function (s) { list.push({ label: 'Sleep timer: ' + s[1], icon: 'moon', run: function () { engine.setSleep(s[0]); toast('Sleep timer: ' + s[1], { icon: 'moon' }); }, kw: 'timer sleep stop' }); });
        list.push({ label: 'Sleep timer: off', icon: 'moon', run: function () { engine.setSleep(0); toast('Sleep timer off', { icon: 'moon' }); } });
        list.push({ label: 'Cycle visualizer style', icon: 'eq', kbd: 'V', run: ui.cycleViz });
        list.push({ label: 'Keyboard shortcuts', icon: 'keyboard', kbd: '?', run: ui.openShortcuts });
        list.push({ label: 'Back to the landing page', icon: 'external', run: function () { location.href = 'index.html'; } });
        return list;
    }
    function toggleLikeCurrent() {
        var s = player.state.current; if (!s) return;
        var on = player.toggleLike(s.name);
        toast(on ? 'Added to Liked Songs' : 'Removed from Liked Songs', { icon: 'heart' });
    }
    ui.toggleLikeCurrent = toggleLikeCurrent;

    function buildPalette(q) {
        pal.q = q; var qn = util.norm(q), out = [];
        var cmds = commands();
        if (!qn) {
            out.push({ group: 'Suggested' });
            cmds.slice(0, 7).forEach(function (c) { out.push({ type: 'cmd', c: c }); });
            var rec = player.recentSongs().slice(0, 5);
            if (rec.length) { out.push({ group: 'Recently played' }); rec.forEach(function (s) { out.push({ type: 'song', s: s }); }); }
        } else {
            var tokens = qn.split(' ');
            var mc = cmds.filter(function (c) { var h = util.norm(c.label + ' ' + (c.kw || '')); return tokens.every(function (t) { return h.indexOf(t) > -1; }); }).slice(0, 6);
            var res = lib.search(q);
            if (res.songs.length) { out.push({ group: 'Songs' }); res.songs.slice(0, 7).forEach(function (s) { out.push({ type: 'song', s: s }); }); }
            if (res.artists.length) { out.push({ group: 'Artists' }); res.artists.slice(0, 3).forEach(function (a) { out.push({ type: 'artist', a: a }); }); }
            if (mc.length) { out.push({ group: 'Commands' }); mc.forEach(function (c) { out.push({ type: 'cmd', c: c }); }); }
            out.push({ group: 'Search' }); out.push({ type: 'search', q: q });
        }
        pal.items = out; pal.active = out.findIndex(function (x) { return x.type; });
        renderPalette();
    }
    function renderPalette() {
        var idx = -1;
        palList.innerHTML = pal.items.map(function (it) {
            if (it.group) return '<li class="pal-group" role="presentation">' + it.group + '</li>';
            idx++;
            var on = pal.items.indexOf(it) === pal.active;
            var body;
            if (it.type === 'cmd') body = '<span class="pal-ic">' + icon(it.c.icon) + '</span><span class="pal-txt"><b>' + esc(it.c.label) + '</b></span>' + (it.c.kbd ? '<kbd>' + it.c.kbd + '</kbd>' : '');
            else if (it.type === 'song') body = '<img src="' + lib.thumb(it.s) + '" alt="" width="40" height="40"><span class="pal-txt"><b>' + esc(it.s.displayName) + '</b><small>' + esc(it.s.artist) + '</small></span><span class="pal-tag">' + esc(lib.langName(it.s.playlist)) + '</span>';
            else if (it.type === 'artist') body = '<span class="pal-ic round">' + icon('user') + '</span><span class="pal-txt"><b>' + esc(it.a.name) + '</b><small>' + it.a.songs.length + ' track' + (it.a.songs.length > 1 ? 's' : '') + '</small></span>';
            else body = '<span class="pal-ic">' + icon('search') + '</span><span class="pal-txt"><b>See all results for “' + esc(it.q) + '”</b></span>';
            return '<li class="pal-item' + (on ? ' is-active' : '') + '" role="option" aria-selected="' + on + '" data-pi="' + pal.items.indexOf(it) + '" id="pal-' + pal.items.indexOf(it) + '">' + body + '</li>';
        }).join('');
        palInput.setAttribute('aria-activedescendant', pal.active >= 0 ? 'pal-' + pal.active : '');
        var a = $('.is-active', palList); if (a) a.scrollIntoView({ block: 'nearest' });
    }
    function palMove(d) {
        var sel = pal.items.map(function (x, i) { return x.type ? i : -1; }).filter(function (i) { return i > -1; });
        if (!sel.length) return;
        var at = sel.indexOf(pal.active); pal.active = sel[(at + d + sel.length) % sel.length]; renderPalette();
    }
    function palRun(it, mods) {
        if (!it) return;
        mods = mods || {};
        ui.closePalette();
        if (it.type === 'cmd') setTimeout(it.c.run, 30);
        else if (it.type === 'song') {
            if (mods.shift) { player.enqueue(it.s.name, true); }
            else if (mods.ctrl) { player.enqueue(it.s.name, false); }
            else player.playContext(H.views.ctxFor(it.s, pal.q ? lib.search(pal.q).songs : null), it.s.name);
        }
        else if (it.type === 'artist') location.hash = '#/artist/' + encodeURIComponent(it.a.key);
        else if (it.type === 'search') location.hash = '#/search/' + encodeURIComponent(it.q);
    }
    ui.openPalette = function () {
        if (isOpen(el.palette)) return;
        palInput.value = ''; buildPalette('');
        openLayer(el.palette, { scrim: true, focus: false });
        el.palette.dataset.hideAfter = '1';
        setTimeout(function () { palInput.focus(); }, 40);
    };
    ui.closePalette = function () { closeLayer(el.palette); };
    palInput.addEventListener('input', function () { buildPalette(palInput.value); });
    palInput.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { palMove(1); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { palMove(-1); e.preventDefault(); }
        else if (e.key === 'Enter') { e.preventDefault(); palRun(pal.items[pal.active], { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey }); }
    });
    palList.addEventListener('pointermove', function (e) { var li = e.target.closest('[data-pi]'); if (li && +li.dataset.pi !== pal.active) { pal.active = +li.dataset.pi; renderPalette(); } });
    palList.addEventListener('click', function (e) { var li = e.target.closest('[data-pi]'); if (li) palRun(pal.items[+li.dataset.pi], { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey }); });
    el.palette.addEventListener('pointerdown', function (e) { if (e.target === el.palette) ui.closePalette(); });

    // ================================================================= wiring
    waveBar = new Waveform($('#wave-bar'), { barW: 2.5, gap: 2, onSeek: function (p) { engine.seek(p * (audio.duration || 0)); lastSec = -1; } });
    waveNp = new Waveform($('#wave-np'), {
        barW: 3, gap: 2.5, onSeek: function (p) { engine.seek(p * (audio.duration || 0)); lastSec = -1; },
        onPreview: function (p) { el.npCur.textContent = fmt(p * (audio.duration || 0)); }
    });
    ui.waves = [waveBar, waveNp];

    bus.on('track', onTrack);
    bus.on('queue', renderQueues);
    bus.on('likes', function (d) { syncLike(); $$('[data-like-for="' + d.name + '"]').forEach(function (b) { b.classList.toggle('is-liked', d.liked); b.setAttribute('aria-pressed', d.liked); }); });
    bus.on('modes', function () { syncModes(); renderQueues(); });
    bus.on('volume', syncVolume);
    bus.on('audio:play', syncPlay); bus.on('audio:pause', syncPlay); bus.on('audio:ended', syncPlay);
    bus.on('audio:waiting', function () { document.body.classList.add('is-buffering'); });
    ['playing', 'canplay', 'pause'].forEach(function (e) { bus.on('audio:' + e, function () { document.body.classList.remove('is-buffering'); }); });
    bus.on('queue:added', function (d) { var s = lib.byName(d.name); toast((d.next ? 'Playing next: ' : 'Added to queue: ') + s.displayName, { icon: 'queue' }); });
    bus.on('queue:end', function () { toast('End of queue. Turn on repeat or pick something new.', { icon: 'queue', ms: 3600 }); });
    bus.on('audio:blocked', function () { toast('Press play to start. Your browser blocked autoplay.', { icon: 'play' }); });
    var errStreak = 0;
    bus.on('audio:playing', function () { errStreak = 0; });
    bus.on('audio:error', function () {
        if (!player.state.current) return;
        if (++errStreak > 2) { toast('Can’t reach the music files. Check your connection and press play.', { icon: 'x', ms: 5000 }); errStreak = 0; return; }
        toast('Couldn’t load “' + player.state.current.displayName + '”. Skipping.', { icon: 'x', ms: 3500 });
        setTimeout(function () { player.next(false); }, 900);
    });

    // transport buttons
    $('#btn-play').addEventListener('click', player.toggle);
    $('#mini-play').addEventListener('click', player.toggle);
    $('#np-play').addEventListener('click', player.toggle);
    ['#btn-next', '#mini-next', '#np-next'].forEach(function (s) { $(s).addEventListener('click', function () { player.next(false); }); });
    ['#btn-prev', '#np-prev'].forEach(function (s) { $(s).addEventListener('click', player.prev); });
    el.shuffle.forEach(function (b) { b.addEventListener('click', player.toggleShuffle); });
    el.repeat.forEach(function (b) { b.addEventListener('click', player.cycleRepeat); });
    [el.barLike, el.npLike].forEach(function (b) { b.addEventListener('click', toggleLikeCurrent); });
    el.vol.addEventListener('input', function () { engine.setVolume(parseFloat(el.vol.value)); });
    el.mute.addEventListener('click', engine.toggleMute);
    $('#btn-queue').addEventListener('click', function () { toggleQueue(); });
    $('#btn-tune').addEventListener('click', openTune);
    $('#btn-tune-top').addEventListener('click', openTune);
    $('#np-tune').addEventListener('click', openTune);
    $('#btn-expand').addEventListener('click', function () { openNP(); });
    $('#btn-palette').addEventListener('click', ui.openPalette);
    $('#np-close').addEventListener('click', ui.closeNP);
    $('#np-share').addEventListener('click', function () { if (player.state.current) ui.copyLink(player.state.current); });
    $('#nav-np').addEventListener('click', function () { openNP(); });
    $('#open-shortcuts').addEventListener('click', ui.openShortcuts);
    var barOpen = $('#bar-open');
    barOpen.addEventListener('click', function () { openNP(); });
    barOpen.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openNP(); } });

    // queue interactions (shared by panel + Now Playing)
    document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.dataset.act, i = +b.dataset.i;
        if (act === 'play-q') player.playFromQueue(i);
        else if (act === 'play-up') player.playUpcoming(i);
        else if (act === 'remove-q') player.removeFromQueue(i);
        else if (act === 'clear-q') player.clearQueue();
        else if (act === 'toggle') player.toggle();
    });

    el.npArt.addEventListener('click', player.toggle);

    // initial paint of state
    buildTune(); syncTune(); syncModes(); syncVolume(); syncPlay(); setViz(vizMode); syncQueueBadge();
    ui.syncPlay = syncPlay; ui.highlightCurrent = highlightCurrent; ui.syncLike = syncLike; ui.toggleLikeCurrentSong = toggleLikeCurrent;
    ui.sizeViz = sizeViz;
})();
