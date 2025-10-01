// --- DOM Elements ---
const player = document.querySelector('.player');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const audio = document.getElementById('audio');
const progressContainer = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const albumArt = document.querySelector('.album-art');
const prevBtn = document.getElementById('prev');
const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
const volumeSlider = document.getElementById('volume-slider');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playlistEl = document.getElementById('playlist');
const playlistPanel = document.querySelector('.playlist-panel');
const playlistToggle = document.getElementById('playlist-toggle');
const playlistClose = document.getElementById('playlist-close');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const playerVisualizerCanvas = document.getElementById('visualizer');
const playerVisualizerCtx = playerVisualizerCanvas.getContext('2d');
const settingsPanel = document.querySelector('.settings-panel');
const settingsToggle = document.getElementById('settings-toggle');
const settingsClose = document.getElementById('settings-close');
const settingOptions = document.querySelectorAll('.setting-option');
const albumArtBg = document.getElementById('album-art-bg');
const auroraBg = document.getElementById('aurora-bg');
const vinylBg = document.getElementById('vinyl-bg');
const vortexCanvas = document.getElementById('vortex-canvas');
const searchInput = document.getElementById('search-input');
const searchSuggestions = document.getElementById('search-suggestions');

// --- Playlist Data ---
const playlists = [
    {
        name: 'English ',
        songs: [
            { name: 'azizam', displayName: 'Azizam', artist: 'Ed Sheeran', cover: 'azizam' },
            { name: 'badhabits', displayName: 'Bad Habits', artist: 'Ed Sheeran', cover: 'badhabits' },
            { name: 'band4band', displayName: 'Band4Band', artist: 'Central Cee & Lil Baby', cover: 'band4band' },
            { name: 'camera', displayName: 'Camera', artist: 'Ed Sheeran', cover: 'camera' },
            { name: 'cold', displayName: 'Cold - R3hab & Khrebto Remix', artist: 'Maroon 5, Future, R3HAB, Khrebto', cover: 'cold' },
            { name: 'doja', displayName: 'Doja', artist: 'Central Cee', cover: 'doja' },
            { name: 'dtmf', displayName: 'DTMF', artist: 'Bad Bunny', cover: 'dtmf' },
            { name: 'flatline', displayName: 'Flatline', artist: 'Justin Bieber', cover: 'flatline' },
            { name: 'followyou', displayName: 'Follow You', artist: 'Imagine Dragons', cover: 'followyou' },
            { name: 'ghost', displayName: 'Ghost', artist: 'Justin Bieber', cover: 'ghost' },
            { name: 'godsplan', displayName: 'God\'s Plan', artist: 'Drake', cover: 'godsplan' },
            { name: 'hometownsmile', displayName: 'Hometown Smile', artist: 'Bahjat', cover: 'hometownsmile' },
            { name: 'howlong', displayName: 'How Long', artist: 'Charlie Puth', cover: 'howlong' },
            { name: 'hymnfortheweekend', displayName: 'Hymn for the Weekend', artist: 'Coldplay', cover: 'hymnfortheweekend' },
            { name: 'idontcare', displayName: 'I Don\'t Care', artist: 'Ed Sheeran & Justin Bieber', cover: 'idontcare' },
            { name: 'ilikemebetter', displayName: 'I Like Me Better', artist: 'Lauv', cover: 'ilikemebetter' },
            { name: 'imsotired', displayName: 'i\'m so tired...', artist: 'Lauv & Troye Sivan', cover: 'imsotired' },
            { name: 'lostinyou', displayName: 'Lost in You', artist: 'khai dreams', cover: 'lostinyou' },
            { name: 'mexico', displayName: 'Mexico', artist: 'Shotgun Willy', cover: 'mexico' },
            { name: 'numb', displayName: 'Numb', artist: 'Marshmello', cover: 'numb' },
            { name: 'ordinary', displayName: 'Ordinary', artist: 'Alex Warren', cover: 'ordinary' },
            { name: 'parisintherain', displayName: 'Paris in the Rain', artist: 'Lauv', cover: 'parisintherain' },
            { name: 'perfect', displayName: 'Perfect', artist: 'Ed Sheeran', cover: 'perfect' },
            { name: 'photograph', displayName: 'Photograph', artist: 'Ed Sheeran', cover: 'photograph' },
            { name: 'run', displayName: 'Run', artist: 'OneRepublic', cover: 'run' },
            { name: 'sapphire', displayName: 'Sapphire', artist: 'Ed Sheeran', cover: 'sapphire' },
            { name: 'selflove', displayName: 'Self Love', artist: 'Metro Boomin, Coi Leray', cover: 'selflove' },
            { name: 'shapeofyou', displayName: 'Shape of You', artist: 'Ed Sheeran', cover: 'shapeofyou' },
            { name: 'shivers', displayName: 'Shivers', artist: 'Ed Sheeran', cover: 'shivers' },
            { name: 'somethingjustlikethis', displayName: 'Something Just Like This', artist: 'The Chainsmokers & Coldplay', cover: 'somethingjustlikethis' },
            { name: 'sprinter', displayName: 'Sprinter', artist: 'Dave & Central Cee', cover: 'sprinter' },
            { name: 'thinkingoutloud', displayName: 'Thinking Out Loud', artist: 'Ed Sheeran', cover: 'thinkingoutloud' },
            { name: 'thriftshop', displayName: 'Thrift Shop', artist: 'Macklemore & Ryan Lewis', cover: 'thriftshop' },
            { name: 'whichone', displayName: 'Which One', artist: 'Drake & Central Cee', cover: 'whichone' },
            { name: 'youngblood', displayName: 'Youngblood', artist: '5 Seconds of Summer', cover: 'youngblood' },
        ]
    },
    {
        name: 'Punjabi ',
        songs: [
            { name: '3peg', displayName: '3 Peg', artist: 'Sharry Mann', cover: '3peg' },
            { name: '945', displayName: '9:45', artist: 'Prabh Singh, Jay Trak, Rooh Sandhu', cover: '945' },
            { name: 'admirinyou', displayName: 'Admirin\' You', artist: 'Karan Aujla', cover: 'admirinyou' },
            { name: 'baawe', displayName: 'Baawe', artist: 'AP Dhillon', cover: 'baawe' },
            { name: 'bemine', displayName: 'Be Mine', artist: 'AP Dhillon', cover: 'bemine' },
            { name: 'daaku', displayName: 'Daaku', artist: 'Badshah, Sharvi Yadav, Hiten', cover: 'daaku' },
            { name: 'darji', displayName: 'Darji', artist: 'Prabh Singh & Rooh Sandhu', cover: 'darji' },
            { name: 'excuses', displayName: 'Excuses', artist: 'AP Dhillon, Gurinder Gill, Intense', cover: 'excuses' },
            { name: 'loveya', displayName: 'Love Ya', artist: 'Karan Aujla', cover: 'loveya' },
            { name: 'magic', displayName: 'Magic', artist: 'AP Dhillon', cover: 'magic' },
            { name: 'millionaire', displayName: 'Millionaire', artist: 'Yo Yo Honey Singh, Simar Kaur, Singhsta', cover: 'millionaire' },
            { name: 'obsessed', displayName: 'Obsessed', artist: 'Riar Saab, Abhijay Sharma', cover: 'obsessed' },
            { name: 'oldmoney', displayName: 'Old Money', artist: 'Karan Aujla, Ikky', cover: 'oldmoney' },
            { name: 'stfu', displayName: 'STFU', artist: 'Karan Aujla, Yeah Proof', cover: 'stfu' },
            { name: 'thodisidaaru', displayName: 'Thodi Si Daaru', artist: 'AP Dhillon & Shreya Ghoshal', cover: 'thodisidaaru' },
            { name: 'toxic', displayName: 'Toxic', artist: 'AP Dhillon, Gurinder Gill, Gminxr', cover: 'toxic' },
            { name: 'truestories', displayName: 'True Stories', artist: 'AP Dhillon, Gurinder Gill, Intense', cover: 'truestories' },
            { name: 'uddaapunjab', displayName: 'Ud Daa Punjab', artist: 'Amit Trivedi', cover: 'uddaapunjab' },
            { name: 'withyou', displayName: 'With You', artist: 'AP Dhillon', cover: 'withyou' },
        ]
    },
    {
        name: 'Hindi ',
        songs: [
            { name: 'bhaagdkbose', displayName: 'Bhaag D.K. Bose, Aandhi Aayi', artist: 'Ram Sampath', cover: 'bhaagdkbose' },
            { name: 'bijleebijlee', displayName: 'Bijlee Bijlee', artist: 'Harrdy Sandhu', cover: 'bijleebijlee' },
            { name: 'donteventext', displayName: "Don't Even Text", artist: 'Tsumyoki & Ginni', cover: 'donteventext' },
            { name: 'faasle', displayName: 'Faasle', artist: 'Aditya Rikhari', cover: 'faasle' },
            { name: 'farebi', displayName: 'Farebi', artist: 'Chaar Diwaari & Raftaar', cover: 'farebi' },
            { name: 'haanmaingalat', displayName: 'Haan Main Galat', artist: 'Arijit Singh & Shashwat Singh', cover: 'haanmaingalat' },
            { name: 'hawayein', displayName: 'Hawayein', artist: 'Arijit Singh', cover: 'hawayein' },
            { name: 'heeriye', displayName: 'Heeriye', artist: 'Jasleen Royal & Arijit Singh', cover: 'heeriye' },
            { name: 'husn', displayName: 'Husn', artist: 'Anuv Jain', cover: 'husn' },
            { name: 'ilahi', displayName: 'Ilahi', artist: 'Arijit Singh', cover: 'ilahi' },
            { name: 'maharani', displayName: 'Maharani', artist: 'Karun ft. Arpit Bala & ReVo LEKHAK', cover: 'maharani' },
            { name: 'malang', displayName: 'Malang (Title Track)', artist: 'Ved Sharma', cover: 'malang' },
            { name: 'nashesichadhgyi', displayName: 'Nashe Si Chadh Gayi', artist: 'Arijit Singh', cover: 'nashesichadhgyi' },
            { name: 'paro', displayName: 'Paro', artist: 'Aditya Rikhari', cover: 'paro' },
            { name: 'pungi', displayName: 'Pungi', artist: 'Mika Singh, Pritam, Amitabh Bhattacharya, Nakash Aziz', cover: 'pungi' },
            { name: 'udedilbefikre', displayName: 'Ude Dil Befikre', artist: 'Benny Dayal', cover: 'udedilbefikre' },
            { name: 'wishes', displayName: 'Wishes', artist: 'Hasan Raheem ft. Talwiinder', cover: 'wishes' },
        ]

    }
];

