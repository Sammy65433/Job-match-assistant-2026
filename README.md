Job match assistant 

You could build this as a **job-match assistant** first, then add application automation where employers explicitly allow it. That gives you a useful app without risking inaccurate applications or violating job-board rules.

A practical first version would:

1. Let you upload your resume and set preferences such as role, location, salary, and remote work.
2. Pull jobs from a source that permits API access, or let you paste job links and descriptions.
3. Compare each job’s **required qualifications** with evidence in your resume.
4. Show a match score, matched skills, missing requirements, and an explanation. A **60% score is a screening estimate**, not proof you qualify.
5. Put jobs scoring 60% or higher in a review queue. **You approve each application** before it sends your resume.

For your stack, React/Vite + Express + MongoDB would work. Keep the resume and any job-board credentials on the backend, with authentication and access controls. Don’t put them in `VITE_` variables.

**First build step:** define the matching criteria and scoring formula using one sample resume and a few job descriptions. Get the recommendations working before connecting any application or email-sending service.