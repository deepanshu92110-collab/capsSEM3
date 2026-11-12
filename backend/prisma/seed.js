import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const skills = [
  ["HTML", "TECHNICAL"], ["CSS", "TECHNICAL"], ["JavaScript", "TECHNICAL"], ["React", "TECHNICAL"], ["Node.js", "TECHNICAL"], ["Python", "TECHNICAL"], ["Java", "TECHNICAL"], ["C++", "TECHNICAL"], ["SQL", "TECHNICAL"], ["PostgreSQL", "TECHNICAL"], ["MongoDB", "TECHNICAL"], ["Git", "TECHNICAL"], ["Docker", "TECHNICAL"], ["TypeScript", "TECHNICAL"], ["Testing", "TECHNICAL"], ["Communication", "SOFT"], ["Leadership", "SOFT"], ["Teamwork", "SOFT"], ["Problem Solving", "SOFT"], ["Critical Thinking", "SOFT"], ["Project Management", "OTHER"], ["UI/UX Design", "OTHER"], ["Data Analysis", "OTHER"],
];
const bank = {
  HTML: [{ q: "Which element represents the main content of a document?", o: ["<main>", "<aside>", "<footer>", "<summary>"], a: 0, e: "<main> identifies the dominant content of the document." }, { q: "Which attribute provides alternate text for an image?", o: ["title", "alt", "caption", "role"], a: 1, e: "alt text describes an image when it cannot be seen." }],
  JavaScript: [{ q: "Which declaration creates a block-scoped variable that can be reassigned?", o: ["var", "let", "const", "static"], a: 1, e: "let is block-scoped and allows reassignment." }, { q: "What does Array.prototype.map return?", o: ["A new transformed array", "The original array only", "A boolean", "An iterator"], a: 0, e: "map creates a new array from each callback result." }],
  React: [{ q: "Which hook stores local component state?", o: ["useState", "useMemo", "useRef", "useId"], a: 0, e: "useState adds state to a function component." }, { q: "Why are keys used when rendering lists?", o: ["To style elements", "To identify items across renders", "To sort arrays", "To prevent events"], a: 1, e: "Stable keys help React track list items." }],
};
try {
  for (const [name, category] of skills) {
    const skill = await prisma.skill.upsert({ where: { name }, create: { name, category, description: `${name} skill` }, update: { category } });
    const questions = bank[name];
    if (!questions) continue;
    const existing = await prisma.assessment.findFirst({ where: { skillId: skill.id, title: `${name} Fundamentals` } });
    if (existing) continue;
    await prisma.assessment.create({ data: { skillId: skill.id, title: `${name} Fundamentals`, description: `Foundational ${name} knowledge check`, totalQuestions: questions.length, questions: { create: questions.map((item) => ({ question: item.q, options: item.o, correctAnswer: item.a, explanation: item.e })) } } });
  }
} finally { await prisma.$disconnect(); }
