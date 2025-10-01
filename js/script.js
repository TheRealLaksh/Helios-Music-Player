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

// --- Playlist ---
const songs = [
    { name: 'band4band', displayName: 'Band4Band', artist: 'Central Cee & Lil Baby', cover: 'band4band' },
    { name: 'darji', displayName: 'Darji', artist: 'Prabh Singh & Rooh Sandhu', cover: 'darji' },
    { name: 'doja', displayName: 'Doja', artist: 'Central Cee', cover: 'doja' },
    { name: 'donteventext', displayName: 'Don\'t Even Text', artist: 'Tsumyoki & Ginni', cover: 'donteventext' },
    { name: 'dtmf', displayName: 'DTMF', artist: 'Bad Bunny', cover: 'dtmf' },
    { name: 'farebi', displayName: 'Farebi', artist: 'Chaar Diwaari & Raftaar', cover: 'farebi' },
    { name: 'godsplan', displayName: 'God\'s Plan', artist: 'Drake', cover: 'godsplan' },
    { name: 'ordinary', displayName: 'Ordinary', artist: 'Alex Warren', cover: 'ordinary' },
    { name: 'paro', displayName: 'Paro', artist: 'Aditya Rikhari', cover: 'paro' },
    { name: 'sprinter', displayName: 'Sprinter', artist: 'Dave & Central Cee', cover: 'sprinter' },
    { name: 'thodisidaaru', displayName: 'Thodi Si Daaru', artist: 'AP Dhillon & Shreya Ghoshal', cover: 'thodisidaaru' },
    { name: 'thriftshop', displayName: 'Thrift Shop', artist: 'Macklemore & Ryan Lewis', cover: 'thriftshop' },
    { name: 'whichone', displayName: 'Which One', artist: 'Drake & Central Cee', cover: 'whichone' },
    { name: 'youngblood', displayName: 'Youngblood', artist: '5 Seconds of Summer', cover: 'youngblood' }
];
// --- Color Presets for Backgrounds ---
const colorPresets = [
    { aurora: ['#2c3e50', '#fd746c'], vinyl: ['#fd746c', '#2c3e50'], vortex: 0xfd746c }, // band4band
    { aurora: ['#00C9FF', '#92FE9D'], vinyl: ['#00C9FF', '#282828'], vortex: 0x00C9FF }, // darji
    { aurora: ['#e96443', '#904e95'], vinyl: ['#e96443', '#333'], vortex: 0xe96443 }, // doja
    { aurora: ['#F7971E', '#FFD200'], vinyl: ['#F7971E', '#444'], vortex: 0xF7971E }, // donteventext
    { aurora: ['#1c92d2', '#f2fcfe'], vinyl: ['#1c92d2', '#333'], vortex: 0x1c92d2 }, // dtmf
    { aurora: ['#ff4b1f', '#1fddff'], vinyl: ['#ff4b1f', '#222'], vortex: 0xff4b1f }, // farebi
    { aurora: ['#8E2DE2', '#4A00E0'], vinyl: ['#8E2DE2', '#333'], vortex: 0x8E2DE2 }, // godsplan
    { aurora: ['#a1c4fd', '#c2e9fb'], vinyl: ['#a1c4fd', '#444'], vortex: 0xa1c4fd }, // ordinary
    { aurora: ['#1D2B64', '#F8CDDA'], vinyl: ['#F8CDDA', '#1D2B64'], vortex: 0xF8CDDA }, // paro
    { aurora: ['#007991', '#78ffd6'], vinyl: ['#007991', '#222'], vortex: 0x007991 }, // sprinter
    { aurora: ['#cb2d3e', '#ef473a'], vinyl: ['#cb2d3e', '#333'], vortex: 0xcb2d3e }, // thodisidaaru
    { aurora: ['#134E5E', '#71B280'], vinyl: ['#71B280', '#134E5E'], vortex: 0x71B280 }, // thriftshop
    { aurora: ['#3a6186', '#89253e'], vinyl: ['#89253e', '#3a6186'], vortex: 0x89253e }, // whichone
    { aurora: ['#D4145A', '#FBB03B'], vinyl: ['#D4145A', '#222'], vortex: 0xD4145A }  // youngblood
];

// --- State Management ---
let isPlaying = false;
let songIndex = 0;
let isShuffle = false;
let isRepeat = false;
let activeBackground = 'off';
let audioContext, analyser;

// --- Three.js (Vortex) Variables ---
let scene, camera, renderer, lines;

// --- Core Functions ---
function loadSong(song) {
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    audio.src = `assets/music/${song.name}.mp3`;
    albumArt.src = `assets/images/${song.cover}.jpg`;
    updateActiveBackground();
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

function prevSong() { songIndex--; if (songIndex < 0) songIndex = songs.length - 1; loadSong(songs[songIndex]); playSong(); }

function nextSong() {
    if (isShuffle) { let r; do { r = Math.floor(Math.random() * songs.length); } while (r === songIndex); songIndex = r; }
    else { songIndex++; if (songIndex > songs.length - 1) songIndex = 0; }
    loadSong(songs[songIndex]); playSong();
}

function updateProgress(e) {
    if (isPlaying && !isNaN(audio.duration)) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        const formatTime = (time) => String(Math.floor(time)).padStart(2, '0');
        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = formatTime(duration % 60);
        durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
        const currentMinutes = Math.floor(currentTime / 60);
        const currentSeconds = formatTime(currentTime % 60);
        currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;
    }
}

function setProgress(e) { const w = this.clientWidth; const cX = e.offsetX; const { duration } = audio; audio.currentTime = (cX / w) * duration; }

function setVolume() { audio.volume = volumeSlider.value; }

function generatePlaylist() { songs.forEach((song, i) => { const li = document.createElement('li'); li.textContent = `${song.displayName} - ${song.artist}`; li.addEventListener('click', () => { songIndex = i; loadSong(songs[songIndex]); playSong(); }); playlistEl.appendChild(li); }); }

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
        if(analyser) {
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

    switch (activeBackground) {
        case 'aurora':
            auroraBg.style.setProperty('--aurora1', colors.aurora[0]);
            auroraBg.style.setProperty('--aurora2', colors.aurora[1]);
            auroraBg.classList.add('active');
            break;
        case 'vinyl':
            vinylBg.innerHTML = `
                <svg id="vinyl-svg" class="${isPlaying ? 'playing' : ''}" viewBox="0 0 400 400">
                    <defs>
                        <radialGradient id="grad${songIndex}" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="${colors.vinyl[0]}" />
                            <stop offset="100%" stop-color="${colors.vinyl[1]}" />
                        </radialGradient>
                    </defs>
                    <circle cx="200" cy="200" r="200" fill="url(#grad${songIndex})"/>
                    <circle cx="200" cy="200" r="180" fill="#121212"/>
                    <circle cx="200" cy="200" r="60" fill="url(#grad${songIndex})"/>
                </svg>`;
            vinylBg.classList.add('active');
            break;
        case 'vortex':
            vortexCanvas.classList.add('active');
            if (lines) { lines.forEach(line => line.material.color.setHex(colors.vortex)); }
            break;
        case 'off':
        default:
            albumArtBg.style.backgroundImage = `url('assets/images/${songs[songIndex].cover}.jpg')`;
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
    for (let i = 0; i < lineContent; i++) {
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

// --- Event Listeners ---
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

// --- On Load ---
loadSong(songs[songIndex]);
generatePlaylist();
updateActiveBackground();