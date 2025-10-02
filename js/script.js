// ==========================================================================
// A. DOM ELEMENT SELECTION
// ==========================================================================
// All references to HTML elements are organized here for easy access.

// Player Core
const player = document.querySelector('.player');
const audio = document.getElementById('audio');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const albumArt = document.querySelector('.album-art');

// Controls
const prevBtn = document.getElementById('prev');
const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn'); // Note: You mentioned you didn't add this, but the variable is kept for future use.

// Progress Bar
const progressContainer = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// Volume
const volumeSlider = document.getElementById('volume-slider');

// Playlist
const playlistEl = document.getElementById('playlist');
const playlistPanel = document.querySelector('.playlist-panel');
const playlistToggle = document.getElementById('playlist-toggle');
const playlistClose = document.getElementById('playlist-close');

// Search
const searchInput = document.getElementById('search-input');
const searchSuggestions = document.getElementById('search-suggestions');

// Settings & Backgrounds
const settingsPanel = document.querySelector('.settings-panel');
const settingsToggle = document.getElementById('settings-toggle');
const settingsClose = document.getElementById('settings-close');
const settingOptions = document.querySelectorAll('.setting-option');
const albumArtBg1 = document.getElementById('album-art-bg-1');
const albumArtBg2 = document.getElementById('album-art-bg-2');
const auroraBg = document.getElementById('aurora-bg');
const vinylBg = document.getElementById('vinyl-bg');

// Visualizers
const playerVisualizerCanvas = document.getElementById('visualizer');
const playerVisualizerCtx = playerVisualizerCanvas.getContext('2d');
const vortexCanvas = document.getElementById('vortex-canvas');


// ==========================================================================
// B. APPLICATION STATE & DATA
// ==========================================================================
// Variables that hold the application's data and current state.

// Song Data
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

// Player State
let songIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let currentPlaylist = null;

// Settings State
let activeBackground = 'off';
let lastVolume = 1;
let currentBgDiv = 1;

// Visualizer State
let audioContext, analyser;
let scene, camera, renderer, lines;

