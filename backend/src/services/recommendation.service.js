const catalog = {
  TypeScript: [{ title: "TypeScript Fundamentals", description: "Learn types, interfaces, unions and compiler checks.", difficulty: "BEGINNER" }, { title: "TypeScript for React Developers", description: "Apply TypeScript to components, props and hooks.", difficulty: "INTERMEDIATE" }],
  Testing: [{ title: "JavaScript Testing Basics", description: "Learn assertions, test structure and unit testing.", difficulty: "BEGINNER" }, { title: "React Testing Library Fundamentals", description: "Test React components through user interactions.", difficulty: "INTERMEDIATE" }],
  default: [{ title: "{skill} Fundamentals", description: "Build the core concepts and practical foundations for {skill}.", difficulty: "BEGINNER" }],
};
export function suggestionsFor(skill, reason, priority = 3) {
  return (catalog[skill.name] ?? catalog.default).map((item) => ({ skillId: skill.id, title: item.title.replaceAll("{skill}", skill.name), description: `${item.description} Gap: ${reason}.`, difficulty: item.difficulty, priority, resourceUrl: null }));
}
