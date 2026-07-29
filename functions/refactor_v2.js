const fs = require("fs");

function refactorToV2() {
  // 1. aggregate-daily.ts
  let agg = fs.readFileSync("src/kpi/functions/aggregate-daily.ts", "utf8");
  agg = agg.replace(
    /import \* as functions from "firebase-functions";\n/g,
    'import * as logger from "firebase-functions/logger";\nimport { onSchedule } from "firebase-functions/v2/scheduler";\n',
  );
  agg = agg.replace(/functions\.logger\.error/g, "logger.error");
  agg = agg.replace(/functions\.logger\.info/g, "logger.info");
  agg = agg.replace(/functions\.logger\.warn/g, "logger.warn");
  agg = agg.replace(
    /export const aggregateDaily = functions\s*\n\s*\.runWith\({ timeoutSeconds: 300, memory: "512MB" }\)\s*\n\s*\.pubsub\.schedule\("0 3 \* \* \*"\)\s*\n\s*\.timeZone\("UTC"\)\s*\n\s*\.onRun\(async \(\) => {\s*\n\s*await runAggregateDaily\(\);\s*\n\s*return null;\s*\n\s*}\);/g,
    `export const aggregateDaily = onSchedule(
  { schedule: "0 3 * * *", timeZone: "UTC", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    await runAggregateDaily();
  }
);`,
  );
  fs.writeFileSync("src/kpi/functions/aggregate-daily.ts", agg);

  // 2. ai-weekly-briefing.ts
  let ai = fs.readFileSync("src/kpi/functions/ai-weekly-briefing.ts", "utf8");
  ai = ai.replace(
    /import \* as functions from "firebase-functions";\n/g,
    'import * as logger from "firebase-functions/logger";\nimport { onSchedule } from "firebase-functions/v2/scheduler";\n',
  );
  ai = ai.replace(/functions\.logger\.error/g, "logger.error");
  ai = ai.replace(/functions\.logger\.info/g, "logger.info");
  ai = ai.replace(/functions\.logger\.warn/g, "logger.warn");
  ai = ai.replace(
    /export const aiWeeklyBriefing = functions\s*\n\s*\.runWith\({ timeoutSeconds: 300, memory: "512MB" }\)\s*\n\s*\.pubsub\.schedule\("0 6 \* \* 1"\)\s*\n\s*\.timeZone\("America\/New_York"\)\s*\n\s*\.onRun\(async \(\) => {\s*\n\s*await runWeeklyBriefing\(\);\s*\n\s*return null;\s*\n\s*}\);/g,
    `export const aiWeeklyBriefing = onSchedule(
  { schedule: "0 6 * * 1", timeZone: "America/New_York", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    await runWeeklyBriefing();
  }
);`,
  );
  fs.writeFileSync("src/kpi/functions/ai-weekly-briefing.ts", ai);

  // 3. alert-monitor.ts
  let alert = fs.readFileSync("src/kpi/functions/alert-monitor.ts", "utf8");
  alert = alert.replace(
    /import \* as functions from "firebase-functions";\n/g,
    'import * as logger from "firebase-functions/logger";\nimport { onSchedule } from "firebase-functions/v2/scheduler";\n',
  );
  alert = alert.replace(/functions\.logger\.error/g, "logger.error");
  alert = alert.replace(/functions\.logger\.info/g, "logger.info");
  alert = alert.replace(/functions\.logger\.warn/g, "logger.warn");
  alert = alert.replace(
    /export const alertMonitor = functions\s*\n\s*\.runWith\({ timeoutSeconds: 120, memory: "256MB" }\)\s*\n\s*\.pubsub\.schedule\("every 15 minutes"\)\s*\n\s*\.onRun\(async \(\) => {\s*\n\s*await runAlertMonitor\(\);\s*\n\s*return null;\s*\n\s*}\);/g,
    `export const alertMonitor = onSchedule(
  { schedule: "every 15 minutes", timeoutSeconds: 120, memory: "256MiB" },
  async () => {
    await runAlertMonitor();
  }
);`,
  );
  fs.writeFileSync("src/kpi/functions/alert-monitor.ts", alert);

  // 4. forecast-engine.ts
  let forecast = fs.readFileSync(
    "src/kpi/functions/forecast-engine.ts",
    "utf8",
  );
  forecast = forecast.replace(
    /import \* as functions from "firebase-functions";\n/g,
    'import * as logger from "firebase-functions/logger";\nimport { onRequest } from "firebase-functions/v2/https";\n',
  );
  forecast = forecast.replace(/functions\.logger\.error/g, "logger.error");
  forecast = forecast.replace(/functions\.logger\.info/g, "logger.info");
  forecast = forecast.replace(/functions\.logger\.warn/g, "logger.warn");
  forecast = forecast.replace(
    /export const forecastEngine = functions\.https\.onRequest\(app\);/g,
    'export const forecastEngine = onRequest({ timeoutSeconds: 300, memory: "512MiB" }, app as any);',
  );
  fs.writeFileSync("src/kpi/functions/forecast-engine.ts", forecast);

  // 5. investor-token.ts
  let inv = fs.readFileSync("src/kpi/functions/investor-token.ts", "utf8");
  inv = inv.replace(
    /import \* as functions from "firebase-functions";\n/g,
    'import * as logger from "firebase-functions/logger";\nimport { onRequest } from "firebase-functions/v2/https";\n',
  );
  inv = inv.replace(/functions\.logger\.error/g, "logger.error");
  inv = inv.replace(/functions\.logger\.info/g, "logger.info");
  inv = inv.replace(/functions\.logger\.warn/g, "logger.warn");
  inv = inv.replace(
    /export const investorToken = functions\.https\.onRequest\(app\);/g,
    'export const investorToken = onRequest({ timeoutSeconds: 120, memory: "256MiB" }, app as any);',
  );
  fs.writeFileSync("src/kpi/functions/investor-token.ts", inv);

  // 6. refresh-kpi.ts
  let refresh = fs.readFileSync("src/kpi/functions/refresh-kpi.ts", "utf8");
  refresh = refresh.replace(
    /import \* as functions from "firebase-functions";\n/g,
    'import * as logger from "firebase-functions/logger";\nimport { onRequest } from "firebase-functions/v2/https";\n',
  );
  refresh = refresh.replace(/functions\.logger\.error/g, "logger.error");
  refresh = refresh.replace(/functions\.logger\.info/g, "logger.info");
  refresh = refresh.replace(/functions\.logger\.warn/g, "logger.warn");
  refresh = refresh.replace(
    /export const refreshKpi = functions\.runWith\({ timeoutSeconds: 300, memory: "512MB" }\)\.https\.onRequest\(app\);/g,
    'export const refreshKpi = onRequest({ timeoutSeconds: 300, memory: "512MiB" }, app as any);',
  );
  fs.writeFileSync("src/kpi/functions/refresh-kpi.ts", refresh);
}

refactorToV2();
console.log("Refactored to v2");