// Generates a unique color palette for each song based on its name
const colorPresets = allSongs.map(song => {
    let hash = 0;
    for (let i = 0; i < song.name.length; i++) {
        hash = song.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c1 = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const c2 = ((hash >> 8) & 0x00FFFFFF).toString(16).toUpperCase();
    const a1 = "#" + "0".repeat(6 - c1.length) + c1;
    const a2 = "#" + "0".repeat(6 - c2.length) + c2;
    return { aurora: [a1, a2], vinyl: [a1, '#222'], vortex: parseInt(c1, 16) };
});


// ==========================================================================
// C. CORE PLAYER FUNCTIONS
// ==========================================================================

/**
 * Loads a song into the player, updating the UI and audio source.
 * @param {object} song The song object to load.
 */
function loadSong(song) {
    title.classList.add('animate-in');
    artist.classList.add('animate-in');

    title.textContent = song.displayName;
    artist.textContent = song.artist;
    audio.src = `Assets/music/${song.name}.mp3`;
    albumArt.src = `Assets/images/${song.cover}.jpg`;
    
    localStorage.setItem('helios-lastSongIndex', songIndex);
    
    updateActiveBackground();
    highlightCurrentSong();

    // Remove animation class after it finishes to allow re-triggering
    title.addEventListener('animationend', () => title.classList.remove('animate-in'), { once: true });
    artist.addEventListener('animationend', () => artist.classList.remove('animate-in'), { once: true });
}

/**
 * Plays the currently loaded song and updates the UI.
 */
function playSong() {
    isPlaying = true;
    player.classList.add('play');
    playBtn.querySelector('i.ph').classList.replace('ph-play', 'ph-pause');
    audio.play();
    const svg = document.getElementById('vinyl-svg');
    if (svg) svg.classList.add('playing');
}

/**
 * Pauses the currently playing song and updates the UI.
 */
function pauseSong() {
    isPlaying = false;
    player.classList.remove('play');
    playBtn.querySelector('i.ph').classList.replace('ph-pause', 'ph-play');
    audio.pause();
    const svg = document.getElementById('vinyl-svg');
    if (svg) svg.classList.remove('playing');
}

/**
 * Plays the next song in the queue, handling shuffle logic.
 */
function nextSong() {
    if (isShuffle) {
        if (!currentPlaylist) currentPlaylist = findPlaylistForSong(songIndex) || playlists[0];
        const currentIdxInPlaylist = currentPlaylist.songs.findIndex(s => s.name === allSongs[songIndex].name);
        let randomIdx;
        do {
            randomIdx = Math.floor(Math.random() * currentPlaylist.songs.length);
        } while (currentPlaylist.songs.length > 1 && randomIdx === currentIdxInPlaylist);
        
        const nextShuffledSong = currentPlaylist.songs[randomIdx];
        songIndex = allSongs.findIndex(s => s.name === nextShuffledSong.name);
    } else {
        songIndex++;
        if (songIndex >= allSongs.length) {
            songIndex = 0;
        }
    }
    currentPlaylist = findPlaylistForSong(songIndex);
    loadSong(allSongs[songIndex]);
    playSong();
}

/**
 * Plays the previous song in the queue.
 */
function prevSong() {
    songIndex--;
    if (songIndex < 0) {
        songIndex = allSongs.length - 1;
    }
    currentPlaylist = findPlaylistForSong(songIndex);
    loadSong(allSongs[songIndex]);
    playSong();
}

/**
 * Handles what happens when a song finishes playing.
 */
function handleSongEnd() {
    if (isRepeat) {
        audio.currentTime = 0;
        playSong();
    } else {
        nextSong();
    }
}


// ==========================================================================
// D. UI & CONTROL FUNCTIONS
// ==========================================================================

/**
 * Updates the progress bar and time display as the song plays.
 * @param {Event} e The timeupdate event object.
 */
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

/**
 * Seeks to a specific point in the song when the progress bar is clicked.
 * @param {Event} e The click event object.
 */
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const { duration } = audio;
    audio.currentTime = (clickX / width) * duration;
}

/**
 * Sets the audio volume and saves it to localStorage.
 */
function setVolume() {
    audio.volume = volumeSlider.value;
    localStorage.setItem('helios-volume', volumeSlider.value);
}

/**
 * Toggles the shuffle state and saves it to localStorage.
 */
function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
    localStorage.setItem('helios-shuffle', isShuffle);
}

/**
 * Toggles the repeat state and saves it to localStorage.
 */
function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
    localStorage.setItem('helios-repeat', isRepeat);
}

/**
 * Populates the playlist panel with songs.
 */
function generatePlaylist() {
    playlistEl.innerHTML = '';
    playlists.forEach(p => {
        const details = document.createElement('details');
        details.className = 'playlist-group';
        const summary = document.createElement('summary');
        summary.textContent = p.name;
        details.appendChild(summary);

        const ul = document.createElement('ul');
        p.songs.forEach(song => {
            const li = document.createElement('li');
            const idx = allSongs.findIndex(s => s.name === song.name);
            li.dataset.index = idx;

            li.innerHTML = `
                <img src="Assets/images/${song.cover}.jpg" alt="${song.displayName}" class="playlist-item-cover">
                <div class="playlist-item-details">
                    <strong>${song.displayName}</strong>
                    <span>${song.artist}</span>
                </div>
            `;
            li.addEventListener('click', () => {
                currentPlaylist = p;
                songIndex = idx;
                loadSong(allSongs[songIndex]);
                playSong();
            });
            ul.appendChild(li);
        });
        details.appendChild(ul);
        playlistEl.appendChild(details);
    });
    highlightCurrentSong();
}

/**
 * Visually highlights the currently playing song in the playlist.
 */
