class Song {
    constructor({ lyrics = [], timings = [], title = "", source = "" }) {
        if (lyrics.length < timings.length) {
            throw new Error("Number of Lyrics < the number of Timings");
        }
        this.source = source;
        this.title = title;
        this.lyrics = lyrics;
        this.timings = timings;
    }
}
