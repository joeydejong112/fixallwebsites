import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "Run scheduled monitors",
  { minuteUTC: 0 },
  internal.monitors.processDueMonitors
);

export default crons;
