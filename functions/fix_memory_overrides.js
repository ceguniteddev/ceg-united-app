const fs = require("fs");

function bumpMemory(file) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/"256MiB"/g, '"512MiB"');
  fs.writeFileSync(file, content);
}

bumpMemory("src/kpi/functions/investor-token.ts");
bumpMemory("src/kpi/functions/alert-monitor.ts");
