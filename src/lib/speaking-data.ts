export interface RedemittelCategory {
    id: string;
    name: string;
    description: string;
    phrases: {
        phrase: string;
        translation: string;
        explanation?: string;
    }[];
}

export const SPEAKING_TEMPLATES_EN: RedemittelCategory[] = [
    {
        id: "intro",
        name: "Introduction & Structuring",
        description: "Phrases to start your answer or structure a long turn (Part 2).",
        phrases: [
            { phrase: "To begin with...", translation: "Для начала..." },
            { phrase: "First of all, I'd like to mention...", translation: "Прежде всего, я хотел бы упомянуть..." },
            { phrase: "The first point I'd like to make is...", translation: "Первый момент, который я хотел бы отметить..." },
            { phrase: "Moving on to the next point...", translation: "Переходя к следующему пункту..." },
            { phrase: "Lastly, I should mention...", translation: "Напоследок, я должен упомянуть..." }
        ]
    },
    {
        id: "opinions",
        name: "Expressing Opinions",
        description: "Ways to sound more natural and academic when giving your view.",
        phrases: [
            { phrase: "From my perspective...", translation: "С моей точки зрения..." },
            { phrase: "I'm inclined to believe that...", translation: "Я склонен полагать, что..." },
            { phrase: "I'm of the opinion that...", translation: "Я придерживаюсь мнения, что..." },
            { phrase: "As far as I'm concerned...", translation: "Насколько мне известно / насколько это касается меня..." },
            { phrase: "It seems to me that...", translation: "Мне кажется, что..." }
        ]
    },
    {
        id: "comparisons",
        name: "Comparing & Contrasting",
        description: "Essential for Part 3 and describing graphs.",
        phrases: [
            { phrase: "On the other hand...", translation: "С другой стороны..." },
            { phrase: "While X is beneficial, Y can be...", translation: "В то время как X полезен, Y может быть..." },
            { phrase: "In stark contrast to...", translation: "В резком контрасте с..." },
            { phrase: "Similarly...", translation: "Аналогично..." },
            { phrase: "Conversely...", translation: "Напротив..." }
        ]
    },
    {
        id: "buying-time",
        name: "Buying Time (Thinking Aloud)",
        description: "Natural fillers to give you a few seconds to think.",
        phrases: [
            { phrase: "That's an interesting question...", translation: "Это интересный вопрос..." },
            { phrase: "I haven't thought about that before, but...", translation: "Я раньше об этом не задумывался, но..." },
            { phrase: "Let me see...", translation: "Дайте подумать..." },
            { phrase: "It's a complex issue, but I suppose...", translation: "Это сложный вопрос, но я полагаю..." }
        ]
    }
];

export const SPEAKING_TEMPLATES_DE: RedemittelCategory[] = [
    {
        id: "intro",
        name: "Einleitung & Strukturierung",
        description: "Phrasen für den Einstieg in die Antwort oder zur Strukturierung langer Sätze (Aufgabe 3/4).",
        phrases: [
            { phrase: "Zunächst einmal möchte ich feststellen...", translation: "Прежде всего, я хотел бы констатировать..." },
            { phrase: "Ein wichtiger Aspekt in diesem Zusammenhang ist...", translation: "Важным аспектом в этой связи является..." },
            { phrase: "Darüber hinaus lässt sich sagen...", translation: "Кроме того, можно сказать..." },
            { phrase: "Zusammenfassend lässt sich sagen...", translation: "В итоге можно сказать..." },
            { phrase: "Abschließend möchte ich betonen...", translation: "В заключение я хотел бы подчеркнуть..." }
        ]
    },
    {
        id: "opinions",
        name: "Meinungsäußerung",
        description: "Möglichkeiten, die eigene wissenschaftliche Meinung auszudrücken.",
        phrases: [
            { phrase: "Meiner Meinung nach...", translation: "По моему мнению..." },
            { phrase: "Ich bin der Ansicht, dass...", translation: "Я считаю, что..." },
            { phrase: "Ich stehe auf dem Standpunkt, dass...", translation: "Я стою на той точке зрения, что..." },
            { phrase: "Meines Erachtens...", translation: "По моему убеждению..." },
            { phrase: "Ich bin davon überzeugt, dass...", translation: "Я убежден в том, что..." }
        ]
    },
    {
        id: "charts",
        name: "Grafikbeschreibung",
        description: "Besonders nützlich für die Aufgaben 3 und 5 des TestDaF.",
        phrases: [
            { phrase: "Die Grafik liefert Informationen über...", translation: "График предоставляет информацию о..." },
            { phrase: "An erster Stelle steht...", translation: "На первом месте стоит..." },
            { phrase: "Im Vergleich zu...", translation: "По сравнению с..." },
            { phrase: "Es lässt sich eine steigende Tendenz feststellen.", translation: "Можно констатировать тенденцию к росту." },
            { phrase: "Der Anteil an... ist gesunken.", translation: "Доля ... снизилась." }
        ]
    },
    {
        id: "arguments",
        name: "Argumentation",
        description: "Vor- und Nachteile abwägen (Aufgabe 4 und 6).",
        phrases: [
            { phrase: "Einerseits..., andererseits...", translation: "С одной стороны..., с другой стороны..." },
            { phrase: "Ein Vorteil ist, dass...", translation: "Одним из преимуществ является то, что..." },
            { phrase: "Demgegenüber steht...", translation: "Этому противостоит..." },
            { phrase: "Zwar..., aber...", translation: "Хотя..., но..." },
            { phrase: "Es ist zweifelhaft, ob...", translation: "Сомнительно, что..." }
        ]
    }
];

export type SpeakingTopic = {
    id: string;
    title: string;
    question: string;
    context: string;
};

export const SPEAKING_TOPICS_EN: SpeakingTopic[] = [
    { id: "tech", title: "Technology", question: "How is technology changing the way we communicate?", context: "IELTS Part 3 Style" },
    { id: "env", title: "Environment", question: "What are the most serious environmental problems in your country?", context: "IELTS Part 3 Style" },
    { id: "edu", title: "Education", question: "Describe a teacher who has influenced you in your education.", context: "IELTS Part 2 Style" }
];

export const SPEAKING_TOPICS_DE: SpeakingTopic[] = [
    { id: "studi", title: "Studium", question: "Sollten Studiengebühren eingeführt werden?", context: "TestDaF Aufgabe 4 Style" },
    { id: "arbeit", title: "Arbeitswelt", question: "Welche Vor- und Nachteile hat das Homeoffice?", context: "TestDaF Aufgabe 4 Style" },
    { id: "umwelt", title: "Umweltschutz", question: "Welche Rolle spielt der Einzelne beim Klimaschutz?", context: "TestDaF Aufgabe 6 Style" }
];
