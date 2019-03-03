const difficulty = 2;  // orig = 4
const factor = difficulty / 4;

export default {
    game: {
        status: 'over',
        range: {
            min: 0,
            max: 400,
        },
        size: {
            width: 288,
            height: 512,
        },
    },
    player: {
        score: 0,
    },
    bird: {
        size: {
            width: 36,
            height: 40,  // Also replace in index.css:42, 55, 58, 61 (greater to show the full image)
        },
        status: 'normal',
        height: 188,
        force: 0,
        originalHeight: 188,
        flyHeight: 300 * factor,  // px, height per second if force equals 1
        dropTime: 1400 / (factor / 1.5),  // ms for dropping from top to bottom
        timestamp: 0,
    },
    pipings: {
        timestamp: 0,
        interval: 1600 / factor,
        speed: 2800 / factor,
        size: {
            width: 52,
        },
        range: {
            x: {
                min: 0,
                max: 340,
            },
            y: {
                min: 40,
                max: 242,
            },
            gap: 112,
        },
        list: [],
    },
}
