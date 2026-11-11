import { buildSkillGroups, cleanSkill, matchGroups } from "./skills.js";

const MIN_DETECTED = 3;

const toTenScale = (matched, total) =>
  total ? Math.max(1, Math.round((matched / total) * 100) / 10) : 0;

export function withScores(jobs, track, skills) {
  const mine = [...new Set((skills || []).map(cleanSkill).filter(Boolean))];

  if (mine.length === 0) return jobs;

  const { groups, alias } = buildSkillGroups(track, mine);
  const have = new Set(mine.map((skill) => alias.get(skill) ?? skill));

  return jobs.map((job) => {
    const text = cleanSkill(`${job.title || ""} ${job.description || ""}`);
    const { detected, matched, missing } = matchGroups(text, groups, have);

    if (detected.length < MIN_DETECTED) {
      return { ...job, matchScore: null, matchedSkills: [], missingSkills: [] };
    } // end if too little text

    return {
      ...job,
      matchScore: toTenScale(matched.length, detected.length),
      matchedSkills: matched,
      missingSkills: missing
    };
  }); // end map
} // end withScores
