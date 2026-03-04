export function calculateNextSequence(
    quality: number,
    repetitions: number,
    easiness: number,
    interval: number
) {
    let newRepetitions = repetitions;
    let newInterval = interval; // in days
    let newEasiness = easiness;

    if (quality <= 1) {
        newRepetitions = 0;
        newInterval = 1 / (24 * 60); // 1 min (Again)
    } else if (quality === 2 || quality === 3) {
        if (repetitions === 0) {
            newInterval = 5 / (24 * 60); // 5 min (Hard)
        } else {
            newInterval = Math.max(1 / 24, Math.round(interval * 1.2 * 100) / 100); 
        }
        newRepetitions = Math.max(0, repetitions - 1);
    } else if (quality === 4) {
        if (repetitions === 0) {
            newInterval = 30 / (24 * 60); // 30 min (Good)
        } else if (repetitions === 1) {
            newInterval = 1; // 1 day
        } else {
            newInterval = Math.round(interval * easiness * 100) / 100;
        }
        newRepetitions += 1;
    } else if (quality >= 5) {
        if (repetitions === 0) {
            newInterval = 12 / 24; // 12 hours (Easy)
        } else if (repetitions === 1) {
            newInterval = 4; // 4 days
        } else {
            newInterval = Math.round(interval * easiness * 1.3 * 100) / 100;
        }
        newRepetitions += 1;
    }

    newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEasiness < 1.3) newEasiness = 1.3;

    return { 
        newRepetitions, 
        newEasiness, 
        newInterval 
    };
}

function pluralizeRu(n: number, forms: [string, string, string]) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
}

export function formatIntervalUI(days: number): string {
    const mins = Math.round(days * 24 * 60);
    if (mins < 60) {
        return `${mins} ${pluralizeRu(mins, ["минута", "минуты", "минут"])}`;
    }
    const hours = Math.round(days * 24);
    if (hours < 24) {
        return `${hours} ${pluralizeRu(hours, ["час", "часа", "часов"])}`;
    }
    const roundDays = Math.round(days);
    if (roundDays < 30) {
        return `${roundDays} ${pluralizeRu(roundDays, ["день", "дня", "дней"])}`;
    }
    if (roundDays < 365) {
        const months = Math.round(roundDays / 30);
        return `${months} ${pluralizeRu(months, ["месяц", "месяца", "месяцев"])}`;
    }
    const years = Math.round(roundDays / 365);
    return `${years} ${pluralizeRu(years, ["год", "года", "лет"])}`;
}
