/* ==========================================================================
   Helios — playback controller
   Owns the queue model: context (what you're playing from), play order
   (natural or shuffled), a "play next" user queue, repeat/shuffle, likes,
   history. Emits bus events; knows nothing about the DOM.
   ========================================================================== */
(function () {
    'use strict';
    var H = window.Helios, util = H.util, store = H.store, bus = H.bus, lib = H.lib, engine = H.engine;

    var st = {
        current: null,
        ctx: { id: 'all', name: 'Library', ids: lib.songs.map(function (s) { return s.name; }) },
        order: [], pos: 0,
        userQueue: [],
        shuffle: !!store.get('shuffle', false),
        repeat: store.get('repeat', 0),                       // 0 off · 1 all · 2 one
        liked: store.get('liked', []),
        recent: store.get('recent', []),
        plays: store.get('plays', {})
    };
    // sanitise anything persisted from older builds
    st.liked = st.liked.filter(function (n) { return lib.byName(n); });
    st.recent = st.recent.filter(function (n) { return lib.byName(n); });
    st.userQueue = (store.get('uq', []) || []).filter(function (n) { return lib.byName(n); });

    // ---------------------------------------------------------------- contexts
    function dayKey() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
    function mixIds() {
        var rnd = util.seeded(dayKey() % 2147483646 + 1);
        return util.shuffle(lib.songs, rnd).slice(0, 20).map(function (s) { return s.name; });
    }
    function contextFrom(id, extra) {
        var m;
        if (id === 'liked') return { id: id, name: 'Liked Songs', ids: st.liked.slice().reverse() };
        if (id === 'recent') return { id: id, name: 'Recently played', ids: st.recent.slice() };
        if (id === 'mix') return { id: id, name: 'Daily mix', ids: mixIds() };
        if ((m = /^playlist:(.+)$/.exec(id))) {
            var p = lib.playlist(m[1]);
            if (p) return { id: id, name: p.name, ids: p.songs.map(function (s) { return s.name; }) };
        }
        if ((m = /^artist:(.+)$/.exec(id))) {
            var a = lib.artist(m[1]);
            if (a) return { id: id, name: a.name, ids: a.songs.map(function (s) { return s.name; }) };
        }
        if (extra && extra.ids) return { id: id, name: extra.name || 'Search', ids: extra.ids.slice() };
        return { id: 'all', name: 'Library', ids: lib.songs.map(function (s) { return s.name; }) };
    }

    function buildOrder(startName) {
        var ids = st.ctx.ids.slice();
        if (st.shuffle) {
            var rest = util.shuffle(ids.filter(function (n) { return n !== startName; }));
            st.order = ids.indexOf(startName) > -1 ? [startName].concat(rest) : rest;
        } else st.order = ids;
        st.pos = Math.max(0, st.order.indexOf(startName));
    }

    function persist() {
        store.set('ctx', /^(search|list):|^all$/.test(st.ctx.id) ? { id: st.ctx.id, name: st.ctx.name, ids: st.ctx.ids } : { id: st.ctx.id });
        store.set('uq', st.userQueue);
        store.set('shuffle', st.shuffle);
        store.set('repeat', st.repeat);
    }

    // -------------------------------------------------------------------- core
    function start(name, opts) {
        opts = opts || {};
        var song = lib.byName(name); if (!song) return;
        st.current = song;
        engine.load(song);
        store.set('last', name);
        if (!opts.restore) store.set('position', 0);          // never let an old offset leak onto a new track
        bus.emit('track', song);
        if (opts.autoplay !== false) {
            engine.play();
            st.recent = [name].concat(st.recent.filter(function (n) { return n !== name; })).slice(0, 50);
            st.plays[name] = (st.plays[name] || 0) + 1;
            store.set('recent', st.recent); store.set('plays', st.plays);
            bus.emit('recent');
        }
        bus.emit('queue');
    }

    function playContext(ctx, name, opts) {
        opts = opts || {};
        if (opts.shuffle !== undefined && opts.shuffle !== st.shuffle) { st.shuffle = opts.shuffle; bus.emit('modes'); }
        if (!ctx.ids.length) return;
        st.ctx = ctx;
        if (!name) name = st.shuffle ? ctx.ids[Math.floor(Math.random() * ctx.ids.length)] : ctx.ids[0];
        buildOrder(name); persist(); start(name);
    }

    function toggle() {
        if (!st.current) return;
        if (engine.playing) engine.pause();
        else engine.play();
    }

    function next(auto) {
        if (!st.current) return;
        if (auto && engine.state.sleepEndOfTrack) { engine.clearSleep(); engine.pause(); bus.emit('sleep:done'); return; }
        if (auto && st.repeat === 2) { engine.seek(0); engine.play(); return; }
        if (st.userQueue.length) { var n = st.userQueue.shift(); persist(); start(n); return; }
        var np = st.pos + 1;
        if (np >= st.order.length) {
            if (auto && st.repeat === 0) {
                engine.pause(); engine.seek(0); bus.emit('queue:end');
                return;
            }
            if (st.shuffle) { buildOrder(st.current.name); np = st.order.length > 1 ? 1 : 0; }   // reshuffle, keep going
            else np = 0;
        }
        st.pos = np; persist(); start(st.order[np]);
    }

    function prev() {
        if (!st.current) return;
        if (engine.audio.currentTime > 3 || st.order.length < 2) { engine.seek(0); return; }
        st.pos = (st.pos - 1 + st.order.length) % st.order.length;
        persist(); start(st.order[st.pos]);
    }

    function toggleShuffle() {
        st.shuffle = !st.shuffle;
        if (st.current) buildOrder(st.current.name);
        persist(); bus.emit('modes'); bus.emit('queue');
    }
    function cycleRepeat() { st.repeat = (st.repeat + 1) % 3; persist(); bus.emit('modes'); }

    // ------------------------------------------------------------------- queue
    function enqueue(name, asNext) {
        if (!lib.byName(name)) return;
        if (asNext) st.userQueue.unshift(name); else st.userQueue.push(name);
        persist(); bus.emit('queue'); bus.emit('queue:added', { name: name, next: !!asNext });
    }
    function removeFromQueue(i) { st.userQueue.splice(i, 1); persist(); bus.emit('queue'); }
    function moveInQueue(from, to) {
        if (from === to || from < 0 || to < 0 || from >= st.userQueue.length || to >= st.userQueue.length) return;
        st.userQueue.splice(to, 0, st.userQueue.splice(from, 1)[0]); persist(); bus.emit('queue');
    }
    function clearQueue() { st.userQueue = []; persist(); bus.emit('queue'); }
    function playFromQueue(i) {
        var n = st.userQueue[i]; if (!n) return;
        st.userQueue.splice(0, i + 1); persist(); start(n);
    }
    function playUpcoming(i) {                                  // i is index within upcoming()
        var p = st.pos + 1 + i; if (p >= st.order.length) return;
        st.pos = p; persist(); start(st.order[p]);
    }
    function upcoming(limit) { return st.order.slice(st.pos + 1, st.pos + 1 + (limit || 30)).map(lib.byName); }

    // ------------------------------------------------------------------- likes
    function isLiked(name) { return st.liked.indexOf(name) > -1; }
    function toggleLike(name) {
        name = name || (st.current && st.current.name); if (!name) return false;
        var i = st.liked.indexOf(name);
        if (i > -1) st.liked.splice(i, 1); else st.liked.push(name);
        store.set('liked', st.liked);
        bus.emit('likes', { name: name, liked: i === -1 });
        return i === -1;
    }

    // ----------------------------------------------------------------- restore
    function restore() {
        var saved = store.get('ctx', null);
        st.ctx = saved ? contextFrom(saved.id, saved) : contextFrom('all');
        var name = store.get('last', null);
        if (!name || !lib.byName(name)) name = st.ctx.ids[0];
        if (st.ctx.ids.indexOf(name) === -1) st.ctx = contextFrom('all');
        buildOrder(name);
        var pos = store.get('position', 0);
        start(name, { autoplay: false, restore: true });
        if (pos > 1) {
            var once = function () {
                engine.audio.removeEventListener('loadedmetadata', once);
                if (st.current && st.current.name === name && pos < engine.audio.duration - 2) engine.audio.currentTime = pos;
            };
            engine.audio.addEventListener('loadedmetadata', once);
        }
    }

    engine.audio.addEventListener('ended', function () { next(true); });
    window.addEventListener('pagehide', function () { if (st.current) store.set('position', engine.audio.currentTime || 0); });
    setInterval(function () { if (st.current && engine.playing) store.set('position', engine.audio.currentTime || 0); }, 4000);

    H.player = {
        state: st, contextFrom: contextFrom, playContext: playContext, restore: restore,
        play: function (name) { start(name); },
        cue: function (name) { st.ctx = contextFrom('all'); buildOrder(name); persist(); start(name, { autoplay: false }); },
        toggle: toggle, next: next, prev: prev,
        toggleShuffle: toggleShuffle, cycleRepeat: cycleRepeat,
        enqueue: enqueue, removeFromQueue: removeFromQueue, moveInQueue: moveInQueue, clearQueue: clearQueue,
        playFromQueue: playFromQueue, playUpcoming: playUpcoming, upcoming: upcoming,
        isLiked: isLiked, toggleLike: toggleLike,
        likedSongs: function () { return st.liked.slice().reverse().map(lib.byName); },
        recentSongs: function () { return st.recent.map(lib.byName); },
        mixSongs: function () { return mixIds().map(lib.byName); },
        topPlayed: function (n) {
            return Object.keys(st.plays).sort(function (a, b) { return st.plays[b] - st.plays[a]; }).slice(0, n).map(lib.byName).filter(Boolean);
        }
    };
})();