const allSongs = playlists.flatMap(p => p.songs);
const colorPresets = allSongs.map(song => {
    let hash = 0;
    for (let i = 0; i < song.name.length; i++) { hash = song.name.charCodeAt(i) + ((hash << 5) - hash); }
    const color1 = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const color2 = ((hash >> 8) & 0x00FFFFFF).toString(16).toUpperCase();
    const aurora1 = "#" + "00000".substring(0, 6 - color1.length) + color1;
    const aurora2 = "#" + "00000".substring(0, 6 - color2.length) + color2;
    return { aurora: [aurora1, aurora2], vinyl: [aurora1, '#222'], vortex: parseInt(color1.replace('#', ''), 16) };
});

let isPlaying = false;
let songIndex = 0;
let isShuffle = false;
let isRepeat = false;
let activeBackground = 'off';
let currentPlaylist = null;
let audioContext, analyser;
let scene, camera, renderer, lines;

function highlightCurrentSong() {
    document.querySelectorAll('#playlist li').forEach(item => item.classList.remove('playing'));
    document.querySelectorAll('#playlist summary').forEach(item => item.classList.remove('active'));
    const currentSongItem = document.querySelector(`#playlist li[data-index='${songIndex}']`);
    if (currentSongItem) {
        currentSongItem.classList.add('playing');
        const parentGroup = currentSongItem.closest('.playlist-group');
        if (parentGroup) {
            parentGroup.querySelector('summary').classList.add('active');
            if (!parentGroup.open) parentGroup.open = true;
        }
    }
}

