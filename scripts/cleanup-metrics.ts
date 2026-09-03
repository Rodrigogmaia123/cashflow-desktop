#!/usr/bin/env node

import { cleanupOldMetrics } from "../lib/observability/cleanup";

const DEFAULT_DAYS = 14;

async function main() {
  const args = process.argv.slice(2);
  let days = DEFAULT_DAYS;

  // Parse --days argument
  for (const arg of args) {
    if (arg.startsWith("--days=")) {
      const daysValue = parseInt(arg.split("=")[1] || "", 10);
      if (!isNaN(daysValue) && daysValue > 0) {
        days = daysValue;
      }
    }
  }

  console.log(`[CLEANUP] Removing metrics older than ${days} days...`);

  try {
    const deleted = await cleanupOldMetrics(days);
    console.log(`[CLEANUP] Successfully removed ${deleted} metric events.`);
    process.exit(0);
  } catch (error) {
    console.error("[CLEANUP] Error:", error);
    process.exit(1);
  }
}

main();
