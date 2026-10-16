export const TRACKS = {
  software: {
    label: "Software engineer",
    defaultSkills:
      "JavaScript, React, HTML, CSS, Git, Node.js, Express, MongoDB, SQL, Python, REST APIs"
  },
  data: {
    label: "Data analyst",
    defaultSkills:
      "Python, SQL, Excel, Tableau, Power BI, ETL, Data Analysis, Data Visualization, Data Modeling, SQLite"
  },
  audio: {
    label: "Audio engineer",
    defaultSkills:
      "Pro Tools, Logic Pro, Ableton Live, Audio Recording, Vocal Tracking, Audio Editing, Vocal Production, Microphone Placement, Signal Flow, Studio Sessions"
  }
};

export function parseSkills(text) {
  return text
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}