function loadSong(song) {
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    audio.src = `assets/music/${song.name}.mp3`;
    albumArt.src = `assets/images/${song.cover}.jpg`;
    updateActiveBackground();
    highlightCurrentSong();
}

function playSong() {
    isPlaying = true;
    player.classList.add('play');
    playBtn.querySelector('i.ph').classList.remove('ph-play');
    playBtn.querySelector('i.ph').classList.add('ph-pause');
    audio.play();
    const vinylSVG = document.getElementById('vinyl-svg');
    if (vinylSVG) vinylSVG.classList.add('playing');
}

function pauseSong() {
    isPlaying = false;
    player.classList.remove('play');
    playBtn.querySelector('i.ph').classList.add('ph-play');
    playBtn.querySelector('i.ph').classList.remove('ph-pause');
    audio.pause();
    const vinylSVG = document.getElementById('vinyl-svg');
    if (vinylSVG) vinylSVG.classList.remove('playing');
}

function findPlaylistForSong(globalIndex) {
    for (const playlist of playlists) {
        const songExists = playlist.songs.find(s => allSongs[globalIndex] && s.name === allSongs[globalIndex].name);
        if (songExists) return playlist;
    }
    return null;
}

function prevSong() {
    songIndex--;
    if (songIndex < 0) { songIndex = allSongs.length - 1; }
    currentPlaylist = findPlaylistForSong(songIndex);
    loadSong(allSongs[songIndex]);
    playSong();
}

