import { SOURCES, TRACKS } from "./config.js";

const MAX_TITLE_LENGTH = 150;
const MAX_COMPANY_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 10000;
const MAX_SOURCE_JOB_ID_LENGTH = 200;
const MAX_URL_LENGTH = 2000;
const MAX_SKILLS_QUERY_LENGTH = 3000;
const MAX_SKILL_LENGTH = 100;
const MAX_SKILLS = 100;

export function validSkills(skills) {
  return (
    Array.isArray(skills) &&
    skills.length > 0 &&
    skills.length <= MAX_SKILLS &&
    skills.every(
      (skill) =>
        typeof skill === "string" &&
        skill.trim().length > 0 &&
        skill.length <= MAX_SKILL_LENGTH
    )
  );
} // end validSkills

export function validTrack(track) {
  return TRACKS.includes(track);
} // end validTrack

export function parseSkillsQuery(value) {
  if (typeof value !== "string" || value.length > MAX_SKILLS_QUERY_LENGTH) {
    return [];
  }

  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter((skill) => skill && skill.length <= MAX_SKILL_LENGTH)
    .slice(0, MAX_SKILLS);
} // end parseSkillsQuery

export function validListingUrl(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_URL_LENGTH
  ) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
} // end validListingUrl

export function validTitle(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_TITLE_LENGTH
  );
} // end validTitle

export function validCompany(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_COMPANY_LENGTH
  );
} // end validCompany

export function validDescription(value, { required = false } = {}) {
  return (
    typeof value === "string" &&
    value.length <= MAX_DESCRIPTION_LENGTH &&
    (!required || value.trim().length > 0)
  );
} // end validDescription

export function validSource(value) {
  return SOURCES.includes(value);
} // end validSource

export function validSourceJobId(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_SOURCE_JOB_ID_LENGTH
  );
} // end validSourceJobId
