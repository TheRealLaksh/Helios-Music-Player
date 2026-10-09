/* ==========================================================================
   Helios — audio engine
   <audio> element + Web Audio graph (3-band EQ → master gain → analyser),
   real waveform decoding, frequency-band analysis, speed, sleep timer.
   ========================================================================== */
(function () {
    'use strict';
    var H = window.Helios, util = H.util, store = H.store, bus = H.bus;
    var audio = document.getElementById('audio');

    var AC = window.AudioContext || window.webkitAudioContext;
    // createMediaElementSource() outputs silence for file:// origins, so skip the graph there.
    var canGraph = !!AC && location.protocol !== 'file:';
    var ctx = null, nodes = {}, analyser = null;

    var PRESETS = [
        { id: 'flat', name: 'Flat', g: [0, 0, 0] },
        { id: 'bass', name: 'Bass boost', g: [7, 0, -1] },
        { id: 'vocal', name: 'Vocal', g: [-2, 4, 2] },
        { id: 'bright', name: 'Bright', g: [-1, 0, 6] },
        { id: 'warm', name: 'Warm', g: [3, 1, -3] },
        { id: 'late', name: 'Late night', g: [2, -2, -4] },
        { id: 'loud', name: 'Loudness', g: [5, -1, 4] }
    ];
    var SPEEDS = [0.75, 0.9, 1, 1.1, 1.25, 1.5];

    var state = {
        speed: store.get('speed', 1),
        eq: store.get('eq', { preset: 'flat', bass: 0, mid: 0, treble: 0 }),
        sleepEndAt: 0, sleepEndOfTrack: false
    };

    // ----------------------------------------------------------- audio graph
    function ensureGraph() {
        if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
        if (!canGraph) return false;
        try {
            ctx = new AC();
            var src = ctx.createMediaElementSource(audio);
            nodes.bass = ctx.createBiquadFilter(); nodes.bass.type = 'lowshelf'; nodes.bass.frequency.value = 110;
            nodes.mid = ctx.createBiquadFilter(); nodes.mid.type = 'peaking'; nodes.mid.frequency.value = 1100; nodes.mid.Q.value = 0.8;
            nodes.treble = ctx.createBiquadFilter(); nodes.treble.type = 'highshelf'; nodes.treble.frequency.value = 5500;
            nodes.master = ctx.createGain();
            analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.78;
            src.connect(nodes.bass); nodes.bass.connect(nodes.mid); nodes.mid.connect(nodes.treble);
            nodes.treble.connect(nodes.master); nodes.master.connect(analyser); analyser.connect(ctx.destination);
            applyEQ();
            return true;
        } catch (e) {
            console.warn('[helios] Web Audio unavailable, continuing without EQ/visualizer', e);
            ctx = null; analyser = null; canGraph = false;
            return false;
        }
    }

    function applyEQ() {
        if (!ctx) return;
        var t = ctx.currentTime;
        nodes.bass.gain.setTargetAtTime(state.eq.bass, t, 0.03);
        nodes.mid.gain.setTargetAtTime(state.eq.mid, t, 0.03);
        nodes.treble.gain.setTargetAtTime(state.eq.treble, t, 0.03);
    }

    // -------------------------------------------------------------- analysis
    var bins = new Uint8Array(512), wave = new Uint8Array(1024).fill(128);
    var out = { bins: bins, wave: wave, level: 0, bass: 0, mid: 0, treble: 0, live: false };
    function smoothTo(cur, target) { return cur + (target - cur) * (target > cur ? 0.55 : 0.1); }

    function analyze() {
        var playing = !audio.paused && !audio.ended;
        var i;
        if (analyser && playing) {
            analyser.getByteFrequencyData(bins);
            analyser.getByteTimeDomainData(wave);
            out.live = true;
        } else if (playing && !canGraph) {
            // file:// fallback: gentle synthetic motion so the UI isn't dead (not real audio data)
            var t = performance.now() / 1000;
            for (i = 0; i < bins.length; i++) {
                var f = 1 - i / bins.length;
                bins[i] = Math.max(0, (Math.sin(t * 2.1 + i * 0.13) * 0.5 + 0.5) * 190 * f * f + (Math.sin(t * 5.3 + i * 0.4) * 0.5 + 0.5) * 40 * f);
            }
            out.live = false;
        } else {
            for (i = 0; i < bins.length; i++) bins[i] *= 0.88;      // decay when paused
            for (i = 0; i < wave.length; i++) wave[i] = 128 + (wave[i] - 128) * 0.9;
        }
        function band(a, b) { var s = 0; for (var k = a; k < b; k++) s += bins[k]; return s / (b - a) / 255; }
        out.bass = smoothTo(out.bass, band(1, 7));
        out.mid = smoothTo(out.mid, band(7, 60));
        out.treble = smoothTo(out.treble, band(60, 200));
        out.level = smoothTo(out.level, (out.bass * 1.2 + out.mid + out.treble * 0.8) / 3);
        return out;
    }

    // -------------------------------------------------------------- waveform
    var WAVE_N = 240, wcache = new Map(), wAbort = null, wToken = 0;

    function fakePeaks(song) {
        var rnd = util.seeded(Array.prototype.reduce.call(song.name, function (a, c) { return a * 31 + c.charCodeAt(0); }, 7) % 2147483646 + 1);
        var p = new Float32Array(WAVE_N), v = 0.5;
        for (var i = 0; i < WAVE_N; i++) {
            v += (rnd() - 0.5) * 0.28; v = util.clamp(v, 0.18, 1);
            var pos = i / WAVE_N, env = Math.min(1, pos * 9) * Math.min(1, (1 - pos) * 7);
            p[i] = (0.14 + v * 0.86) * (0.35 + 0.65 * env);
        }
        p.real = false;
        return p;
    }

    function computePeaks(buf) {
        var chs = Math.min(2, buf.numberOfChannels), len = buf.length, size = Math.floor(len / WAVE_N);
        var p = new Float32Array(WAVE_N), max = 0, stride = Math.max(1, Math.floor(size / 220));
        var data = []; for (var c = 0; c < chs; c++) data.push(buf.getChannelData(c));
        for (var i = 0; i < WAVE_N; i++) {
            var start = i * size, sum = 0, n = 0;
            for (var j = 0; j < size; j += stride) {
                var v = 0; for (c = 0; c < chs; c++) v += Math.abs(data[c][start + j]);
                sum += (v / chs) * (v / chs); n++;
            }
            p[i] = Math.sqrt(sum / (n || 1));
            if (p[i] > max) max = p[i];
        }
        for (i = 0; i < WAVE_N; i++) p[i] = Math.pow(p[i] / (max || 1), 0.75) * 0.92 + 0.06;
        p.real = true;
        return p;
    }

    /** Returns peaks immediately (placeholder or cached) and calls cb again when the real ones arrive. */
    function loadWaveform(song, cb) {
        var url = H.lib.audio(song);
        var my = ++wToken;                                   // any newer request (even a cache hit) invalidates older ones
        if (wAbort) { wAbort.abort(); wAbort = null; }
        if (wcache.has(url)) { var hit = wcache.get(url); wcache.delete(url); wcache.set(url, hit); cb(hit); return; }
        cb(fakePeaks(song));
        var conn = navigator.connection;           // decoding means downloading the file a second time: skip when data is precious
        if (conn && (conn.saveData || conn.type === 'cellular' || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || ''))) return;
        if (location.protocol === 'file:' || !AC || !window.fetch) return;
        wAbort = window.AbortController ? new AbortController() : null;
        // small delay so the audio element gets bandwidth first
        setTimeout(function () {
            if (my !== wToken) return;
            fetch(url, wAbort ? { signal: wAbort.signal } : undefined)
                .then(function (r) { return r.arrayBuffer(); })
                .then(function (ab) {
                    var Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
                    var dec = new Off(1, 1, 44100);
                    return new Promise(function (res, rej) { dec.decodeAudioData(ab, res, rej); });
                })
                .then(function (buf) {
                    var peaks = computePeaks(buf);
                    wcache.set(url, peaks);
                    if (wcache.size > 12) wcache.delete(wcache.keys().next().value);
                    if (my === wToken) cb(peaks);
                })
                .catch(function () { /* aborted or undecodable: placeholder stays */ });
        }, 350);
    }

    // ----------------------------------------------------------------- speed
    function setSpeed(v) {
        state.speed = v; store.set('speed', v);
        audio.defaultPlaybackRate = v; audio.playbackRate = v;
        audio.preservesPitch = true; audio.mozPreservesPitch = true; audio.webkitPreservesPitch = true;
        bus.emit('tune');
    }

    // ------------------------------------------------------------------- EQ
    function setEQ(patch, fromPreset) {
        Object.keys(patch).forEach(function (k) { state.eq[k] = patch[k]; });
        if (!fromPreset) {
            var match = PRESETS.filter(function (p) { return p.g[0] === state.eq.bass && p.g[1] === state.eq.mid && p.g[2] === state.eq.treble; })[0];
            state.eq.preset = match ? match.id : 'custom';
        }
        store.set('eq', state.eq); applyEQ(); bus.emit('tune');
    }
    function setPreset(id) {
        var p = PRESETS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
        state.eq = { preset: id, bass: p.g[0], mid: p.g[1], treble: p.g[2] };
        store.set('eq', state.eq); applyEQ(); bus.emit('tune');
    }

    // ----------------------------------------------------------- sleep timer
    var sleepTimer = null, baseVol = null;
    function restoreFade() {
        if (ctx && nodes.master) nodes.master.gain.setTargetAtTime(1, ctx.currentTime, 0.05);
        else if (baseVol !== null) audio.volume = baseVol;
        baseVol = null;
    }
    function clearSleep(silent) {
        clearInterval(sleepTimer); sleepTimer = null;
        state.sleepEndAt = 0; state.sleepEndOfTrack = false;
        restoreFade();
        if (!silent) bus.emit('sleep');
    }
    function setSleep(mode) {
        clearSleep(true);
        if (mode === 'track') { state.sleepEndOfTrack = true; }
        else if (mode > 0) {
            state.sleepEndAt = Date.now() + mode * 60000;
            sleepTimer = setInterval(function () {
                var left = state.sleepEndAt - Date.now();
                if (left <= 0) { audio.pause(); clearSleep(); bus.emit('sleep:done'); return; }
                if (left < 15000) {                              // gentle 15 s fade-out
                    var g = left / 15000;
                    if (ctx && nodes.master) nodes.master.gain.setTargetAtTime(g, ctx.currentTime, 0.2);
                    else { if (baseVol === null) baseVol = audio.volume; audio.volume = baseVol * g; }
                }
                bus.emit('sleep');
            }, 500);
        }
        bus.emit('sleep');
    }

    // ----------------------------------------------------------- volume/play
    function setVolume(v) {
        v = util.clamp(v, 0, 1); audio.volume = v; baseVol = null;
        if (v > 0 && audio.muted) audio.muted = false;
        store.set('volume', v); bus.emit('volume');
    }
    function toggleMute() { audio.muted = !audio.muted; bus.emit('volume'); }

    function load(song) { audio.src = H.lib.audio(song); audio.defaultPlaybackRate = state.speed; audio.playbackRate = state.speed; }
    function play() {
        ensureGraph();
        var p = audio.play();
        return p && p.catch ? p.catch(function (e) { if (e && e.name !== 'AbortError') bus.emit('audio:blocked', e); }) : p;
    }
    function pause() { audio.pause(); }

    // events
    ['play', 'pause', 'ended', 'loadedmetadata', 'timeupdate', 'waiting', 'playing', 'canplay', 'durationchange', 'error', 'ratechange'].forEach(function (e) {
        audio.addEventListener(e, function () { bus.emit('audio:' + e); });
    });

    audio.volume = util.clamp(store.get('volume', 1), 0, 1);
    setSpeed(state.speed);

    H.engine = {
        audio: audio, state: state, PRESETS: PRESETS, SPEEDS: SPEEDS,
        get canGraph() { return canGraph; },
        load: load, play: play, pause: pause,
        seek: function (t) { if (isFinite(audio.duration)) audio.currentTime = util.clamp(t, 0, audio.duration); },
        get playing() { return !audio.paused && !audio.ended; },
        analyze: analyze, loadWaveform: loadWaveform, fakePeaks: fakePeaks,
        setSpeed: setSpeed, setEQ: setEQ, setPreset: setPreset,
        setSleep: setSleep, clearSleep: clearSleep,
        setVolume: setVolume, toggleMute: toggleMute,
        ensureGraph: ensureGraph
    };
})();
