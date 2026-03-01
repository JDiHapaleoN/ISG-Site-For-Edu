import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // 1. Clear existing (optional, but good for idempotent seeding)
    // await prisma.mathTerm.deleteMany()
    // await prisma.algorithm.deleteMany()

    // 2. Seed Glossary
    const glossaryItems = [
        {
            termRu: "Производная",
            termEn: "Derivative",
            termDe: "die Ableitung",
            definitionRu: "Основное понятие дифференциального исчисления, характеризующее скорость изменения функции.",
            formula: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
        },
        {
            termRu: "Определенный интеграл",
            termEn: "Definite Integral",
            termDe: "das bestimmte Integral",
            definitionRu: "Площадь криволинейной трапеции, ограниченной графиком функции.",
            formula: "\\int_{a}^{b} f(x) \\,dx = F(b) - F(a)",
        },
        {
            termRu: "Теорема Пифагора",
            termEn: "Pythagorean theorem",
            termDe: "der Satz des Pythagoras",
            definitionRu: "В прямоугольном треугольнике квадрат длины гипотенузы равен сумме квадратов длин катетов.",
            formula: "a^2 + b^2 = c^2",
        },
        {
            termRu: "Корни квадратного уравнения",
            termEn: "Quadratic Equation Roots",
            termDe: "die Nullstellen der quadratischen Gleichung",
            definitionRu: "Решения уравнения вида ax^2 + bx + c = 0.",
            formula: "x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        },
        // --- Trigonometry ---
        {
            termRu: "Основное тригонометрическое тождество",
            termEn: "Fundamental Trigonometric Identity",
            termDe: "Trigonometrischer Pythagoras",
            definitionRu: "Сумма квадратов синуса и косинуса одного и того же угла равна единице.",
            formula: "\\sin^2(\\alpha) + \\cos^2(\\alpha) = 1",
        },
        {
            termRu: "Синус суммы углов",
            termEn: "Sine of the Sum of Angles",
            termDe: "Additionstheoreme für Sinus",
            definitionRu: "Формула для вычисления синуса суммы двух углов.",
            formula: "\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta",
        },
        {
            termRu: "Косинус суммы углов",
            termEn: "Cosine of the Sum of Angles",
            termDe: "Additionstheoreme für Kosinus",
            definitionRu: "Формула для вычисления косинуса суммы двух углов.",
            formula: "\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta",
        },
        {
            termRu: "Синус двойного угла",
            termEn: "Double-Angle Sine",
            termDe: "Doppelwinkelformeln Sinus",
            definitionRu: "Формула синуса для угла в два раза больше исходного.",
            formula: "\\sin(2\\alpha) = 2\\sin\\alpha\\cos\\alpha",
        },
        {
            termRu: "Косинус двойного угла",
            termEn: "Double-Angle Cosine",
            termDe: "Doppelwinkelformeln Kosinus",
            definitionRu: "Формула косинуса для угла в два раза больше исходного.",
            formula: "\\cos(2\\alpha) = \\cos^2\\alpha - \\sin^2\\alpha = 2\\cos^2\\alpha - 1 = 1 - 2\\sin^2\\alpha",
        },
        {
            termRu: "Тангенс двойного угла",
            termEn: "Double-Angle Tangent",
            termDe: "Doppelwinkelformeln Tangens",
            definitionRu: "Формула тангенса для угла в два раза больше исходного.",
            formula: "\\tan(2\\alpha) = \\frac{2\\tan\\alpha}{1 - \\tan^2\\alpha}",
        },
        // --- Integrals Table ---
        {
            termRu: "Таблица интегралов: Синус",
            termEn: "Integral of Sine",
            termDe: "Integral von Sinus",
            definitionRu: "Первообразная функции синус.",
            formula: "\\int \\sin x \\, dx = -\\cos x + C",
        },
        {
            termRu: "Таблица интегралов: Косинус",
            termEn: "Integral of Cosine",
            termDe: "Integral von Kosinus",
            definitionRu: "Первообразная функции косинус.",
            formula: "\\int \\cos x \\, dx = \\sin x + C",
        },
        {
            termRu: "Таблица интегралов: Экспонента",
            termEn: "Integral of Exponential",
            termDe: "Integral der Exponentialfunktion",
            definitionRu: "Первообразная показательной функции с основанием e.",
            formula: "\\int e^x \\, dx = e^x + C",
        },
        {
            termRu: "Таблица интегралов: Логарифм",
            termEn: "Integral of 1/x",
            termDe: "Integral von 1/x",
            definitionRu: "Первообразная обратной пропорциональности.",
            formula: "\\int \\frac{1}{x} \\, dx = \\ln|x| + C",
        },
        // --- Algebra ---
        {
            termRu: "Логарифм",
            termEn: "Logarithm",
            termDe: "der Logarithmus",
            definitionRu: "Показатель степени, в которую нужно возвести основание, чтобы получить данное число.",
            formula: "\\log_a b = c \\iff a^c = b",
        },
        {
            termRu: "Логарифм произведения",
            termEn: "Logarithm of a Product",
            termDe: "Logarithmus eines Produkts",
            definitionRu: "Логарифм произведения равен сумме логарифмов множителей.",
            formula: "\\log_a(xy) = \\log_a x + \\log_a y",
        },
        {
            termRu: "Производная степенной функции",
            termEn: "Derivative of Power Function",
            termDe: "Ableitung einer Potenzfunktion",
            definitionRu: "Формула дифференцирования функции вида x^n.",
            formula: "(x^n)' = nx^{n-1}",
        },
        {
            termRu: "Дискриминант",
            termEn: "Discriminant",
            termDe: "die Diskriminante",
            definitionRu: "Выражение, определяющее число корней квадратного уравнения.",
            formula: "D = b^2 - 4ac",
        },
        {
            termRu: "Арифметическая прогрессия",
            termEn: "Arithmetic Progression",
            termDe: "Arithmetische Folge",
            definitionRu: "Последовательность, в которой каждый член получается из предыдущего прибавлением постоянного числа.",
            formula: "a_n = a_1 + (n-1)d",
        },
        {
            termRu: "Геометрическая прогрессия",
            termEn: "Geometric Progression",
            termDe: "Geometrische Folge",
            definitionRu: "Последовательность, в которой каждый член получается из предыдущего умножением на постоянное число.",
            formula: "b_n = b_1 \\cdot q^{n-1}",
        },
        // --- Geometry ---
        {
            termRu: "Теорема Косинусов",
            termEn: "Law of Cosines",
            termDe: "Kosinussatz",
            definitionRu: "Квадрат стороны треугольника равен сумме квадратов двух других сторон минус их удвоенное произведение на косинус угла между ними.",
            formula: "c^2 = a^2 + b^2 - 2ab\\cos\\gamma",
        },
        {
            termRu: "Теорема Синусов",
            termEn: "Law of Sines",
            termDe: "Sinussatz",
            definitionRu: "Стороны треугольника пропорциональны синусам противолежащих углов.",
            formula: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R",
        },
        {
            termRu: "Формула Герона",
            termEn: "Heron's Formula",
            termDe: "Satz des Heron",
            definitionRu: "Позволяет вычислить площадь треугольника по трем его сторонам.",
            formula: "S = \\sqrt{p(p-a)(p-b)(p-c)}, \\, p = \\frac{a+b+c}{2}",
        },
        {
            termRu: "Площадь круга",
            termEn: "Area of a Circle",
            termDe: "Kreisfläche",
            definitionRu: "Величина части плоскости, ограниченной окружностью.",
            formula: "S = \\pi r^2",
        },
        {
            termRu: "Площадь поверхности сферы",
            termEn: "Surface Area of a Sphere",
            termDe: "Oberfläche einer Kugel",
            definitionRu: "Площадь всей поверхности шара.",
            formula: "S = 4\\pi r^2",
        },
        {
            termRu: "Объем сферы",
            termEn: "Volume of a Sphere",
            termDe: "Kugelvolumen",
            definitionRu: "Количество пространства, занимаемого шаром.",
            formula: "V = \\frac{4}{3}\\pi r^3",
        },
        {
            termRu: "Объем цилиндра",
            termEn: "Volume of a Cylinder",
            termDe: "Zylindervolumen",
            definitionRu: "Количество пространства внутри цилиндра.",
            formula: "V = \\pi r^2 h",
        },
        {
            termRu: "Объем конуса",
            termEn: "Volume of a Cone",
            termDe: "Kegelvolumen",
            definitionRu: "Количество пространства внутри конуса.",
            formula: "V = \\frac{1}{3}\\pi r^2 h",
        }
    ];

    for (const item of glossaryItems) {
        await prisma.mathTerm.upsert({
            where: { id: `seed-${item.termEn.toLowerCase().replace(/\s+/g, '-')}` },
            update: {},
            create: {
                id: `seed-${item.termEn.toLowerCase().replace(/\s+/g, '-')}`,
                ...item
            }
        })
    }

    // 3. Seed Algorithms
    const algorithms = [
        {
            id: "seed-algo-parts",
            title: "Интегрирование по частям (Integration by Parts)",
            description: "Метод вычисления интеграла от произведения двух функций.",
            formula: "\\int u \\, dv = uv - \\int v \\, du",
            steps: [
                { text: "Определите функции $u$ и $dv$.", math: "u = f(x), \\, dv = g(x)dx", order: 1 },
                { text: "Найдите $du$.", math: "du = f'(x)dx", order: 2 },
                { text: "Найдите $v$.", math: "v = \\int g(x)dx", order: 3 },
                { text: "Подставьте в формулу.", math: "uv - \\int v \\, du", order: 4 },
            ]
        },
        {
            id: "seed-algo-quadratic",
            title: "Решение квадратного уравнения",
            description: "Пошаговый алгоритм нахождения корней через дискриминант.",
            formula: "ax^2 + bx + c = 0",
            steps: [
                { text: "Выпишите коэффициенты a, b, c.", math: "a=..., b=..., c=...", order: 1 },
                { text: "Вычислите дискриминант D.", math: "D = b^2 - 4ac", order: 2 },
                { text: "Проверьте знак D. Если D > 0, будет 2 корня.", math: "D > 0", order: 3 },
                { text: "Найдите корни по формуле.", math: "x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}", order: 4 },
            ]
        },
        {
            id: "seed-algo-sines",
            title: "Применение теоремы синусов",
            description: "Используется для нахождения сторон или углов в любом треугольнике.",
            formula: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B}",
            steps: [
                { text: "Запишите известные стороны и углы.", math: "a, \\angle A, b, ...", order: 1 },
                { text: "Составьте пропорцию.", math: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B}", order: 2 },
                { text: "Выразите неизвестную величину.", math: "b = \\frac{a \\cdot \\sin B}{\\sin A}", order: 3 },
                { text: "Вычислите значение.", math: "b = ...", order: 4 },
            ]
        }
    ];

    for (const algo of algorithms) {
        const { steps, ...algoData } = algo;
        await prisma.algorithm.upsert({
            where: { id: algo.id },
            update: {},
            create: {
                ...algoData,
                steps: {
                    create: steps
                }
            }
        })
    }

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
