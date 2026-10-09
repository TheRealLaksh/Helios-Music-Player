/* ==========================================================================
   Helios — landing page
   Cover wall · marquee · live demo player · audio-reactive sun canvas
   ========================================================================== */
(function () {
    'use strict';

    var LIB = window.HELIOS_LIBRARY;
    var songs = LIB.songs;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var thumb = function (s) { return 'Assets/thumbs/' + s.cover + '.jpg'; };
    var rgb = function (c) { return c[0] + ' ' + c[1] + ' ' + c[2]; };
    var fmt = function (t) {
        if (!isFinite(t)) return '0:00';
        return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    };

    // deterministic shuffle so the wall looks the same on every load
    function seeded(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    function shuffle(arr, rnd) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }
    function el(tag, attrs, html) {
        var n = document.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        if (html) n.innerHTML = html;
        return n;
    }

    // ---------------------------------------------------------------- stats
    $('[data-stat="tracks"]').textContent = songs.length;
    $('[data-stat="langs"]').textContent = LIB.playlists.length;
    $('#year').textContent = new Date().getFullYear();

    // ------------------------------------------------------------ cover wall
    (function buildWall() {
        var wall = $('#wall');
        var pool = shuffle(songs, seeded(7));
        for (var c = 0; c < 4; c++) {
            var col = el('div', { 'class': 'wall-col' });
            var set = pool.slice(c * 11, c * 11 + 11);
            set.concat(set).forEach(function (s) {
                var img = el('img', { src: thumb(s), alt: '', width: 360, height: 360, decoding: 'async' });
                if (c > 1) img.loading = 'lazy';
                col.appendChild(img);
            });
            wall.appendChild(col);
        }
    })();

    // floating "now playing" chip cycles through tracks
    (function floatCard() {
        var order = shuffle(songs, seeded(21)), i = 0;
        var img = $('#fc-cover'), t = $('#fc-title'), a = $('#fc-artist'), card = $('#float-card');
        function show() {
            var s = order[i++ % order.length];
            card.style.opacity = 0;
            setTimeout(function () {
                img.src = thumb(s); t.textContent = s.displayName; a.textContent = s.artist;
                card.style.opacity = 1;
            }, 280);
        }
        card.style.transition = 'opacity .28s';
        show();
        if (!reduceMotion) setInterval(show, 3800);
    })();

    // --------------------------------------------------------------- marquee
    (function marquee() {
        var count = {};
        songs.forEach(function (s) {
            var main = s.artist.split(/,| & | ft\.? /i)[0].trim();
            count[main] = (count[main] || 0) + 1;
        });
        var top = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 16);
        var html = top.map(function (n) { return '<span>' + n + '</span>'; }).join('');
        $('#marquee').innerHTML = html + html;
    })();

    // -------------------------------------------------------------- swatches
    (function swatches() {
        var host = $('#swatches');
        var picks = [1, 12, 21, 30, 38, 47, 58].map(function (i) { return songs[i % songs.length]; });
        picks.forEach(function (s) {
            var i = el('i', { title: s.displayName });
            i.style.setProperty('--c1', 'rgb(' + rgb(s.colors[0]) + ')');
            i.style.setProperty('--c2', 'rgb(' + rgb(s.colors[1]) + ')');
            host.appendChild(i);
        });
    })();

    // ------------------------------------------------------------- mini wave
    (function miniWave() {
        var svg = $('#mini-wave'), rnd = seeded(99), bars = [], N = 56;
        var NS = 'http://www.w3.org/2000/svg';
        svg.innerHTML = '<defs><linearGradient id="wg" x1="0" x2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset="1" stop-color="#ff4f6d"/></linearGradient></defs>';
        for (var i = 0; i < N; i++) {
            var env = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.19)) * (0.45 + rnd() * 0.55);
            var h = Math.max(4, env * 44);
            var r = document.createElementNS(NS, 'rect');
            r.setAttribute('x', i * (200 / N) + 0.6); r.setAttribute('width', 200 / N - 1.4);
            r.setAttribute('y', (48 - h) / 2); r.setAttribute('height', h); r.setAttribute('rx', 1.4);
            svg.appendChild(r); bars.push(r);
        }
        var pos = 0, timer = null;
        function tick() {
            bars.forEach(function (b, i) { b.classList.toggle('on', i <= pos); });
            pos = (pos + 1) % (N + 14);
        }
        if (!reduceMotion && 'IntersectionObserver' in window) {
            new IntersectionObserver(function (e) {
                if (e[0].isIntersecting) { timer = timer || setInterval(tick, 110); }
                else { clearInterval(timer); timer = null; }
            }).observe(svg);
        } else { pos = 22; tick(); }
    })();

    // ----------------------------------------------------------- library cards
    (function library() {
        var host = $('#lib-grid');
        LIB.playlists.forEach(function (p, idx) {
            var a = el('a', { 'class': 'lib reveal', href: 'player.html#/playlist/' + p.id, 'data-enter': '' });
            a.style.setProperty('--d', (idx * 0.08) + 's');
            var covers = p.songs.slice(0, 4).map(function (s) {
                return '<img src="' + thumb(s) + '" alt="" loading="lazy" decoding="async">';
            }).join('');
            a.innerHTML = '<div class="lib-mosaic">' + covers + '</div>' +
                '<h3>' + p.name + '</h3><p>' + p.tagline + '</p>' +
                '<div class="lib-foot"><span>' + p.songs.length + ' tracks</span>' +
                '<span class="lib-go"><svg class="i"><use href="#i-arrow"/></svg></span></div>';
            host.appendChild(a);
        });
    })();

    // ------------------------------------------------------------- demo player
    var demoLevel = 0;
    (function demo() {
        var root = $('.demo');
        var picks = [];
        // one hand-picked, mixed set
        ['azizam', 'hawayein', 'magic', 'perfect', 'faasle', 'hymnfortheweekend', 'baawe', 'husn', 'sprinter', 'oldmoney', 'ilahi', 'shivers']
            .forEach(function (n) { var s = songs.filter(function (x) { return x.name === n; })[0]; if (s) picks.push(s); });
        var audio = new Audio(); audio.preload = 'metadata';
        var idx = 0, ctx, analyser, data, demoColor = 'rgb(255,150,80)';
        var cover = $('#demo-cover'), glow = $('#demo-glow'), title = $('#demo-title'), artist = $('#demo-artist'), lang = $('#demo-lang');
        var fill = $('#demo-fill'), bar = $('#demo-bar'), cur = $('#demo-cur'), dur = $('#demo-dur');
        var playBtn = $('#demo-play'), playIcon = $('#demo-play-icon use');
        var viz = $('#demo-viz'), vctx = viz.getContext('2d');
        var list = $('#demo-picks'), buttons = [];

        picks.forEach(function (s, i) {
            var b = el('button', { 'class': 'pick', role: 'option', 'aria-label': s.displayName + ' by ' + s.artist, 'aria-selected': 'false' });
            b.innerHTML = '<img src="' + thumb(s) + '" alt="" loading="lazy" decoding="async">';
            b.addEventListener('click', function () { select(i, true); });
            list.appendChild(b); buttons.push(b);
        });

        function select(i, play) {
            idx = (i + picks.length) % picks.length;
            var s = picks[idx];
            audio.src = 'Assets/music/' + s.name + '.mp3';
            cover.src = 'Assets/images/' + s.cover + '.jpg';
            title.textContent = s.displayName; artist.textContent = s.artist;
            lang.textContent = LIB.playlists.filter(function (p) { return p.id === s.playlist; })[0].name;
            root.style.setProperty('--demo-rgb', rgb(s.colors[0])); demoColor = 'rgb(' + s.colors[0].join(',') + ')';
            buttons.forEach(function (b, k) { b.setAttribute('aria-selected', k === idx ? 'true' : 'false'); });
            fill.style.width = '0%'; cur.textContent = '0:00'; dur.textContent = '0:00';
            if (play) start();
        }
        function setIcon(playing) {
            playIcon.setAttribute('href', playing ? '#i-pause' : '#i-play');
            playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
            root.classList.toggle('is-playing', playing);
        }
        function ensureAudioGraph() {
            if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
            if (location.protocol === 'file:') return;                 // MediaElementSource is silent on file:// origins
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                var src = ctx.createMediaElementSource(audio);
                analyser = ctx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.8;
                src.connect(analyser); analyser.connect(ctx.destination);
                data = new Uint8Array(analyser.frequencyBinCount);
            } catch (e) { ctx = analyser = null; }
        }
        function start() {
            ensureAudioGraph();
            var p = audio.play();
            if (p && p.catch) p.catch(function () { setIcon(false); });
        }
        playBtn.addEventListener('click', function () { audio.paused ? start() : audio.pause(); });
        $('#demo-prev').addEventListener('click', function () { select(idx - 1, true); });
        $('#demo-next').addEventListener('click', function () { select(idx + 1, true); });
        audio.addEventListener('play', function () { setIcon(true); });
        audio.addEventListener('pause', function () { setIcon(false); });
        audio.addEventListener('ended', function () { select(idx + 1, true); });
        audio.addEventListener('loadedmetadata', function () { dur.textContent = fmt(audio.duration); });
        audio.addEventListener('timeupdate', function () {
            if (!audio.duration) return;
            var pct = audio.currentTime / audio.duration * 100;
            fill.style.width = pct + '%'; cur.textContent = fmt(audio.currentTime);
            bar.setAttribute('aria-valuenow', Math.round(pct));
        });
        function seekTo(clientX) {
            var r = bar.getBoundingClientRect();
            if (audio.duration) audio.currentTime = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * audio.duration;
        }
        bar.addEventListener('click', function (e) { seekTo(e.clientX); });
        bar.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') { audio.currentTime += 5; e.preventDefault(); }
            if (e.key === 'ArrowLeft') { audio.currentTime -= 5; e.preventDefault(); }
        });

        // visualizer (also feeds the hero sun)
        var visible = true;
        if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(root);
        function draw() {
            requestAnimationFrame(draw);
            var w = viz.width, h = viz.height, level = 0;
            var playing = !audio.paused && analyser;
            if (playing) { analyser.getByteFrequencyData(data); for (var k = 0; k < data.length; k++) level += data[k]; level = level / data.length / 255; }
            demoLevel += ((playing ? level : 0) - demoLevel) * 0.2;
            if (!visible) return;
            vctx.clearRect(0, 0, w, h);
            var n = 48, bw = w / n;
            vctx.fillStyle = demoColor;
            for (var i = 0; i < n; i++) {
                var v = playing ? data[Math.floor(i * data.length * 0.75 / n)] / 255 : 0.07 + 0.05 * Math.sin(i * 0.5 + Date.now() / 600);
                var bh = Math.max(3, v * h * 0.95);
                var x = i * bw + bw * 0.18, ww = bw * 0.64, r = ww / 2;
                vctx.beginPath();
                vctx.roundRect ? vctx.roundRect(x, h - bh, ww, bh, r) : vctx.rect(x, h - bh, ww, bh);
                vctx.fill();
            }
        }
        select(0, false);
        draw();
    })();

    // ---------------------------------------------------------------- the sun
    (function sun() {
        var c = $('#sun'), ctx = c.getContext('2d');
        var w, h, dpr, cx, cy, R, t = 0, px = 0.7, py = 0.4, tx = 0.7, ty = 0.4, running = false;
        var N = 150, lastFade = -1;

        function resize() {
            dpr = Math.min(2, window.devicePixelRatio || 1);
            w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
            var wide = innerWidth > 1000;
            cx = w * (wide ? 0.7 : 0.5); cy = h * (wide ? 0.52 : 0.68);          // phones: sun sits behind the cover wall, clear of the copy
            R = Math.min(w, h) * (wide ? 0.4 : 0.4);
            if (!running) frame(0);
        }
        function angDiff(a, b) { var d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

        function frame(dt) {
            t += dt;
            px += (tx - px) * 0.06; py += (ty - py) * 0.06;
            ctx.clearRect(0, 0, w, h);
            var fade = Math.max(0, 1 - scrollY / (innerHeight * 0.85));
            if (fade !== lastFade) { c.style.opacity = fade; lastFade = fade; }
            if (fade <= 0) return;

            var pulse = 1 + demoLevel * 0.35 + Math.sin(t * 1.4) * 0.015;
            ctx.globalCompositeOperation = 'lighter';

            // corona
            var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5 * pulse);
            g.addColorStop(0, 'rgba(255,190,90,0.34)'); g.addColorStop(0.45, 'rgba(255,100,90,0.12)'); g.addColorStop(1, 'rgba(255,80,110,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.5 * pulse, 0, 7); ctx.fill();

            // rays
            var ap = Math.atan2(py * h - cy, px * w - cx);
            ctx.lineCap = 'round';
            for (var i = 0; i < N; i++) {
                var a = i / N * Math.PI * 2 + t * 0.045;
                var env = 0.5 + 0.5 * Math.sin(i * 0.37 + t * 1.3) * Math.sin(i * 0.11 - t * 0.7);
                var infl = Math.exp(-Math.pow(angDiff(a, ap), 2) * 7);
                var len = R * (0.08 + 0.26 * env * env + 0.3 * infl + demoLevel * 0.7 * (0.4 + env));
                var r0 = R * 0.6 * pulse;
                var cos = Math.cos(a), sin = Math.sin(a);
                var hue = 12 + 30 * (0.5 + 0.5 * Math.cos(a * 2 + t * 0.2)) + env * 10;
                ctx.strokeStyle = 'hsla(' + (hue + (infl * 12)) + ',100%,' + (62 + infl * 12) + '%,' + (0.2 + env * 0.38 + infl * 0.3) + ')';
                ctx.lineWidth = (1.6 + env * 2.2 + infl * 2) * dpr;
                ctx.beginPath(); ctx.moveTo(cx + cos * r0, cy + sin * r0); ctx.lineTo(cx + cos * (r0 + len), cy + sin * (r0 + len)); ctx.stroke();
            }

            // disc
            var d = ctx.createRadialGradient(cx - R * 0.14, cy - R * 0.16, R * 0.04, cx, cy, R * 0.56 * pulse);
            d.addColorStop(0, 'rgba(255,236,170,0.95)'); d.addColorStop(0.55, 'rgba(255,148,90,0.88)'); d.addColorStop(1, 'rgba(255,79,109,0.8)');
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = d; ctx.beginPath(); ctx.arc(cx, cy, R * 0.54 * pulse, 0, 7); ctx.fill();
            // darken the disc a touch so the cover wall and copy stay legible on top
            ctx.fillStyle = 'rgba(7,6,10,0.55)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.54 * pulse, 0, 7); ctx.fill();
        }

        var last = 0;
        function loop(now) {
            if (!running) return;
            if (scrollY > innerHeight) { running = false; return; }       // fully faded out: stop burning frames
            frame(Math.min(0.05, (now - last) / 1000 || 0)); last = now;
            requestAnimationFrame(loop);
        }
        function start() { if (running || reduceMotion) return; running = true; last = performance.now(); requestAnimationFrame(loop); }
        function stop() { running = false; }

        window.addEventListener('resize', resize);
        window.addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth; ty = e.clientY / innerHeight; }, { passive: true });
        document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
        window.addEventListener('scroll', function () { if (reduceMotion) frame(0); else if (!running && !document.hidden && scrollY <= innerHeight) start(); }, { passive: true });
        resize(); start();
    })();

    // -------------------------------------------------------- UI behaviours
    var nav = $('#nav');
    function onScroll() { nav.classList.toggle('scrolled', scrollY > 24); }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    // spotlight hover on cards
    $$('.card').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
            var r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    // scroll reveal
    var reveals = $$('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        reveals.forEach(function (r) { io.observe(r); });
    } else { reveals.forEach(function (r) { r.classList.add('in'); }); }

    // smooth hand-off into the player
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[data-enter]');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || reduceMotion) return;
        e.preventDefault();
        document.body.classList.add('leaving');
        setTimeout(function () { location.href = a.href; }, 420);
    });
    // bfcache: coming back via the browser's back button should not stay faded out
    window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });
})();
