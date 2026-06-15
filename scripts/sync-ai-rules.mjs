import { copyFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const sourcePath = resolve(root, "AGENTS.md");
const targetPath = resolve(root, "CLAUDE.md");

const source = readFileSync(sourcePath, "utf8");
let target = "";

try {
  target = readFileSync(targetPath, "utf8");
} catch {
  target = "";
}

if (source !== target) {
  copyFileSync(sourcePath, targetPath);
  process.stdout.write("Synced CLAUDE.md from AGENTS.md\n");
} else {
  process.stdout.write("CLAUDE.md already matches AGENTS.md\n");
}
