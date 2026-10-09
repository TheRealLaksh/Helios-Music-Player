/* ==========================================================================
   Helios — store: persistence, library indexes, search, tiny event bus
   Exposes window.Helios = { bus, store, lib, util }
   ========================================================================== */
(function () {
    'use strict';
    var H = window.Helios = window.Helios || {};
    var LIB = window.HELIOS_LIBRARY;

    // ------------------------------------------------------------------ bus
    var handlers = {};
    H.bus = {
        on: function (evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); return fn; },
        emit: function (evt, a, b) { (handlers[evt] || []).slice().forEach(function (fn) { try { fn(a, b); } catch (e) { console.error('[bus]', evt, e); } }); }
    };

    // ---------------------------------------------------------------- utils
    var util = H.util = {
        esc: function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
        fmt: function (t) {
            if (!isFinite(t) || t < 0) t = 0;
            var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
            return h ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') : m + ':' + String(s).padStart(2, '0');
        },
        norm: function (s) {
            return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
        },
        rgb: function (c) { return c[0] + ' ' + c[1] + ' ' + c[2]; },
        clamp: function (v, a, b) { return Math.min(b, Math.max(a, v)); },
        lerp: function (a, b, t) { return a + (b - a) * t; },
        debounce: function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; },
        shuffle: function (arr, rnd) {
            rnd = rnd || Math.random;
            var a = arr.slice();
            for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
            return a;
        },
        seeded: function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; },
        icon: function (id, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
    };

    // -------------------------------------------------------------- storage
    var PFX = 'helios:v2:';
    var memory = {};
    var store = H.store = {
        get: function (k, def) {
            try { var v = localStorage.getItem(PFX + k); return v === null ? def : JSON.parse(v); }
            catch (e) { return k in memory ? memory[k] : def; }
        },
        set: function (k, v) {
            memory[k] = v;
            try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { /* private mode / quota */ }
        }
    };

    // One-time migration from the original (v1) keys so nobody loses their likes
    (function migrate() {
        if (store.get('migrated', false)) return;
        try {
            var old = localStorage.getItem('helios-likedSongs');
            if (old) store.set('liked', JSON.parse(old).map(function (s) { return s.name; }));
            var vol = localStorage.getItem('helios-volume'); if (vol !== null) store.set('volume', parseFloat(vol));
            if (localStorage.getItem('helios-shuffle') === 'true') store.set('shuffle', true);
            if (localStorage.getItem('helios-repeat') === 'true') store.set('repeat', 2);
            var bg = localStorage.getItem('helios-background');
            if (bg) store.set('ambience', { aurora: 'aurora', vinyl: 'vinyl', vortex: 'vortex', off: 'art' }[bg] || 'art');
            var idx = localStorage.getItem('helios-lastSongIndex');
            if (idx !== null && LIB.songs[parseInt(idx, 10)]) store.set('last', LIB.songs[parseInt(idx, 10)].name);
        } catch (e) { /* ignore */ }
        store.set('migrated', true);
    })();

    // ------------------------------------------------------------- library
    var songs = LIB.songs, byName = Object.create(null), indexOf = Object.create(null);   // null-prototype: URL-derived keys like "__proto__" must miss
    songs.forEach(function (s, i) { byName[s.name] = s; indexOf[s.name] = i; });

    var langName = Object.create(null);
    LIB.playlists.forEach(function (p) { langName[p.id] = p.name; });

    // Artists (split credits like "A, B & C" into individual artists)
    var artistMap = Object.create(null);
    function splitArtists(str) {
        return str.split(/,| & | ft\.? | feat\.? /i).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    songs.forEach(function (s) {
        s.artists = splitArtists(s.artist);
        s.hay = util.norm(s.displayName + ' ' + s.artist + ' ' + langName[s.playlist]);
        s.titleNorm = util.norm(s.displayName);
        s.artists.forEach(function (a) {
            var key = util.norm(a);
            var e = artistMap[key] || (artistMap[key] = { name: a, key: key, songs: [] });
            e.songs.push(s);
        });
    });
    var artistList = Object.keys(artistMap).map(function (k) { return artistMap[k]; })
        .sort(function (a, b) { return b.songs.length - a.songs.length || a.name.localeCompare(b.name); });

    function score(s, qn, tokens) {
        // lower is not better: higher score is a better match
        if (!qn) return 0;
        var sc = 0;
        if (s.titleNorm === qn) sc += 120;
        else if (s.titleNorm.indexOf(qn) === 0) sc += 90;
        else if (s.titleNorm.indexOf(' ' + qn) > -1) sc += 70;
        else if (s.titleNorm.indexOf(qn) > -1) sc += 55;
        var allTok = true;
        tokens.forEach(function (t) {
            if (s.hay.indexOf(t) === -1) { allTok = false; return; }
            sc += s.titleNorm.indexOf(t) > -1 ? 14 : 9;
            if (s.hay.indexOf(' ' + t) > -1 || s.hay.indexOf(t) === 0) sc += 4;
        });
        if (!allTok) return sc >= 55 ? sc : 0;
        return sc;
    }

    H.lib = {
        songs: songs,
        playlists: LIB.playlists,
        byName: function (n) { return byName[n]; },
        indexOf: function (n) { return indexOf[n]; },
        song: function (i) { return songs[i]; },
        langName: function (id) { return langName[id]; },
        playlist: function (id) { return LIB.playlists.filter(function (p) { return p.id === id; })[0]; },
        artists: artistList,
        artist: function (key) { return artistMap[key]; },
        thumb: function (s) { return 'Assets/thumbs/' + s.cover + '.jpg'; },
        cover: function (s) { return 'Assets/images/' + s.cover + '.jpg'; },
        audio: function (s) { return 'Assets/music/' + s.name + '.mp3'; },
        search: function (q, lang) {
            var qn = util.norm(q), tokens = qn ? qn.split(' ') : [];
            var res = [];
            songs.forEach(function (s) {
                if (lang && lang !== 'all' && s.playlist !== lang) return;
                var sc = score(s, qn, tokens);
                if (sc > 0) res.push({ song: s, score: sc });
            });
            res.sort(function (a, b) { return b.score - a.score || a.song.displayName.localeCompare(b.song.displayName); });
            var artists = artistList.filter(function (a) { return qn && (a.key.indexOf(qn) > -1 || tokens.every(function (t) { return a.key.indexOf(t) > -1; })); }).slice(0, 8);
            return { songs: res.map(function (r) { return r.song; }), artists: artists };
        }
    };
})();