function highlightCurrentSong() {
    document.querySelectorAll('#playlist li').forEach(i => i.classList.remove('playing'));
    document.querySelectorAll('#playlist summary').forEach(i => i.classList.remove('active'));

    const item = document.querySelector(`#playlist li[data-index='${songIndex}']`);
    if (item) {
        item.classList.add('playing');
        const group = item.closest('.playlist-group');
        if (group) {
            group.querySelector('summary').classList.add('active');
            if (!group.open) group.open = true;
        }
    }
}

/**
 * Finds which of the original playlists a globally indexed song belongs to.
 * @param {number} gIndex The global index of the song in `allSongs`.
 * @returns {object|null} The playlist object or null if not found.
 */
function findPlaylistForSong(gIndex) {
    for (const p of playlists) {
        const exists = p.songs.find(s => allSongs[gIndex] && s.name === allSongs[gIndex].name);
        if (exists) return p;
    }
    return null;
}

/**
 * Shows search suggestions based on user input.
 * @param {string} term The search term.
 */
function showSearchSuggestions(term) {
    searchSuggestions.innerHTML = '';
    if (!term.trim()) {
        searchSuggestions.style.display = 'none';
        return;
    }
    const filtered = allSongs.filter(s => 
        s.displayName.toLowerCase().includes(term) || 
        s.artist.toLowerCase().includes(term)
    );
    searchSuggestions.style.display = filtered.length > 0 ? 'block' : 'none';

    filtered.slice(0, 5).forEach(song => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${song.displayName}</strong><br><span>${song.artist}</span>`;
        li.addEventListener('click', () => {
            songIndex = allSongs.findIndex(s => s.name === song.name);
            currentPlaylist = findPlaylistForSong(songIndex);
            loadSong(allSongs[songIndex]);
            playSong();
            searchInput.value = '';
            searchSuggestions.style.display = 'none';
        });
        searchSuggestions.appendChild(li);
    });
}

/**
 * Toggles the visibility of the playlist and settings panels.
 */
function togglePlaylist() {
    settingsPanel.classList.remove('show');
    playlistPanel.classList.toggle('show');
}
function toggleSettingsPanel() {
    playlistPanel.classList.remove('show');
    settingsPanel.classList.toggle('show');
}


// ==========================================================================
// E. VISUALIZER & BACKGROUND FUNCTIONS
// ==========================================================================

/**
 * Sets up and draws the bar-style audio visualizer.
 */
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

/**
 * Updates the main page background based on the user's setting.
 */
function updateActiveBackground() {
    // Deactivate all backgrounds first
    auroraBg.classList.remove('active');
    vinylBg.classList.remove('active');
    vortexCanvas.classList.remove('active');
    albumArtBg1.style.opacity = '0';
    albumArtBg2.style.opacity = '0';

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
            const imageUrl = `url('Assets/images/${allSongs[songIndex].cover}.jpg')`;
            
            if (currentBgDiv === 1) {
                albumArtBg2.style.backgroundImage = imageUrl;
                albumArtBg1.style.opacity = '0';
                albumArtBg2.style.opacity = '1';
                currentBgDiv = 2;
            } else {
                albumArtBg1.style.backgroundImage = imageUrl;
                albumArtBg2.style.opacity = '0';
                albumArtBg1.style.opacity = '1';
                currentBgDiv = 1;
            }
            break;
    }
}

/**
 * Initializes the Three.js vortex background.
 */
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


// ==========================================================================
// F. LOCALSTORAGE & SETTINGS
// ==========================================================================

/**
 * Loads all user preferences from localStorage when the app starts.
 */
function loadSettings() {
    // Load saved background
    const savedBackground = localStorage.getItem('helios-background');
    if (savedBackground) {
        activeBackground = savedBackground;
        settingOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.bg === activeBackground) {
                option.classList.add('active');
            }
        });
    }

    // Load saved volume
    const savedVolume = localStorage.getItem('helios-volume');
    if (savedVolume !== null) {
        audio.volume = savedVolume;
        volumeSlider.value = savedVolume;
    }

    // Load saved shuffle state
    const savedShuffle = localStorage.getItem('helios-shuffle');
    if (savedShuffle !== null) {
        isShuffle = (savedShuffle === 'true');
        shuffleBtn.classList.toggle('active', isShuffle);
    }

    // Load saved repeat state
    const savedRepeat = localStorage.getItem('helios-repeat');
    if (savedRepeat !== null) {
        isRepeat = (savedRepeat === 'true');
        repeatBtn.classList.toggle('active', isRepeat);
    }

    // Load the last played song's index
    const savedSongIndex = localStorage.getItem('helios-lastSongIndex');
    if (savedSongIndex !== null) {
        songIndex = parseInt(savedSongIndex, 10);
    }
}


// ==========================================================================
// G. EVENT LISTENERS
// ==========================================================================
// All event listeners are grouped here.

// Player Controls
playBtn.addEventListener('click', () => {
    if (!audioContext) { setupPlayerVisualizer(); }
    isPlaying ? pauseSong() : playSong();
});
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);

// Audio Events
audio.addEventListener('ended', handleSongEnd);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', () => {
    // Update time display for the newly loaded song
    updateProgress({ srcElement: { duration: audio.duration, currentTime: 0 } });
    
    // Check for and apply a saved playback position
    const savedPosition = localStorage.getItem('helios-lastPosition');
    if (savedPosition) {
        audio.currentTime = parseFloat(savedPosition);
        localStorage.removeItem('helios-lastPosition');
    }
});

// UI Interactions
progressContainer.addEventListener('click', setProgress);
volumeSlider.addEventListener('input', setVolume);
playlistToggle.addEventListener('click', togglePlaylist);
playlistClose.addEventListener('click', togglePlaylist);
settingsToggle.addEventListener('click', toggleSettingsPanel);
settingsClose.addEventListener('click', toggleSettingsPanel);
searchInput.addEventListener('input', (e) => showSearchSuggestions(e.target.value.toLowerCase()));
document.addEventListener('click', (e) => {
    if (!document.querySelector('.search-wrapper').contains(e.target)) {
        searchSuggestions.style.display = 'none';
    }
});

// Settings Panel
settingOptions.forEach(option => {
    option.addEventListener('click', () => {
        settingOptions.forEach(btn => btn.classList.remove('active'));
        option.classList.add('active');
        activeBackground = option.dataset.bg;
        localStorage.setItem('helios-background', activeBackground);
        updateActiveBackground();
        if (activeBackground === 'vortex' && !scene) { initVortex(); }
    });
});

// Window & Browser Events
window.addEventListener('resize', () => {
    if (renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

window.addEventListener('beforeunload', () => {
    // Only save the position if a song is actively playing
    if (isPlaying) {
        localStorage.setItem('helios-lastPosition', audio.currentTime);
    }
});

document.addEventListener('keydown', (event) => {
    if (document.activeElement === searchInput) return; // Ignore shortcuts when searching

    switch (event.key) {
        case ' ':
            event.preventDefault();
            playBtn.click();
            break;
        case 'ArrowRight':
            nextSong();
            break;
        case 'ArrowLeft':
            prevSong();
            break;
        case 'm':
        case 'M':
            if (audio.volume > 0) {
                lastVolume = audio.volume;
                audio.volume = 0;
                volumeSlider.value = 0;
            } else {
                audio.volume = lastVolume;
                volumeSlider.value = lastVolume;
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            const newVolumeUp = Math.min(1, audio.volume + 0.05);
            audio.volume = newVolumeUp;
            volumeSlider.value = newVolumeUp;
            setVolume(); // Save the new volume
            break;
        case 'ArrowDown':
            event.preventDefault();
            const newVolumeDown = Math.max(0, audio.volume - 0.05);
            audio.volume = newVolumeDown;
            volumeSlider.value = newVolumeDown;
            setVolume(); // Save the new volume
            break;
    }
});


// ==========================================================================
// H. INITIALIZATION
// ==========================================================================
// The code that runs when the script is first loaded.

generatePlaylist();
loadSettings();
loadSong(allSongs[songIndex]);