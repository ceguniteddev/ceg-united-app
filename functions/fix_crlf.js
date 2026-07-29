const fs = require("fs");

function fix(file) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(
    /import \* as functions from "firebase-functions";\r?\n?/g,
    'import * as logger from "firebase-functions/logger";\nimport { onSchedule } from "firebase-functions/v2/scheduler";\n',
  );
  fs.writeFileSync(file, content);
}

fix("src/kpi/functions/aggregate-daily.ts");
fix("src/kpi/functions/ai-weekly-briefing.ts");
fix("src/kpi/functions/alert-monitor.ts");

function fixHttp(file) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(
    /import \* as functions from "firebase-functions";\r?\n?/g,
    'import * as logger from "firebase-functions/logger";\nimport { onRequest } from "firebase-functions/v2/https";\n',
  );
  fs.writeFileSync(file, content);
}

fixHttp("src/kpi/functions/forecast-engine.ts");
fixHttp("src/kpi/functions/investor-token.ts");
fixHttp("src/kpi/functions/refresh-kpi.ts");
