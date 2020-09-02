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

    _init() {
        this._title = document.createElement("div");
        this._title.classList.add("player-title");
        this._lyrics = document.createElement("div");
        this._lyrics.classList.add("player-lyrics");
        this._controls = document.createElement("div");
        this._controls.classList.add("player-controls");

        this.box.classList.add("player");
        this.box.append(this._title, this._lyrics, this._controls);

        this._title.textContent = "No song selected";

        this.audio = new Audio();
        this.audio.controls = true;
        this._controls.append(this.audio);
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

        console.log({ totalScroll });

        this._lyrics.scrollTo({
            top: totalScroll,
            behavior: "smooth",
        });
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
    }
    stop() {
        if (this._looper) {
            clearInterval(this._looper);
            this.audio.pause();
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
