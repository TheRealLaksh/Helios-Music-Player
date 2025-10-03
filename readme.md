# 🚀 Helios Music Player 🎵

Welcome to Helios, a futuristic and highly customizable web-based music player. Built with a focus on a clean user experience and stunning visuals, this project goes beyond the standard player by offering multiple dynamic, animated backgrounds that react to your music.

---

### ✨ Core Features

This player is fully equipped with all the essential features for a seamless listening experience.

-   ✅ **Full Playback Controls**: Play, pause, skip forward, and go back with ease.
-   ✅ **Interactive Progress Bar**: See the current timestamp and track duration. Click anywhere on the progress bar to seek to that position in the song.
-   ✅ **Volume Control**: Adjust the audio level with a smooth, intuitive slider.
-   ✅ **Shuffle & Repeat**: Enjoy your playlist in a random order with shuffle, or loop your favorite track with repeat.
-   ✅ **Dynamic Playlist Panel**: A clean, slide-out panel displays all available tracks.
-   ✅ **Responsive Design**: The interface is meticulously crafted to look and feel great on any device, from a large desktop monitor to a small mobile screen.

---

### 🎨 Unique & Creative Enhancements 

What makes Helios special is the ability to customize your visual experience.

-   **🎛️ In-Player Audio Visualizer**: A sleek, real-time audio visualizer is built directly into the player UI, providing a beat-reactive graphical element.
-   **🌌 Customizable Animated Backgrounds**: A dedicated settings panel allows you to switch between four distinct background modes, each with its own unique, song-aware color palette:
    -   **🖼️ Album Art (Default)**: A beautifully blurred and scaled version of the current song's cover art.
    -   **🌠 Aurora**: A smooth, flowing gradient that resembles the northern lights, with colors that change for each song.
    -   **💿 Vinyl**: A minimalist, rotating geometric pattern that syncs its motion with the play/pause state, just like a real record player.
    -   **🚀 Vortex**: An immersive 3D data tunnel (powered by Three.js) that pulses with the music and adopts a new color scheme for every track.

---

### 🎶 Current Playlist

For this version, the player is loaded with a static playlist of 5 diverse tracks to demonstrate its functionality. The `assets` folder can be easily updated with your own music.

1.  **Youngblood** - 5 Seconds of Summer
2.  **God's Plan** - Drake
3.  **Don't Even Text** - Tsumyoki, Ginni
4.  **Darji** - Prabh Singh, Rooh Sandhu
5.  **Paro** - Aditya Rikhari

---

### 🛠️ Tech Stack

This project was built from the ground up using fundamental web technologies, showcasing a strong command of front-end development.

-   **HTML5**: Structuring the application with semantic and accessible markup.
-   **CSS3**: Advanced styling for the dark theme, responsive layout, and complex `@keyframes` animations.
-   **JavaScript (ES6+)**: Handling all application logic, including audio API interaction, state management, and DOM manipulation.
-   **Three.js**: A powerful 3D library used to render the high-performance "Vortex" background.
-   **Phosphor Icons**: For the clean, modern, and highly legible icon set.

---

### 🚀 Local Setup and Usage

To run this project on your local machine, you **must use a local server**. Opening the `index.html` file directly will cause browser security (CORS) errors, which will prevent the audio and visualizer from loading correctly.

The easiest method is with the **Live Server** extension in Visual Studio Code.

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/helios-music-player.git](https://github.com/your-username/helios-music-player.git)
    ```
2.  **Navigate to the Directory**
    ```bash
    cd helios-music-player
    ```
3.  **Ensure Assets Are in Place**
    -   Your music files (`.mp3`) must be in the `/assets/music/` folder.
    -   Your cover images (`.jpg`, `.png`, etc.) must be in the `/assets/images/` folder.
4.  **Launch the Server**
    -   In VS Code, right-click the `index.html` file.
    -   Select **"Open with Live Server"**. Your browser will automatically open the project, and everything will be fully functional.