function nextSong() {
    if (isShuffle) {
        if (!currentPlaylist) { currentPlaylist = findPlaylistForSong(songIndex) || playlists[0]; }
        const currentSongInPlaylistIndex = currentPlaylist.songs.findIndex(s => s.name === allSongs[songIndex].name);
        let randomIndexInPlaylist;
        do { randomIndexInPlaylist = Math.floor(Math.random() * currentPlaylist.songs.length); } while (currentPlaylist.songs.length > 1 && randomIndexInPlaylist === currentSongInPlaylistIndex);
        const nextShuffledSong = currentPlaylist.songs[randomIndexInPlaylist];
        songIndex = allSongs.findIndex(s => s.name === nextShuffledSong.name);
    } else {
        songIndex++;
        if (songIndex > allSongs.length - 1) { songIndex = 0; }
        currentPlaylist = findPlaylistForSong(songIndex);
    }
    loadSong(allSongs[songIndex]);
    playSong();
}

function updateProgress(e) { if (isPlaying && !isNaN(audio.duration)) { const { duration, currentTime } = e.srcElement; const p = (currentTime / duration) * 100; progress.style.width = `${p}%`; const f = (t) => String(Math.floor(t)).padStart(2, '0'); const dM = Math.floor(duration / 60); const dS = f(duration % 60); durationEl.textContent = `${dM}:${dS}`; const cM = Math.floor(currentTime / 60); const cS = f(currentTime % 60); currentTimeEl.textContent = `${cM}:${cS}`; } }
function setProgress(e) { const w = this.clientWidth; const cX = e.offsetX; const { duration } = audio; audio.currentTime = (cX / w) * duration; }
function setVolume() { audio.volume = volumeSlider.value; }
function generatePlaylist() { playlistEl.innerHTML = ''; playlists.forEach(playlist => { const details = document.createElement('details'); details.classList.add('playlist-group'); const summary = document.createElement('summary'); summary.textContent = playlist.name; details.appendChild(summary); const songList = document.createElement('ul'); playlist.songs.forEach(song => { const li = document.createElement('li'); li.textContent = `${song.displayName} - ${song.artist}`; const songIndexInAllSongs = allSongs.findIndex(s => s.name === song.name); li.setAttribute('data-index', songIndexInAllSongs); li.addEventListener('click', () => { currentPlaylist = playlist; songIndex = songIndexInAllSongs; loadSong(allSongs[songIndex]); playSong(); }); songList.appendChild(li); }); details.appendChild(songList); playlistEl.appendChild(details); }); highlightCurrentSong(); }

