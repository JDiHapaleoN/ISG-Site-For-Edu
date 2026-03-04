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
            { phrase: "As far as I'm concerned...", translation: "Насколько мне известно / лично для меня..." },
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
    },
    {
        id: "giving-examples",
        name: "Giving Examples",
        description: "Clarifying your points with concrete examples (Crucial for Band 7+).",
        phrases: [
            { phrase: "To give you an idea...", translation: "Чтобы дать вам представление..." },
            { phrase: "A prime example of this would be...", translation: "Ярким примером этого могло бы стать..." },
            { phrase: "Take... for instance", translation: "Возьмем, например, ..." },
            { phrase: "Namely...", translation: "А именно..." }
        ]
    },
    {
        id: "conclusion",
        name: "Summarizing & Concluding",
        description: "Wrapping up your Part 2 or Part 3 answers neatly.",
        phrases: [
            { phrase: "To sum up...", translation: "Подводя итог..." },
            { phrase: "Ultimately...", translation: "В конечном итоге..." },
            { phrase: "All things considered...", translation: "Учитывая все обстоятельства..." },
            { phrase: "Taking everything into consideration...", translation: "Принимая всё во внимание..." }
        ]
    }
];

export const SPEAKING_TEMPLATES_DE: RedemittelCategory[] = [
    {
        id: "intro",
        name: "Einleitung & Strukturierung",
        description: "Phrasen für den Einstieg in die Antwort (Teil 2: Diskussion).",
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
        description: "Nützlich für die Beschreibung von Diagrammen oder Bildern im Goethe-Zertifikat.",
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
        description: "Vor- und Nachteile abwägen (Teil 2: Diskussion / Teil 1: Vortrag).",
        phrases: [
            { phrase: "Einerseits..., andererseits...", translation: "С одной стороны..., с другой стороны..." },
            { phrase: "Ein Vorteil ist, dass...", translation: "Одним из преимуществ является то, что..." },
            { phrase: "Demgegenüber steht...", translation: "Этому противостоит..." },
            { phrase: "Zwar..., aber...", translation: "Хотя..., но..." },
            { phrase: "Es ist zweifelhaft, ob...", translation: "Сомнительно, что..." }
        ]
    },
    {
        id: "examples",
        name: "Beispiele geben & Begründen",
        description: "Argumente stützen (Sehr wichtig für das Goethe-Zertifikat B2/C1).",
        phrases: [
            { phrase: "Ein gutes Beispiel dafür ist...", translation: "Хорошим примером этого является..." },
            { phrase: "Dies lässt sich an folgendem Beispiel veranschaulichen:", translation: "Это можно проиллюстрировать на следующем примере:" },
            { phrase: "Der Grund dafür liegt in der Tatsache, dass...", translation: "Причина этого заключается в том, что..." },
            { phrase: "Das liegt vor allem daran, dass...", translation: "Прежде всего это связано с тем, что..." }
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
    { id: "tech", title: "Technology", question: "How is technology changing the way we communicate?", context: "Part 3: Evaluation" },
    { id: "env", title: "Environment", question: "What are the most serious environmental problems in your country?", context: "Part 3: Global Issues" },
    { id: "edu", title: "Education", question: "Describe a teacher who has influenced you in your education.", context: "Part 2: Description" },
    { id: "hobbies", title: "Leisure Time", question: "Why do you think some people prefer active hobbies while others prefer passive ones?", context: "Part 3: Comparison" },
    { id: "travel", title: "Tourism", question: "What are the advantages and disadvantages of mass tourism in historical cities?", context: "Part 3: Argumentation" },
    { id: "work", title: "Future Careers", question: "Do you think AI will eventually replace most human jobs?", context: "Part 3: Speculation" },
    { id: "health", title: "Health & Diet", question: "Describe a successful change you made in your lifestyle to improve your health.", context: "Part 2: Description" }
];

export const SPEAKING_TOPICS_DE: SpeakingTopic[] = [
    { id: "studi", title: "Studiengebühren", question: "Sollten Studiengebühren an deutschen Universitäten eingeführt werden?", context: "Teil 2: Diskussion" },
    { id: "arbeit", title: "Homeoffice", question: "Welche Vor- und Nachteile hat die zunehmende Verbreitung von Homeoffice?", context: "Teil 2: Diskussion" },
    { id: "umwelt", title: "Klimawandel", question: "Welche Rolle spielt der Einzelne beim Klimaschutz und was kann die Regierung tun?", context: "Teil 1: Vortrag" },
    { id: "verkehr", title: "Verkehrsmittel", question: "Wie können wir Menschen dazu motivieren, häufiger öffentliche Verkehrsmittel zu nutzen?", context: "Teil 2: Diskussion" },
    { id: "digital", title: "Digitalisierung", question: "Sollten gedruckte Schulbücher komplett durch Tablets ersetzt werden?", context: "Teil 2: Diskussion" },
    { id: "gesundheit", title: "Gesundheit", question: "Beschreiben Sie eine Grafik oder ein Bild über den Fast-Food-Konsum von Jugendlichen.", context: "Teil 1: Präsentation" },
    { id: "wohnen", title: "Wohnungsnot", question: "Welche Maßnahmen könnten gegen die Wohnungsnot in Großstädten ergriffen werden?", context: "Teil 2: Problemlösung" }
];
