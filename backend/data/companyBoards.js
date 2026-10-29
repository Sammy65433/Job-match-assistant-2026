// ATS token formats:
//   greenhouse:      last part of boards.greenhouse.io/TOKEN
//   lever:           last part of jobs.lever.co/TOKEN
//   ashby:           last part of jobs.ashbyhq.com/TOKEN
//   smartrecruiters: last part of jobs.smartrecruiters.com/TOKEN
//   workable:        last part of apply.workable.com/TOKEN
export const COMPANY_BOARDS = [
  { ats: "greenhouse", token: "vercel", name: "Vercel" },
  { ats: "greenhouse", token: "gitlab", name: "GitLab" },
  { ats: "lever", token: "palantir", name: "Palantir" },
  { ats: "ashby", token: "ramp", name: "Ramp" }
]; // end COMPANY_BOARDS