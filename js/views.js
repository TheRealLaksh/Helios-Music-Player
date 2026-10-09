/* ==========================================================================
   Helios — router + views
   #/home · #/playlist/<id> · #/liked · #/recent · #/mix · #/artist/<key>
   #/search[/<query>] · #/library · #/track/<name> (shareable deep link)
   ========================================================================== */
(function () {
    'use strict';
    var H = window.Helios, util = H.util, lib = H.lib, player = H.player, engine = H.engine, ui = H.ui, bus = H.bus, store = H.store;
    var esc = util.esc, icon = util.icon, rgb = util.rgb;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

    var viewEl = $('#view'), scroller = $('#scroller'), searchInput = $('#search-input'), searchClear = $('#search-clear');
    var route = { name: 'home', arg: '' };
    var started = false;                  // views ignore player events until the first render
    var viewCtx = null;                   // the list currently on screen {id, name, songs}
    var ctxReg = {};                      // registered ad-hoc contexts (search results, sorted lists)
    var local = { sort: 'default', filter: '', lang: 'all' };
    var mobile = function () { return window.matchMedia('(max-width: 759px)').matches; };

    // ------------------------------------------------------------- contexts
    function hash(str) { var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
    function regCtx(songs, name, prefix) {
        var ids = songs.map(function (s) { return s.name; });
        var id = (prefix || 'list') + ':' + hash(ids.join(','));
        if (!ctxReg[id]) { var keys = Object.keys(ctxReg); if (keys.length > 120) delete ctxReg[keys[0]]; }   // bounded
        ctxReg[id] = { id: id, name: name, ids: ids };
        return id;
    }
    function getCtx(id) { return ctxReg[id] || player.contextFrom(id); }
    function ctxFor(song, list) {
        if (list && list.length) return getCtx(regCtx(list, 'Search results', 'search'));
        if (viewCtx && viewCtx.songs.some(function (s) { return s.name === song.name; })) return getCtx(viewCtx.id);
        var cur = player.state.ctx;
        if (cur.ids.indexOf(song.name) > -1) return cur;
        return getCtx('playlist:' + song.playlist);
    }

    // ------------------------------------------------------------ fragments
    function thumbImg(s, w) { return '<img src="' + lib.thumb(s) + '" alt="" loading="lazy" decoding="async" width="' + (w || 360) + '" height="' + (w || 360) + '">'; }
    function mosaic(songs) {
        var pick = songs.slice(0, 4); while (pick.length && pick.length < 4) pick.push(pick[pick.length % songs.length]);
        return '<span class="mosaic">' + pick.map(function (s) { return thumbImg(s, 160); }).join('') + '</span>';
    }
    function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

    function rowHTML(s, n, ctxId, showLang) {
        var liked = player.isLiked(s.name);
        return '<li class="row" data-song="' + esc(s.name) + '" data-ctx="' + esc(ctxId) + '" data-act="play-song">' +
            '<span class="row-idx"><span class="num">' + n + '</span><span class="row-play">' + icon('play') + '</span><span class="eqbars" aria-hidden="true"><i></i><i></i><i></i></span></span>' +
            '<button class="row-main" type="button" data-act="play-song" aria-label="Play ' + esc(s.displayName) + ' by ' + esc(s.artist) + '">' + thumbImg(s, 88) +
            '<span class="row-txt"><b>' + esc(s.displayName) + '</b><small>' + esc(s.artist) + '</small></span></button>' +
            (showLang ? '<span class="row-lang">' + esc(lib.langName(s.playlist)) + '</span>' : '') +
            '<button class="icon-btn row-like' + (liked ? ' is-liked' : '') + '" type="button" data-act="like" data-like-for="' + esc(s.name) + '" aria-pressed="' + liked + '" aria-label="Like ' + esc(s.displayName) + '">' + icon('heart') + '</button>' +
            '<button class="icon-btn row-more" type="button" data-act="menu" aria-label="More options for ' + esc(s.displayName) + '">' + icon('more') + '</button></li>';
    }
    function cardHTML(s, ctxId) {
        return '<article class="card" data-song="' + esc(s.name) + '" data-ctx="' + esc(ctxId) + '">' +
            '<button class="card-hit" type="button" data-act="play-song" aria-label="Play ' + esc(s.displayName) + ' by ' + esc(s.artist) + '">' +
            '<span class="card-art">' + thumbImg(s) + '<span class="card-play">' + icon('play') + '</span><span class="eqbars" aria-hidden="true"><i></i><i></i><i></i></span></span>' +
            '<b>' + esc(s.displayName) + '</b><small>' + esc(s.artist) + '</small></button></article>';
    }
    function shelf(title, sub, cards, href, extra) {
        return '<section class="shelf"><header class="shelf-head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' +
            '<div class="shelf-nav">' + (href ? '<button class="link-btn" type="button" data-act="go" data-href="' + href + '">Show all</button>' : '') +
            '<button class="icon-btn sn" type="button" data-act="scroll" data-dir="-1" aria-label="Scroll left">' + icon('left') + '</button>' +
            '<button class="icon-btn sn" type="button" data-act="scroll" data-dir="1" aria-label="Scroll right">' + icon('right') + '</button></div></header>' +
            '<div class="hscroll">' + cards + '</div></section>';
    }
    function artistChip(a) {
        return '<button class="artist" type="button" data-act="go" data-href="#/artist/' + encodeURIComponent(a.key) + '">' +
            '<span class="artist-av">' + thumbImg(a.songs[0], 200) + '</span><b>' + esc(a.name) + '</b><small>' + plural(a.songs.length, 'track') + '</small></button>';
    }
    function emptyHTML(ic, title, text, cta) {
        return '<div class="empty">' + '<span class="empty-ic">' + icon(ic) + '</span><h2>' + title + '</h2><p>' + text + '</p>' + (cta || '') + '</div>';
    }
    function greeting() {
        var h = new Date().getHours();
        return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Late night';
    }

    // ================================================================= HOME
    function jumpHTML() {
        var cur = player.state.current; if (!cur) return '';
        var pos = store.get('position', 0), resume = !engine.playing && pos > 5 && cur.name === store.get('last', '');
        return '<section class="jump" style="--j1:' + rgb(cur.colors[0]) + ';--j2:' + rgb(cur.colors[1]) + '" data-song="' + esc(cur.name) + '">' +
            '<div class="jump-bg" style="background-image:url(\'' + lib.thumb(cur) + '\')"></div>' +
            '<img class="jump-cover" src="' + lib.cover(cur) + '" alt="" width="200" height="200">' +
            '<div class="jump-info"><p class="kicker">' + (engine.playing ? 'Now playing' : 'Jump back in') + '</p><h2>' + esc(cur.displayName) + '</h2><p>' + esc(cur.artist) + (resume ? ' · resume at ' + util.fmt(pos) : '') + '</p>' +
            '<div class="jump-actions"><button class="btn-play-lg" type="button" data-act="resume">' + icon(engine.playing ? 'pause' : 'play') + '<span>' + (engine.playing ? 'Pause' : resume ? 'Resume' : 'Play') + '</span></button>' +
            '<button class="btn-pill" type="button" data-act="open-np">' + icon('expand') + '<span>Full screen</span></button></div></div></section>';
    }

    function home() {
        viewCtx = null;
        var h = '<section class="hello"><p class="kicker">' + new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + '</p>' +
            '<h1>' + greeting() + '<em>.</em></h1></section>';

        h += jumpHTML();

        var tiles = [
            { href: '#/liked', ctx: 'liked', name: 'Liked Songs', songs: player.likedSongs(), ic: 'heart' },
            { href: '#/mix', ctx: 'mix', name: 'Daily mix', songs: player.mixSongs(), ic: 'sun' }
        ].concat(lib.playlists.map(function (p) { return { href: '#/playlist/' + p.id, ctx: 'playlist:' + p.id, name: p.name, songs: p.songs }; }))
          .concat([{ href: '#/recent', ctx: 'recent', name: 'Recently played', songs: player.recentSongs(), ic: 'clock' }]);
        h += '<section class="quick" aria-label="Quick access">' + tiles.map(function (t) {
            return '<div class="qtile" data-ctx-play="' + t.ctx + '"><button class="qtile-main" type="button" data-act="go" data-href="' + t.href + '">' +
                (t.ic && !t.songs.length ? '<span class="mosaic mosaic-ic">' + icon(t.ic) + '</span>' : t.songs.length ? mosaic(t.songs) : '<span class="mosaic mosaic-ic">' + icon('heart') + '</span>') +
                '<b>' + t.name + '</b></button>' +
                '<button class="qtile-play" type="button" data-act="play-ctx" data-ctx="' + t.ctx + '" aria-label="Play ' + t.name + '">' + icon('play') + '</button></div>';
        }).join('') + '</section>';

        var mix = player.mixSongs().slice(0, 12);
        h += shelf('Today’s mix', 'A fresh shuffle of the library, new every day', mix.map(function (s) { return cardHTML(s, 'mix'); }).join(''), '#/mix');
        var recent = player.recentSongs().slice(0, 12);
        if (recent.length) h += shelf('Recently played', null, recent.map(function (s) { return cardHTML(s, 'recent'); }).join(''), '#/recent');
        var top = player.topPlayed(10);
        if (top.length >= 3) h += shelf('Your top tracks', 'Most played on this device', top.map(function (s) { return cardHTML(s, regCtx(top, 'Your top tracks')); }).join(''));
        lib.playlists.forEach(function (p) {
            h += shelf(p.name, p.tagline, p.songs.slice(0, 14).map(function (s) { return cardHTML(s, 'playlist:' + p.id); }).join(''), '#/playlist/' + p.id);
        });
        h += '<section class="shelf"><header class="shelf-head"><div><h2>Artists</h2><p>Jump into everything by one voice</p></div></header><div class="hscroll artists">' +
            lib.artists.slice(0, 16).map(artistChip).join('') + '</div></section>';
        return { html: h, title: 'Home' };
    }

    // ============================================================ LIST VIEWS
    var listBase = null;
    function listView(o) {
        listBase = o;
        local.sort = 'default'; local.filter = '';
        viewCtx = { id: o.ctxId, name: o.title, songs: o.songs };
        var cover = o.avatar ? '<span class="ph-avatar">' + thumbImg(o.songs[0], 400) + '</span>'
            : o.songs.length ? '<span class="ph-cover">' + mosaic(o.songs) + '</span>'
            : '<span class="ph-cover ph-cover-ic">' + icon(o.ic || 'heart') + '</span>';
        var c = (o.songs[0] && o.songs[0].colors[0]) || [255, 179, 71];
        var h = '<header class="ph" style="--hero-rgb:' + rgb(c) + '">' + cover +
            '<div class="ph-info"><p class="kicker">' + o.kicker + '</p><h1>' + esc(o.title) + '</h1><p class="ph-sub">' + (o.sub ? esc(o.sub) + ' · ' : '') + '<span id="ph-count">' + plural(o.songs.length, 'track') + '</span></p></div></header>';
        if (!o.songs.length) return { html: h + o.empty, title: o.title };
        h += '<div class="ph-bar"><div class="ph-actions">' +
            '<button class="btn-play-lg" id="ph-play" type="button" data-act="play-ctx" data-ctx="' + esc(o.ctxId) + '" data-ctx-play="' + esc(o.ctxId) + '">' + icon('play') + '<span>Play</span></button>' +
            '<button class="btn-pill" id="ph-shuffle" type="button" data-act="shuffle-ctx" data-ctx="' + esc(o.ctxId) + '">' + icon('shuffle') + '<span>Shuffle</span></button></div>' +
            '<div class="ph-tools"><label class="field">' + icon('search') + '<input id="ph-filter" type="search" placeholder="Filter" aria-label="Filter this list" autocomplete="off"></label>' +
            '<label class="field select"><span class="sr-only">Sort</span><select id="ph-sort" aria-label="Sort"><option value="default">Default order</option><option value="title">Title A–Z</option><option value="artist">Artist A–Z</option></select>' + icon('down') + '</label></div></div>';
        h += '<ul class="rows" id="rows" aria-label="Tracks"></ul>';
        return { html: h, title: o.title, after: paintRows };
    }
    function paintRows() {
        var o = listBase; if (!o) return;
        var list = o.songs.slice(), q = util.norm(local.filter);
        if (q) list = list.filter(function (s) { return s.hay.indexOf(q) > -1; });
        if (local.sort === 'title') list.sort(function (a, b) { return a.displayName.localeCompare(b.displayName); });
        else if (local.sort === 'artist') list.sort(function (a, b) { return a.artist.localeCompare(b.artist) || a.displayName.localeCompare(b.displayName); });
        var custom = !!q || local.sort !== 'default';
        var ctxId = custom ? regCtx(list, o.title, 'list') : o.ctxId;
        if (custom) ctxReg[ctxId].name = o.title;
        viewCtx = { id: ctxId, name: o.title, songs: list };
        $('#rows').innerHTML = list.length ? list.map(function (s, i) { return rowHTML(s, i + 1, ctxId, o.lang); }).join('') : '<li class="rows-empty">No tracks match “' + esc(local.filter) + '”.</li>';
        $('#ph-count').textContent = q ? list.length + ' of ' + plural(o.songs.length, 'track') : plural(o.songs.length, 'track');
        $('#ph-play').dataset.ctx = ctxId; $('#ph-shuffle').dataset.ctx = ctxId; $('#ph-play').dataset.ctxPlay = ctxId;
        ui.highlightCurrent();
    }

    function playlistView(id) {
        var p = lib.playlist(id);
        if (!p) return notFound();
        return listView({ ctxId: 'playlist:' + id, title: p.name, kicker: 'Playlist', sub: p.tagline, songs: p.songs, lang: false });
    }
    function likedView() {
        var songs = player.likedSongs();
        return listView({
            ctxId: 'liked', title: 'Liked Songs', kicker: 'Playlist', sub: 'Everything you’ve hearted', songs: songs, lang: true, ic: 'heart',
            empty: emptyHTML('heart', 'Nothing liked yet', 'Tap the heart on any song and it will land here — saved on this device.', '<a class="btn-play-lg" href="#/home">' + icon('home') + '<span>Find something</span></a>')
        });
    }
    function recentView() {
        var songs = player.recentSongs();
        return listView({
            ctxId: 'recent', title: 'Recently played', kicker: 'History', sub: 'Your last 50 plays', songs: songs, lang: true, ic: 'clock',
            empty: emptyHTML('clock', 'Nothing played yet', 'Hit play on anything and your history starts here.', '<a class="btn-play-lg" href="#/home">' + icon('home') + '<span>Start listening</span></a>')
        });
    }
    function mixView() {
        return listView({ ctxId: 'mix', title: 'Daily mix', kicker: 'Made for today', sub: 'Twenty tracks, reshuffled every day', songs: player.mixSongs(), lang: true });
    }
    function artistView(key) {
        var a = lib.artist(key);
        if (!a) return notFound();
        return listView({ ctxId: 'artist:' + key, title: a.name, kicker: 'Artist', sub: 'In your library', songs: a.songs, lang: true, avatar: true });
    }
    function notFound() {
        viewCtx = null;
        return { html: emptyHTML('search', 'Nothing here', 'That page doesn’t exist in this library.', '<a class="btn-play-lg" href="#/home">' + icon('home') + '<span>Go home</span></a>'), title: 'Not found' };
    }

    // =============================================================== SEARCH
    function searchView(q) {
        viewCtx = null;
        q = (q || '').trim();
        if (!q) {
            var h = '<section class="hello hello-s"><h1>Browse<em>.</em></h1></section><section class="browse">' +
                lib.playlists.map(function (p) {
                    var c1 = p.songs[0].colors[0], c2 = p.songs[3].colors[0];
                    return '<a class="browse-tile" href="#/playlist/' + p.id + '" style="--c1:' + rgb(c1) + ';--c2:' + rgb(c2) + '"><b>' + p.name + '</b><small>' + plural(p.songs.length, 'track') + '</small>' + thumbImg(p.songs[1], 200) + '</a>';
                }).join('') + '</section>' +
                '<section class="shelf"><header class="shelf-head"><div><h2>Popular artists</h2></div></header><div class="hscroll artists">' + lib.artists.slice(0, 14).map(artistChip).join('') + '</div></section>';
            return { html: h, title: 'Search' };
        }
        var res = lib.search(q, local.lang);
        var chips = [['all', 'All']].concat(lib.playlists.map(function (p) { return [p.id, p.name]; })).map(function (c) {
            return '<button class="chip' + (local.lang === c[0] ? ' is-on' : '') + '" type="button" data-act="lang" data-lang="' + c[0] + '" aria-pressed="' + (local.lang === c[0]) + '">' + c[1] + '</button>';
        }).join('');
        var html = '<div class="chips s-chips">' + chips + '</div>';
        if (!res.songs.length && !res.artists.length) {
            return { html: html + emptyHTML('search', 'No results for “' + esc(q) + '”', 'Check the spelling or try an artist, a song title or a language.'), title: 'Search' };
        }
        var ctxId = regCtx(res.songs, 'Search: ' + q, 'search');
        viewCtx = { id: ctxId, name: 'Search', songs: res.songs };
        if (res.songs.length) {
            var top = res.songs[0];
            html += '<div class="s-grid"><section class="s-top"><h2>Top result</h2><div class="top-result" data-song="' + esc(top.name) + '" data-ctx="' + ctxId + '" style="--j1:' + rgb(top.colors[0]) + '">' +
                '<img src="' + lib.cover(top) + '" alt="" width="200" height="200"><b>' + esc(top.displayName) + '</b><small>' + esc(top.artist) + ' · ' + esc(lib.langName(top.playlist)) + '</small>' +
                '<button class="card-play big" type="button" data-act="play-song" aria-label="Play ' + esc(top.displayName) + '">' + icon('play') + '</button></div></section>' +
                '<section class="s-songs"><h2>Songs</h2><ul class="rows">' + res.songs.slice(0, 6).map(function (s, i) { return rowHTML(s, i + 1, ctxId, false); }).join('') + '</ul></section></div>';
            if (res.songs.length > 6) html += '<section class="s-more"><h2>More songs</h2><ul class="rows">' + res.songs.slice(6, 40).map(function (s, i) { return rowHTML(s, i + 7, ctxId, true); }).join('') + '</ul></section>';
        }
        if (res.artists.length) html += '<section class="shelf"><header class="shelf-head"><div><h2>Artists</h2></div></header><div class="hscroll artists">' + res.artists.map(artistChip).join('') + '</div></section>';
        return { html: html, title: 'Search' };
    }

    // ============================================================== LIBRARY
    function libraryView() {
        viewCtx = null;
        var items = [
            { href: '#/liked', name: 'Liked Songs', sub: plural(player.state.liked.length, 'song'), songs: player.likedSongs(), ic: 'heart' },
            { href: '#/mix', name: 'Daily mix', sub: '20 songs · today', songs: player.mixSongs() },
            { href: '#/recent', name: 'Recently played', sub: plural(player.state.recent.length, 'song'), songs: player.recentSongs(), ic: 'clock' }
        ].concat(lib.playlists.map(function (p) { return { href: '#/playlist/' + p.id, name: p.name, sub: 'Playlist · ' + plural(p.songs.length, 'song'), songs: p.songs }; }));
        var h = '<section class="hello hello-s"><h1>Your library<em>.</em></h1></section><ul class="lib-list">' + items.map(function (it) {
            return '<li><a class="lib-item" href="' + it.href + '">' + (it.songs.length ? mosaic(it.songs) : '<span class="mosaic mosaic-ic">' + icon(it.ic || 'heart') + '</span>') +
                '<span class="lib-txt"><b>' + it.name + '</b><small>' + it.sub + '</small></span>' + icon('right') + '</a></li>';
        }).join('') + '</ul>' +
            '<section class="shelf"><header class="shelf-head"><div><h2>Artists</h2></div></header><div class="hscroll artists">' + lib.artists.slice(0, 16).map(artistChip).join('') + '</div></section>';
        return { html: h, title: 'Library' };
    }

    // =============================================================== SIDEBAR
    function renderSide() {
        var st = player.state;
        var items = [
            { r: 'liked', href: '#/liked', name: 'Liked Songs', sub: plural(st.liked.length, 'song'), songs: player.likedSongs(), ic: 'heart' },
            { r: 'mix', href: '#/mix', name: 'Daily mix', sub: 'Fresh today', songs: player.mixSongs() },
            { r: 'recent', href: '#/recent', name: 'Recently played', sub: plural(st.recent.length, 'song'), songs: player.recentSongs(), ic: 'clock' }
        ].concat(lib.playlists.map(function (p) { return { r: 'playlist/' + p.id, href: '#/playlist/' + p.id, name: p.name, sub: 'Playlist · ' + p.songs.length, songs: p.songs, ctx: 'playlist:' + p.id }; }));
        $('#side-lib').innerHTML = items.map(function (it) {
            var active = (route.name + (route.arg && route.name === 'playlist' ? '/' + route.arg : '')) === it.r;
            return '<li><a class="side-item' + (active ? ' is-active' : '') + '" href="' + it.href + '" data-ctx-play="' + (it.ctx || it.r) + '"' + (active ? ' aria-current="page"' : '') + ' title="' + it.name + '">' +
                (it.songs.length ? mosaic(it.songs) : '<span class="mosaic mosaic-ic">' + icon(it.ic || 'heart') + '</span>') +
                '<span class="side-txt"><b>' + it.name + '</b><small>' + it.sub + '</small></span><span class="eqbars" aria-hidden="true"><i></i><i></i><i></i></span></a></li>';
        }).join('');
        ui.highlightCurrent();
    }

    // ================================================================ ROUTER
    function parse() {
        var h = location.hash.replace(/^#\/?/, ''), parts = h.split('/');
        var arg = '';
        try { arg = decodeURIComponent(parts.slice(1).join('/')); } catch (e) { arg = parts.slice(1).join('/'); }
        route = { name: parts[0] || 'home', arg: arg };
    }
    var navGroup = { home: 'home', search: 'search', library: 'library', recent: 'library', mix: 'library', playlist: 'library', artist: 'library', liked: 'liked' };

    function render(keepScroll) {
        started = true;
        parse();
        var res;
        switch (route.name) {
            case 'home': res = home(); break;
            case 'playlist': res = playlistView(route.arg); break;
            case 'liked': res = likedView(); break;
            case 'recent': res = recentView(); break;
            case 'mix': res = mixView(); break;
            case 'artist': res = artistView(route.arg); break;
            case 'search': res = searchView(route.arg); break;
            case 'library': res = libraryView(); break;
            case 'track': {
                var s = lib.byName(route.arg);
                history.replaceState(null, '', '#/home');
                if (s) { player.cue(s.name); ui.toast('Loaded “' + s.displayName + '”. Press play.', { icon: 'play', ms: 4000 }); if (mobile()) ui.openNP(); }
                return render();
            }
            default: res = notFound();
        }
        viewEl.innerHTML = res.html;
        viewEl.classList.remove('enter'); void viewEl.offsetWidth; viewEl.classList.add('enter');
        if (!keepScroll) scroller.scrollTop = 0;
        if (res.after) res.after();
        if (!player.state.current || !engine.playing) document.title = res.title + ' — Helios';
        $$('[data-nav]').forEach(function (a) { var on = a.dataset.nav === navGroup[route.name]; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
        if (route.name !== 'search') { searchInput.value = ''; searchClear.hidden = true; }
        else { if (document.activeElement !== searchInput) searchInput.value = route.arg; searchClear.hidden = !searchInput.value; }
        document.body.setAttribute('data-route', route.name);
        renderSide();
        ui.highlightCurrent();
        ui.closeMenu();
        if (ui.isOpen(document.getElementById('queue-panel')) && window.matchMedia('(max-width: 1099px)').matches) ui.closeLayer(document.getElementById('queue-panel'));
    }

    // =============================================================== actions
    function nameOf(b) { var n = b.dataset.song || (b.closest('[data-song]') || { dataset: {} }).dataset.song; return n; }
    function ctxIdOf(b) { return b.dataset.ctx || (b.closest('[data-ctx]') || { dataset: {} }).dataset.ctx; }

    document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var act = b.dataset.act, name, ctxId;
        switch (act) {
            case 'play-song':
                name = nameOf(b); if (!name) return;
                if (player.state.current && player.state.current.name === name) { player.toggle(); return; }
                ctxId = ctxIdOf(b);
                player.playContext(ctxId ? getCtx(ctxId) : ctxFor(lib.byName(name)), name);
                break;
            case 'play-ctx':
                ctxId = ctxIdOf(b);
                if (player.state.ctx.id === ctxId && player.state.current) { player.toggle(); return; }
                player.playContext(getCtx(ctxId), null, { shuffle: false });
                break;
            case 'shuffle-ctx': player.playContext(getCtx(ctxIdOf(b)), null, { shuffle: true }); break;
            case 'like':
                e.stopPropagation(); name = nameOf(b);
                ui.toast(player.toggleLike(name) ? 'Added to Liked Songs' : 'Removed from Liked Songs', { icon: 'heart' });
                break;
            case 'menu': {
                e.stopPropagation(); name = nameOf(b);
                var r = b.getBoundingClientRect(); ui.openMenu(name, r.right - 240, r.bottom + 6, b);
                break;
            }
            case 'go': location.hash = b.dataset.href.replace(/^#?/, '#'); break;
            case 'resume': player.toggle(); break;
            case 'open-np': ui.openNP(); break;
            case 'lang': local.lang = b.dataset.lang; render(true); break;
            case 'scroll': {
                var sc = b.closest('.shelf').querySelector('.hscroll');
                sc.scrollBy({ left: +b.dataset.dir * sc.clientWidth * 0.85, behavior: 'smooth' });
                break;
            }
        }
    });
    document.addEventListener('contextmenu', function (e) {
        var row = e.target.closest('.row, .card, .qitem'); if (!row || !row.dataset.song) return;
        e.preventDefault(); ui.openMenu(row.dataset.song, e.clientX, e.clientY, null);
    });
    viewEl.addEventListener('input', function (e) {
        if (e.target.id === 'ph-filter') { local.filter = e.target.value; paintRows(); }
    });
    viewEl.addEventListener('change', function (e) { if (e.target.id === 'ph-sort') { local.sort = e.target.value; paintRows(); } });

    // search box
    function onSearchInput() {
        var q = searchInput.value;
        searchClear.hidden = !q;
        var target = q.trim() ? '#/search/' + encodeURIComponent(q.trim()) : '#/search';
        if (route.name === 'search') { history.replaceState(null, '', target); render(true); }
        else location.hash = target;
    }
    searchInput.addEventListener('input', util.debounce(onSearchInput, 90));
    searchInput.addEventListener('focus', function () { if (route.name !== 'search' && mobile()) location.hash = '#/search'; });
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { if (searchInput.value) { searchInput.value = ''; onSearchInput(); } else searchInput.blur(); e.stopPropagation(); }
        if (e.key === 'Enter') searchInput.blur();
    });
    searchClear.addEventListener('click', function () { searchInput.value = ''; onSearchInput(); searchInput.focus(); });
    $('#nav-search').addEventListener('click', focusSearch);
    function focusSearch() {
        if (ui.isOpen($('#np'))) ui.closeNP();
        searchInput.focus(); searchInput.select();
        if (mobile() && route.name !== 'search') location.hash = '#/search';
    }

    // keep views fresh when data changes
    bus.on('likes', function () {
        if (!started) return;
        renderSide();
        if (route.name === 'liked') { var keep = scroller.scrollTop; render(true); scroller.scrollTop = keep; }
    });
    bus.on('recent', function () { if (started) renderSide(); });
    bus.on('track', function () {
        if (!started) return;
        ui.highlightCurrent();
        if (route.name !== 'home') return;
        var j = $('.jump'), fresh = jumpHTML();                      // refresh just the hero card, not the whole page
        if (j && fresh) { var t = document.createElement('div'); t.innerHTML = fresh; j.replaceWith(t.firstChild); }
        else if (!j && fresh) render(true);
    });
    bus.on('audio:play', function () { if (route.name === 'home') updateJump(); });
    bus.on('audio:pause', function () { if (route.name === 'home') updateJump(); });
    function updateJump() {
        var b = $('.jump [data-act="resume"]'); if (!b) return;
        var p = engine.playing; b.innerHTML = icon(p ? 'pause' : 'play') + '<span>' + (p ? 'Pause' : 'Play') + '</span>';
        var k = $('.jump .kicker'); if (k) k.textContent = p ? 'Now playing' : 'Jump back in';
    }

    window.addEventListener('hashchange', function () { render(); });

    H.views = { render: render, ctxFor: ctxFor, focusSearch: focusSearch, get route() { return route; }, regCtx: regCtx };
})();
