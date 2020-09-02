let player = new Player({ box: document.querySelector(".player") });
player.enableDebug();
function createSongItemTemplate({ song = new Song(), i }) {
    let songElement = document.createElement("div");
    songElement.classList.add("song");
    let songIndex = document.createElement("div");
    songIndex.classList.add("song-index");
    songIndex.textContent = `#${parseInt(i) + 1}`;

    let songTitle = document.createElement("div");
    songTitle.classList.add("song-title");
    songTitle.textContent = song.title;

    let playButton = document.createElement("button");
    playButton.classList.add("song-play");
    playButton.textContent = "Play";
    playButton.addEventListener("click", (e) => player.play(song));
    songElement.addEventListener("click", (e) => playButton.click());

    songElement.append(songIndex, songTitle, playButton);

    return songElement;
}

function showSongs() {
    let songList = document.querySelector(".song-list");
    for (const i in songs) {
        if (songs.hasOwnProperty(i)) {
            const song = songs[i];
            songList.append(createSongItemTemplate({ song, i }));
        }
    }
}
showSongs();
