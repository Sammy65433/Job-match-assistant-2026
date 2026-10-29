export function roundsForJob(job) {
  const rounds = Array.isArray(job.interviews)
    ? job.interviews.filter((round) => round?.scheduledAt)
    : [];

  if (rounds.length > 0) {
    return [...rounds].sort(
      (a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)
    );
  }

  if (job.interviewAt) {
    return [
      {
        _id: `legacy-${job._id}`,
        scheduledAt: job.interviewAt,
        round: "",
        contact: "",
        location: "",
        notes: ""
      }
    ];
  }

  return [];
} // end roundsForJob

export function formatInterviewDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
} // end formatInterviewDate

export function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
} // end toDateTimeLocalValue

export function stripRound(round) {
  return {
    scheduledAt: round.scheduledAt,
    round: round.round || "",
    contact: round.contact || "",
    location: round.location || "",
    notes: round.notes || ""
  };
} // end stripRound
