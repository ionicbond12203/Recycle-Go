export const GameMechanics = {
    LEVELS: {
        NOVICE: { MIN: 0, NAME_KEY: 'profile.level.novice' },
        WARRIOR: { MIN: 1000, NAME_KEY: 'profile.level.warrior' },
        MASTER: { MIN: 5000, NAME_KEY: 'profile.level.master' },
        LEGEND: { MIN: 10000, NAME_KEY: 'profile.level.legend' },
    },
    POINTS: {
        PER_KG: 10,
        CO2_PER_KG: 0.5,
    },
    COMMISSION: {
        RATE_PER_KG: 0.50,
    },
    MAP: {
        DEFAULT_DELTA: 0.01,
        ANIMATION_DURATION: 1000,
        EARTH_RADIUS: 6371e3,
        DRIVING_VIEW: {
            pitch: 75,
            zoom: 19.5,
            altitude: 15
        }
    }
};
