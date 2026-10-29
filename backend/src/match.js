const normalize = (value) => value.trim().toLowerCase();

const toTenScale = (matched, total) =>
  total ? Math.max(1, Math.round((matched / total) * 100) / 10) : 0;

export function matchJob(job, candidate) {
  const skills = new Set(candidate.skills.map(normalize));
  const required = job.requiredSkills.map((skill) => ({
    skill,
    matched: skills.has(normalize(skill))
  }));

  const matchedSkills = required
    .filter((item) => item.matched)
    .map((item) => item.skill);

  const missingSkills = required
    .filter((item) => !item.matched)
    .map((item) => item.skill);

  const score = toTenScale(matchedSkills.length, required.length);

  return {
    ...job,
    score,
    matchedSkills,
    missingSkills,
    inReviewQueue: score >= 6,
    explanation: `${matchedSkills.length} of ${required.length} listed required skills matched. This is a screening estimate, not proof of qualification.`
  };
}
