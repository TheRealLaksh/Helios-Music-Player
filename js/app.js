/* ==========================================================================
   Helios — boot, animation loop, keyboard, Media Session
   ========================================================================== */
(function () {
    'use strict';
    var H = window.Helios, util = H.util, player = H.player, engine = H.engine, ui = H.ui, bus = H.bus, lib = H.lib;
    var audio = engine.audio;
    var $ = function (s) { return document.querySelector(s); };

    // ----------------------------------------------------------- Media Session
    var ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
    function abs(p) { return new URL(p, location.href).href; }
    function updateMediaMetadata(song) {
        if (!ms || !window.MediaMetadata) return;
        try {
            ms.metadata = new MediaMetadata({
                title: song.displayName, artist: song.artist, album: lib.langName(song.playlist) + ' · Helios',
                artwork: [{ src: abs(lib.thumb(song)), sizes: '360x360', type: 'image/jpeg' }, { src: abs(lib.cover(song)), sizes: '512x512', type: 'image/jpeg' }]
            });
        } catch (e) { /* ignore */ }
    }
    if (ms) {
        var set = function (a, fn) { try { ms.setActionHandler(a, fn); } catch (e) { /* unsupported action */ } };
        set('play', function () { engine.play(); });
        set('pause', function () { engine.pause(); });
        set('previoustrack', function () { player.prev(); });
        set('nexttrack', function () { player.next(false); });
        set('seekbackward', function (d) { engine.seek(audio.currentTime - (d.seekOffset || 10)); });
        set('seekforward', function (d) { engine.seek(audio.currentTime + (d.seekOffset || 10)); });
        set('seekto', function (d) { engine.seek(d.seekTime); });
        set('stop', function () { engine.pause(); engine.seek(0); });
        var lastPos = 0;
        var syncPos = function () {
            ms.playbackState = engine.playing ? 'playing' : 'paused';
            if (!isFinite(audio.duration) || !ms.setPositionState) return;
            try { ms.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate || 1, position: Math.min(audio.currentTime, audio.duration) }); } catch (e) { /* ignore */ }
        };
        bus.on('audio:play', syncPos); bus.on('audio:pause', syncPos); bus.on('audio:loadedmetadata', syncPos); bus.on('audio:ratechange', syncPos);
        bus.on('audio:timeupdate', function () { var n = Date.now(); if (n - lastPos > 1500) { lastPos = n; syncPos(); } });
    }

    // ------------------------------------------------------------- boot order
    bus.on('track', function (song) { H.ambience.setTrack(song); updateMediaMetadata(song); });
    player.restore();
    H.views.render();
    if (H.store.get('queueOpen', false) && window.matchMedia('(min-width: 1100px)').matches) ui.toggleQueue(true);
    requestAnimationFrame(function () { document.body.classList.add('ready'); });

    // --------------------------------------------------------- animation loop
    var last = performance.now();
    function loop(now) {
        requestAnimationFrame(loop);
        if (document.hidden) { last = now; return; }
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        var lv = engine.analyze();
        H.ambience.frame(lv, dt);
        ui.frame(lv, dt);
    }
    requestAnimationFrame(loop);

    // ---------------------------------------------------------------- keyboard
    var gPending = 0;
    function cycleAmbience() {
        var m = H.ambience.modes, i = m.findIndex(function (x) { return x.id === H.ambience.mode; });
        var n = m[(i + 1) % m.length]; H.ambience.setMode(n.id); ui.toast('Ambience: ' + n.name, { icon: 'sun' });
    }
    function nudgeVolume(d) { engine.setVolume((audio.muted ? 0 : audio.volume) + d); }

    document.addEventListener('keydown', function (e) {
        if (e.defaultPrevented) return;
        var t = e.target, tag = t.tagName, type = t.type;
        var typing = (tag === 'INPUT' && ['range', 'checkbox', 'radio', 'button'].indexOf(type) < 0) || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
        var k = e.key;

        if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'k') { e.preventDefault(); ui.isOpen($('#palette')) ? ui.closePalette() : ui.openPalette(); return; }
        if (k === 'Escape') {
            if (ui.menuOpen()) { ui.closeMenu(); return; }
            if (ui.closeTop()) e.preventDefault();
            return;
        }
        if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
        if (ui.isOpen($('#palette')) || ui.isOpen($('#shortcuts'))) return;

        // let a keyboard-focused button/link keep its native Space/Enter behaviour
        var native = (tag === 'BUTTON' || tag === 'A' || tag === 'SELECT' || t.getAttribute('role') === 'button' || t.getAttribute('role') === 'radio' || t.getAttribute('role') === 'menuitem') && t.matches(':focus-visible');
        if ((k === ' ' || k === 'Enter') && native) return;
        var onRange = tag === 'INPUT' && type === 'range';

        if (gPending) { gPending = 0; if (k.toLowerCase() === 'h') { location.hash = '#/home'; e.preventDefault(); return; } }

        switch (k) {
            case ' ': e.preventDefault(); player.toggle(); break;
            case 'ArrowRight': if (onRange) return; e.preventDefault(); e.shiftKey ? player.next(false) : engine.seek(audio.currentTime + 5); break;
            case 'ArrowLeft': if (onRange) return; e.preventDefault(); e.shiftKey ? player.prev() : engine.seek(audio.currentTime - 5); break;
            case 'ArrowUp': if (onRange) return; e.preventDefault(); nudgeVolume(0.05); break;
            case 'ArrowDown': if (onRange) return; e.preventDefault(); nudgeVolume(-0.05); break;
            case 'n': case 'N': player.next(false); break;
            case 'p': case 'P': player.prev(); break;
            case 'm': case 'M': engine.toggleMute(); break;
            case 's': case 'S': player.toggleShuffle(); ui.toast('Shuffle ' + (player.state.shuffle ? 'on' : 'off'), { icon: 'shuffle' }); break;
            case 'r': case 'R': player.cycleRepeat(); ui.toast('Repeat: ' + ['off', 'all', 'one'][player.state.repeat], { icon: player.state.repeat === 2 ? 'repeat-1' : 'repeat' }); break;
            case 'l': case 'L': ui.toggleLikeCurrent(); break;
            case 'f': case 'F': ui.toggleNP(); break;
            case 'q': case 'Q': ui.toggleQueue(); break;
            case 't': case 'T': ui.toggleTune(); break;
            case 'v': case 'V': ui.cycleViz(); break;
            case 'a': case 'A': cycleAmbience(); break;
            case '?': ui.openShortcuts(); break;
            case '/': e.preventDefault(); H.views.focusSearch(); break;
            case 'g': case 'G': gPending = setTimeout(function () { gPending = 0; }, 900); break;
            default:
                if (/^[0-9]$/.test(k) && isFinite(audio.duration)) engine.seek(audio.duration * (+k / 10));
        }
    });

    // restore "Playing" title when the tab regains focus & keep AudioContext alive
    document.addEventListener('visibilitychange', function () { if (!document.hidden && engine.playing) engine.ensureGraph(); });

    // global error safety-net: never leave the user staring at a dead UI
    window.addEventListener('error', function (e) { console.error('[helios]', e.message); });
})();
