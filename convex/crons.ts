import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Weekly site monitoring — Sunday 08:00 UTC
crons.weekly(
  "weekly site monitoring",
  { dayOfWeek: "sunday", hourUTC: 8, minuteUTC: 0 },
  internal.monitoring.runWeeklyScans
);

// Weekly digest — Monday 09:00 UTC
crons.weekly(
  "weekly digest",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.monitoring.sendWeeklyDigest
);

// Reset monthly scan counts — 1st of month 00:00 UTC
crons.monthly(
  "reset monthly scan counts",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.users.resetMonthlyScanCounts
);

export default crons;
