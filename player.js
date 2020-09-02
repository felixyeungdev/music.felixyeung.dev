let waitUntilTime = (time) =>
    new Promise((resolve, reject) => {
        let looper = setInterval((e) => {
            if (Date.now() >= time) {
                resolve();
                clearInterval(looper);
            }
        });
    });

let sleep = (ms) =>
    new Promise((resolve, reject) => {
        setTimeout((e) => resolve(e), ms);
    });

class Player {
    constructor({ box = document.body }) {
        this.box = box;
        this._init();
    }

    _createController() {
        const PRECISION = 50;
        let controller = document.createElement("div");
        controller.classList.add("player-controls");

        let playPause = document.createElement("div");
        playPause.classList.add("player-play_pause");
        playPause.classList.add("paused");
        let playButton = document.createElement("button");
        playButton.classList.add("play");
        playButton.innerHTML = `<i class="fas fa-play"></i>`;
        let pauseButton = document.createElement("button");
        pauseButton.classList.add("pause");
        pauseButton.innerHTML = `<i class="fas fa-pause"></i>`;

        playPause.append(playButton, pauseButton);

        let seek = document.createElement("div");
        seek.classList.add("player-seek");
        let seekInput = document.createElement("input");
        seekInput.type = "range";
        seekInput.value = 0;
        seekInput.min = 0;
        seekInput.max = PRECISION;
        seek.append(seekInput);

        let volume = document.createElement("div");
        volume.classList.add("player-volume");
        let volumeInput = document.createElement("input");
        volumeInput.min = 0;
        volumeInput.max = PRECISION;
        volumeInput.type = "range";
        let volumeUpIcon = document.createElement("i");
        volumeUpIcon.classList.add("fas", "fa-volume-up", "volume-up");
        let volumeMutedIcon = document.createElement("i");
        volumeMutedIcon.classList.add("fas", "fa-volume-mute", "volume-mute");
        volume.append(volumeInput, volumeUpIcon, volumeMutedIcon);

        controller.append(playPause, seek, volume);

        // Logic
        playButton.addEventListener("click", (e) => {
            playPause.classList.add("playing");
            playPause.classList.remove("paused");
            this.audio.play();
        });
        pauseButton.addEventListener("click", (e) => {
            playPause.classList.remove("playing");
            playPause.classList.add("paused");
            this.audio.pause();
        });
        seekInput.addEventListener("input", (e) => {
            this.audio.currentTime = seekInput.value / PRECISION;
        });
        this.audio.addEventListener("volumechange", (e) => {
            volumeInput.value = Math.floor(this.audio.volume * PRECISION);
            if (volumeInput.value == 0) {
                volume.classList.add("zero");
            } else {
                volume.classList.remove("zero");
            }
        });
        this.audio.addEventListener("pause", (e) => {
            pauseButton.click();
        });
        this.audio.addEventListener("play", (e) => {
            playButton.click();
        });
        this.audio.addEventListener("durationchange", (e) => {
            seekInput.max = Math.floor(this.audio.duration * PRECISION);
        });
        this.audio.addEventListener("timeupdate", (e) => {
            seekInput.value = this.audio.currentTime * PRECISION;
        });
        volumeInput.addEventListener("input", (e) => {
            this.audio.volume = volumeInput.value / PRECISION;
        });

        return controller;
    }

    _init() {
        this.audio = new Audio();
        this._title = document.createElement("div");
        this._title.classList.add("player-title");
        this._lyrics = document.createElement("div");
        this._lyrics.classList.add("player-lyrics");
        this._controls = this._createController();

        this.box.classList.add("player");
        this.box.append(this._title, this._lyrics, this._controls);
        this.box.addEventListener("dblclick", (e) => {
            if (
                document.fullScreen ||
                document.mozFullScreen ||
                document.webkitIsFullScreen
            ) {
                document.exitFullscreen();
            } else {
                this.box.requestFullscreen();
            }
        });

        this._title.textContent = "No song selected";

        // this.audio.controls = true;
        this.audio.volume = getAudioVolume();
        this.audio.addEventListener("volumechange", (e) =>
            saveAudioVolume(this.audio.volume)
        );
        this._visualiserInitialised = false;
        this._visualiserInitialised = true; // Disabled it for a very good reason
    }

