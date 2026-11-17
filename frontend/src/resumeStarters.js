/* Starter background text shared by the resume checker and cover-letter
 * generator. These are descriptions of real training projects, not claims
 * of professional experience.
 */
export const RESUME_STARTERS = {
  software:
    "Built React interfaces and Express REST APIs using JavaScript, Node.js, MongoDB, HTML, CSS, and Git. Developed a MERN training tracker and a responsive business website.",
  data:
    "Built Python and SQL ETL pipelines, analyzed survey and staffing datasets, designed a SQLite star schema, and created reports and dashboards using Excel, Tableau, and Power BI.",
  audio:
    "Recorded and edited vocal sessions, set up microphones and signal flow, organized studio sessions, and contributed to vocal production. Used Pro Tools, Logic Pro, and Ableton Live.",
  ai:
    "Built Python applications that call large language model APIs, designed prompts, validated and parsed JSON responses, and handled errors and debugging. Used Git, GitHub, uv, and pytest to organize and test AI projects.",
  "ai-engineer":
    "Built Python AI applications that call LLM APIs, designed prompts, and validated JSON responses. Worked with RAG, embeddings, vector databases, model evaluation, and API integration, and used Git, GitHub, uv, and pytest to organize and test projects."
};

export function starterTextFor(track) {
  return RESUME_STARTERS[track] || "";
}
