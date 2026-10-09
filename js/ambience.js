/* ==========================================================================
   Helios — theme + ambience
   · Theme: tweens the adaptive accent colour to match the current cover
   · Ambience: five audio-reactive backdrops (Art, Aurora, Vinyl, Vortex, Calm)
   ========================================================================== */
(function () {
    'use strict';
    var H = window.Helios, util = H.util, store = H.store;
    var root = document.documentElement;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ------------------------------------------------------------------ theme
    var cur = [[255, 179, 71], [255, 79, 109]], from = cur, to = cur, t0 = 0, tweening = false;
    var DUR = 700;

    function luminance(c) {
        var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }
    function write(a, b) {
        root.style.setProperty('--accent-rgb', a.map(Math.round).join(' '));
        root.style.setProperty('--accent-2-rgb', b.map(Math.round).join(' '));
        root.style.setProperty('--on-accent', luminance(a) > 0.42 ? '#14100a' : '#ffffff');
    }
    function step(now) {
        var p = util.clamp((now - t0) / DUR, 0, 1), e = 1 - Math.pow(1 - p, 3);
        cur = [0, 1].map(function (k) { return [0, 1, 2].map(function (j) { return util.lerp(from[k][j], to[k][j], e); }); });
        write(cur[0], cur[1]);
        if (p < 1) requestAnimationFrame(step); else tweening = false;
    }
    var Theme = {
        set: function (colors, instant) {
            from = cur; to = colors;
            if (instant || reduced) { cur = colors; write(cur[0], cur[1]); return; }
            t0 = performance.now();
            if (!tweening) { tweening = true; requestAnimationFrame(step); }
        }
    };

    // --------------------------------------------------------------- ambience
    var MODES = [
        { id: 'art', name: 'Art glow', desc: 'Blurred cover, breathes with the bass' },
        { id: 'aurora', name: 'Aurora', desc: 'Drifting light in the cover’s colours' },
        { id: 'vinyl', name: 'Vinyl', desc: 'A record that spins while you listen' },
        { id: 'vortex', name: 'Vortex', desc: 'A tunnel that surges with the beat' },
        { id: 'calm', name: 'Calm', desc: 'Still and quiet, easy on the battery' }
    ];

    var el = document.getElementById('ambience');
    var artA = document.getElementById('amb-art-a'), artB = document.getElementById('amb-art-b');
    var vinylLabel = document.getElementById('vinyl-label'), vinylSvg = document.getElementById('vinyl-svg');
    var canvas = document.getElementById('amb-vortex'), cx = canvas.getContext('2d');
    var mode = store.get('ambience', 'art'), useA = true, W = 0, Hh = 0, phase = 0, spinning = false, lastSong = null;

    function resize() {
        var dpr = Math.min(1.5, window.devicePixelRatio || 1);
        W = canvas.width = Math.round(innerWidth * dpr); Hh = canvas.height = Math.round(innerHeight * dpr);
    }
    window.addEventListener('resize', util.debounce(resize, 120));
    resize();

    function setMode(m) {
        if (!MODES.some(function (x) { return x.id === m; })) m = 'art';
        mode = m; store.set('ambience', m);
        el.setAttribute('data-mode', m);
        document.body.setAttribute('data-ambience', m);
        H.bus.emit('ambience', m);
    }

    function setTrack(song) {
        lastSong = song;
        var url = 'url("' + H.lib.thumb(song) + '")';
        var show = useA ? artB : artA, hide = useA ? artA : artB;
        show.style.backgroundImage = url; show.classList.add('is-on'); hide.classList.remove('is-on');
        useA = !useA;
        vinylLabel.setAttribute('href', H.lib.thumb(song));
        Theme.set(song.colors);
    }

    function setPlaying(p) {
        spinning = p;
        vinylSvg.classList.toggle('spinning', p);
    }

    var lvlWritten = -1;
    /** Called every animation frame with the analysed levels. */
    function frame(lv, dt) {
        if (reduced) return;
        var lvl = Math.round(lv.level * 100) / 100;
        if (lvl !== lvlWritten) {
            lvlWritten = lvl;
            el.style.setProperty('--lvl', lvl);
            el.style.setProperty('--bass', Math.round(lv.bass * 100) / 100);
        }
        if (mode === 'vortex') drawVortex(lv, dt);
    }

    function drawVortex(lv, dt) {
        var a = cur[0], b = cur[1], r = Math.min(W, Hh);
        cx.clearRect(0, 0, W, Hh);
        phase += (0.035 + lv.level * 0.55 + lv.bass * 0.25) * dt;
        var x0 = W / 2, y0 = Hh / 2, maxR = Math.hypot(W, Hh) * 0.62, rings = 26, sides = 7;
        cx.lineJoin = 'round';
        for (var k = 0; k < rings; k++) {
            var z = ((k / rings) + phase) % 1;
            var rad = Math.pow(z, 2.3) * maxR + r * 0.02;
            var rot = phase * 1.6 + z * (1.2 + lv.mid * 2.4);
            var alpha = Math.sin(z * Math.PI) * (0.22 + lv.level * 0.55);
            var c = k % 2 ? a : b;
            cx.strokeStyle = 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + alpha.toFixed(3) + ')';
            cx.lineWidth = (0.6 + z * 3.2) * (1 + lv.bass * 1.4);
            cx.beginPath();
            for (var s = 0; s <= sides; s++) {
                var ang = rot + (s / sides) * Math.PI * 2;
                var px = x0 + Math.cos(ang) * rad, py = y0 + Math.sin(ang) * rad;
                if (s === 0) cx.moveTo(px, py); else cx.lineTo(px, py);
            }
            cx.stroke();
        }
        // radial spokes
        cx.strokeStyle = 'rgba(' + Math.round(a[0]) + ',' + Math.round(a[1]) + ',' + Math.round(a[2]) + ',' + (0.07 + lv.treble * 0.3).toFixed(3) + ')';
        cx.lineWidth = 1;
        cx.beginPath();
        for (var i = 0; i < 28; i++) {
            var an = (i / 28) * Math.PI * 2 + phase * 0.8;
            cx.moveTo(x0 + Math.cos(an) * r * 0.05, y0 + Math.sin(an) * r * 0.05);
            cx.lineTo(x0 + Math.cos(an) * maxR, y0 + Math.sin(an) * maxR);
        }
        cx.stroke();
    }

    setMode(mode);

    H.theme = Theme;
    H.ambience = {
        modes: MODES,
        get mode() { return mode; },
        setMode: setMode, setTrack: setTrack, setPlaying: setPlaying, frame: frame,
        get colors() { return cur; }
    };
})();