function showSearchSuggestions(searchTerm) {
    searchSuggestions.innerHTML = '';
    if (!searchTerm.trim()) {
        searchSuggestions.style.display = 'none';
        return;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredSongs = allSongs.filter(song => song.displayName.toLowerCase().includes(lowerCaseSearchTerm) || song.artist.toLowerCase().includes(lowerCaseSearchTerm));
    if (filteredSongs.length > 0) {
        searchSuggestions.style.display = 'block';
    } else {
        searchSuggestions.style.display = 'none';
    }
    filteredSongs.slice(0, 5).forEach(song => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${song.displayName}</strong><br><span>${song.artist}</span>`;
        li.addEventListener('click', () => {
            songIndex = allSongs.findIndex(s => s.name === song.name);
            currentPlaylist = findPlaylistForSong(songIndex);
            loadSong(allSongs[songIndex]);
            playSong();
            searchInput.value = '';
            searchSuggestions.innerHTML = '';
            searchSuggestions.style.display = 'none';
        });
        searchSuggestions.appendChild(li);
    });
}

function togglePlaylist() { settingsPanel.classList.remove('show'); playlistPanel.classList.toggle('show'); }
function toggleSettingsPanel() { playlistPanel.classList.remove('show'); settingsPanel.classList.toggle('show'); }
function toggleShuffle() { isShuffle = !isShuffle; shuffleBtn.classList.toggle('active', isShuffle); }
function toggleRepeat() { isRepeat = !isRepeat; repeatBtn.classList.toggle('active', isRepeat); }
function handleSongEnd() { if (isRepeat) { audio.currentTime = 0; playSong(); } else { nextSong(); } }

function setupPlayerVisualizer() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audio);
        analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    function draw() {
        requestAnimationFrame(draw);
        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            playerVisualizerCtx.clearRect(0, 0, playerVisualizerCanvas.width, playerVisualizerCanvas.height);
            const barWidth = (playerVisualizerCanvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                playerVisualizerCtx.fillStyle = `rgb(29, 185, 84)`;
                playerVisualizerCtx.fillRect(x, playerVisualizerCanvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
    }
    draw();
}

function updateActiveBackground() {
    albumArtBg.classList.remove('active');
    auroraBg.classList.remove('active');
    vinylBg.classList.remove('active');
    vortexCanvas.classList.remove('active');
    const colors = colorPresets[songIndex];
    if (!colors) return;
    switch (activeBackground) {
        case 'aurora':
            auroraBg.style.setProperty('--aurora1', colors.aurora[0]);
            auroraBg.style.setProperty('--aurora2', colors.aurora[1]);
            auroraBg.classList.add('active');
            break;
        case 'vinyl':
            vinylBg.innerHTML = `<svg id="vinyl-svg" class="${isPlaying ? 'playing' : ''}" viewBox="0 0 400 400"><defs><radialGradient id="grad${songIndex}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${colors.vinyl[0]}" /><stop offset="100%" stop-color="${colors.vinyl[1]}" /></radialGradient></defs><circle cx="200" cy="200" r="200" fill="url(#grad${songIndex})"/><circle cx="200" cy="200" r="180" fill="#121212"/><circle cx="200" cy="200" r="60" fill="url(#grad${songIndex})"/></svg>`;
            vinylBg.classList.add('active');
            break;
        case 'vortex':
            vortexCanvas.classList.add('active');
            if (lines) { lines.forEach(line => line.material.color.setHex(colors.vortex)); }
            break;
        case 'off':
        default:
            albumArtBg.style.backgroundImage = `url('assets/images/${allSongs[songIndex].cover}.jpg')`;
            albumArtBg.classList.add('active');
            break;
    }
}

function initVortex() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: vortexCanvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    lines = [];
    const lineCount = 100, radius = 5;
    for (let i = 0; i < lineCount; i++) {
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([-1000, 0, 0, 1000, 0, 0]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({ color: colorPresets[songIndex].vortex });
        const line = new THREE.Line(geometry, material);
        const theta = (i / lineCount) * Math.PI * 2;
        line.position.set(radius * Math.cos(theta), radius * Math.sin(theta), 0);
        line.rotation.z = theta;
        scene.add(line);
        lines.push(line);
    }
    camera.position.z = -5;
    function animate() {
        requestAnimationFrame(animate);
        if (activeBackground !== 'vortex') return;
        if (analyser) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            camera.position.z = -5 + (avg / 255) * 2;
        }
        camera.rotation.z += 0.001;
        renderer.render(scene, camera);
    }
    animate();
}

settingOptions.forEach(option => {
    option.addEventListener('click', () => {
        settingOptions.forEach(btn => btn.classList.remove('active'));
        option.classList.add('active');
        activeBackground = option.dataset.bg;
        updateActiveBackground();
        if (activeBackground === 'vortex' && !scene) { initVortex(); }
    });
});

searchInput.addEventListener('input', (e) => {
    showSearchSuggestions(e.target.value);
});
document.addEventListener('click', (e) => {
    if (!document.querySelector('.search-wrapper').contains(e.target)) {
        searchSuggestions.style.display = 'none';
    }
});
playBtn.addEventListener('click', () => { if (!audioContext) { setupPlayerVisualizer(); } isPlaying ? pauseSong() : playSong(); });
settingsToggle.addEventListener('click', toggleSettingsPanel);
settingsClose.addEventListener('click', toggleSettingsPanel);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress);
progressContainer.addEventListener('click', setProgress);
audio.addEventListener('ended', handleSongEnd);
volumeSlider.addEventListener('input', setVolume);
playlistToggle.addEventListener('click', togglePlaylist);
playlistClose.addEventListener('click', togglePlaylist);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);
window.addEventListener('resize', () => {
    if (renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

loadSong(allSongs[songIndex]);
generatePlaylist();
updateActiveBackground();