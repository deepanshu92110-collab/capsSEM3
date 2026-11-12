import test from "node:test";
import assert from "node:assert/strict";
import { scoreSkills } from "../src/utils/matchingAlgorithm.js";
import { mentionsSkill } from "../src/utils/skillText.js";

const student = [
  { proficiencyLevel: "ADVANCED", skill: { name: "HTML" } },
  { proficiencyLevel: "INTERMEDIATE", skill: { name: "JavaScript" } },
];
const required = [
  { skill: { name: "HTML" }, proficiencyLevel: "INTERMEDIATE", weight: 1 },
  { skill: { name: "JavaScript" }, proficiencyLevel: "ADVANCED", weight: 1 },
  { skill: { name: "TypeScript" }, proficiencyLevel: "INTERMEDIATE", weight: 1 },
];

test("matching score is deterministic and explains matched, partial, and missing skills", () => {
  const result = scoreSkills(student, required);
  assert.equal(result.percentage, 50);
  assert.deepEqual(result.matched.map((item) => item.skill), ["HTML"]);
  assert.deepEqual(result.partiallyMatched.map((item) => item.skill), ["JavaScript"]);
  assert.deepEqual(result.missing.map((item) => item.skill), ["TypeScript"]);
  assert.equal(result.earnedPoints, 1.5);
  assert.equal(result.possiblePoints, 3);
  assert.match(result.formula, /earned fraction/);
});

test("matching honors custom weights and gives zero when there are no requirements", () => {
  const weighted = scoreSkills(student, [
    { skill: { name: "HTML" }, proficiencyLevel: "BEGINNER", weight: 3 },
    { skill: { name: "TypeScript" }, proficiencyLevel: "BEGINNER", weight: 1 },
  ]);
  assert.equal(weighted.percentage, 75);
  assert.equal(scoreSkills(student, []).percentage, 0);
});

test("skill text matching handles punctuation and avoids substring false positives", () => {
  assert.equal(mentionsSkill("Built JavaScript and C++ apps", "Java"), false);
  assert.equal(mentionsSkill("Built Java and C++ apps", "C++"), true);
  assert.equal(mentionsSkill("Worked with node.js and TypeScript", "Node.js"), true);
});
