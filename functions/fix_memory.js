const fs = require("fs");

let content = fs.readFileSync("src/index.ts", "utf8");

// Insert setGlobalOptions at the top
const injection = `import { setGlobalOptions } from "firebase-functions/v2";\nsetGlobalOptions({ memory: "512MiB" });\n`;

if (!content.includes("setGlobalOptions")) {
  fs.writeFileSync("src/index.ts", injection + content);
}
