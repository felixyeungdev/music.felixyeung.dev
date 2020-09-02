class Song {
    constructor({
        lyrics = [],
        timings = [],
        title = "",
        source = "",
        tempo = 0,
        beat = 0,
        beatsDelay = 0,
        beats = [],
    }) {
        if (lyrics.length < timings.length) {
            throw new Error("Number of Lyrics < the number of Timings");
        }
        this.source = source;
        this.title = title;
        this.lyrics = lyrics;
        this.timings = timings;
        this.tempo = tempo;
        this.beat = beat;
        this.beats = beats;
        this.beatsDelay = beatsDelay;
    }
}
