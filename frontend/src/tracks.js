
export const MATCH_ALERT_THRESHOLD = 8;

export const FIT_TIERS = [
  {
    min: 9,
    label: "Perfect fit",
    tagline: "Spot-on! This is your ideal fit — go for it.",
    tone: "perfect"
  },
  {
    min: 8,
    label: "Great fit",
    tagline: "Strong match — definitely worth applying.",
    tone: "great"
  },
  {
    min: 7,
    label: "Good fit",
    tagline: "Solid overlap — review the listing and apply.",
    tone: "good"
  },
  {
    min: 5,
    label: "Possible fit",
    tagline: "Some overlap — check the details before applying.",
    tone: "possible"
  },
  {
    min: 1,
    label: "Stretch",
    tagline: "Low overlap — apply only if the role still fits your goals.",
    tone: "stretch"
  }
];

export function fitForScore(score) {
  if (typeof score !== "number" || score <= 0) return null;
  return FIT_TIERS.find((tier) => score >= tier.min) ?? FIT_TIERS.at(-1);
}

export function formatScore(score) {
  return Number(score).toFixed(1);
}

export const MODES = {
  remote: "Remote",
  hybrid: "Hybrid",
  "in-person": "In person"
};

export const AREAS = {
  los_angeles: "Los Angeles area",
  newark: "Newark / NYC area"
};

export const TRACKS = {
  software: {
  label: "Software engineer",
  modes: ["remote", "hybrid", "in-person"],
  defaultSkills: "JavaScript, React, React Router, Node.js, Express, MongoDB, Mongoose, REST APIs, CRUD, Python, SQL, HTML, CSS, Git, TypeScript, Tailwind CSS, Supabase",
},
data: {
  label: "Data analyst",
  modes: ["remote", "hybrid", "in-person"],
  defaultSkills: "Python, SQL, SQLite, ETL, data modeling, star schema, data validation, Excel, Tableau, Power BI, data visualization, reporting",
},
audio: {
  label: "Audio engineer",
  modes: ["in-person"],
  defaultSkills: "Pro Tools, Logic Pro, Ableton Live, audio recording, vocal tracking, audio editing, vocal production, microphone placement, signal flow, studio sessions, session file organization",
},


};

export function parseSkills(text) {
  return text
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

