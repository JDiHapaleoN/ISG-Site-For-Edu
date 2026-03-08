export function calculateNextSequence(
    quality: number,
    repetitions: number,
    easiness: number,
    interval: number
) {
    let newRepetitions = repetitions;
    let newInterval = interval; // in days
    let newEasiness = easiness;

    // quality 0 = Reset to "due now"
    if (quality === 0) {
        newRepetitions = 0;
        newInterval = 0;
        newEasiness = 1.3;
        return { newRepetitions, newEasiness, newInterval };
    }

    // FIXED intervals for every word, regardless of its state:
    // quality 1 = Снова → 1 minute
    if (quality === 1) {
        newRepetitions = 0;
        newInterval = 1 / (24 * 60); // 1 min
    }
    // quality 2-3 = Сложно → 5 minutes
    else if (quality === 2 || quality === 3) {
        newRepetitions = 0;
        newInterval = 5 / (24 * 60); // 5 min
    }
    // quality 4 = Хорошо → 10 minutes
    else if (quality === 4) {
        newRepetitions = repetitions + 1;
        newInterval = 10 / (24 * 60); // 10 min
    }
    // quality 5 = Легко → always 1 day
    else if (quality >= 5) {
        newRepetitions = repetitions + 1;
        newInterval = 1; // always 1 day
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
    if (days <= 0) return "Сейчас";

    const mins = Math.floor(days * 24 * 60);
    if (mins < 60) {
        return `${mins} ${pluralizeRu(mins, ["минута", "минуты", "минут"])}`;
    }
    const hours = Math.floor(days * 24);
    if (hours < 24) {
        return `${hours} ${pluralizeRu(hours, ["час", "часа", "часов"])}`;
    }
    const roundedDays = Math.round(days);
    if (roundedDays < 30) {
        return `${roundedDays} ${pluralizeRu(roundedDays, ["день", "дня", "дней"])}`;
    }
    if (roundedDays < 365) {
        const months = Math.round(roundedDays / 30);
        return `${months} ${pluralizeRu(months, ["месяц", "месяца", "месяцев"])}`;
    }
    const years = Math.round(roundedDays / 365);
    return `${years} ${pluralizeRu(years, ["год", "года", "лет"])}`;
}

