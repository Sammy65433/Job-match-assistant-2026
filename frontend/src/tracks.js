
export const MATCH_ALERT_THRESHOLD = 65;

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