    _loadLyrics(lyrics) {
        this._lyrics.innerHTML = "";
        for (let line of lyrics) {
            let _line = document.createElement("div");
            _line.classList.add("player-lyrics-line");

            _line.textContent = line;
            this._lyrics.append(_line);
        }
    }

    _showLine(index) {
        this._lyrics
            .querySelectorAll(".player-lyrics-line")
            .forEach((e) => e.classList.remove("current"));
        this._lyrics
            .querySelectorAll(".player-lyrics-line")
            [index].classList.add("current");

        let totalScroll = -this._lyrics.clientHeight / 2;
        this._lyrics.querySelectorAll(".player-lyrics-line").forEach((e, i) => {
            if (i < index) {
                totalScroll += e.clientHeight;
            }
        });

        this._lyrics.scrollTo({
            top: totalScroll,
            behavior: "smooth",
        });
        this.box.classList.add("base");

        setTimeout((e) => this.box.classList.remove("base"), 50);
    }

    _initVisualiser() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioContext = new AudioContext();
        const src = audioContext.createMediaElementSource(this.audio);
        const analyser = audioContext.createAnalyser();
        src.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const past = [];
        var lastIsBase = false;
        var box = this.box;
        function renderBase() {
            requestAnimationFrame(renderBase);
            var sorted = [...past].sort();
            var threshold =
                past.length > 0 ? sorted[sorted.length - 1] * 0.85 : 0;
            // console.log([...past].sort());
            const total = dataArray.reduce((acc, curr) => {
                return (acc += curr);
            }, 0);
            past.push(total);
            if (past.length > 64) {
                past.shift();
            }
            if (total > threshold && total != 0) {
                if (!lastIsBase) {
                    box.classList.add("base");
                }
            } else {
                lastIsBase = false;
                box.classList.remove("base");
            }

            analyser.getByteFrequencyData(dataArray);
        }
        renderBase();
    }

    play(song = new Song()) {
        this.stop();
        this.audio.src = song.source;
        this._title.textContent = song.title;
        this._loadLyrics(song.lyrics);
        var waiting = false;
        this._looper = setInterval(async () => {
            if (waiting) return;
            waiting = true;
            for (var i = 0; i < song.timings.length; i++) {
                const e = song.timings[i];

                if (e >= this.audio.currentTime * 1000) {
                    this._showLine(i);
                    break;
                }
            }

            var tillNext = song.timings[i + 1]
                ? song.timings[i + 1] - this.audio.currentTime * 1000 - 100
                : 10;

            await sleep(tillNext);
            waiting = false;
        }, 10);
        this.audio.addEventListener("canplaythrough", (e) => this.audio.play());
        // this.audio.addEventListener("canplay", (e) => this.audio.play());
        if (!this._visualiserInitialised) this._initVisualiser();
    }
    stop() {
        if (this._looper) {
            this.audio.pause();
            clearInterval(this._looper);
        }
    }
    enableDebug() {
        this.debugTimings = [];
        document.addEventListener("keydown", (e) => {
            if (e.key != " ") return;
            this.debugTimings.push(Math.floor(this.audio.currentTime * 1000));
            console.log(this.debugTimings);
        });
    }
}

function saveAudioVolume(volume = 1.0) {
    window.localStorage.setItem("player-volume", volume);
}

function getAudioVolume() {
    return parseFloat(window.localStorage.getItem("player-volume") || 1);
}

function printVisualiserTest(dataArray = []) {
    var testDiv = document.querySelector(".test");
    testDiv.innerHTML = "";
    for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i];
        var bar = document.createElement("div");
        bar.style.backgroundColor = "#000000";
        bar.style.height = "8px";
        bar.style.width = `${value / 100}px`;
        testDiv.append(bar);
    }
}
