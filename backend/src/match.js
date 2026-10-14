const normalize = (value) => value.trim().toLowerCase();

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

  const score = required.length
    ? Math.round((matchedSkills.length / required.length) * 100)
    : 0;

  return {
    ...job,
    score,
    matchedSkills,
    missingSkills,
    inReviewQueue: score >= 60,
    explanation: `${matchedSkills.length} of ${required.length} listed required skills matched. This is a screening estimate, not proof of qualification.`
  };
}
