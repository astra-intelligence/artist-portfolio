import { cp } from "fs/promises";

// This overwrites a tracked file. In GitHub Actions the checkout is thrown
// away afterwards; on a local machine the change would be left behind and
// could be committed by accident. GitHub Actions always sets CI=true.
if (process.env.GITHUB_PAGES !== "1" || process.env.CI !== "true") {
  console.error("Refusing to replace the studio desk. This step is only for the GitHub Pages build in CI.");
  process.exit(1);
}

await cp("src/curate-on-pages.tsx", "src/app/curate/page.tsx");
console.log("Replaced src/app/curate/page.tsx for this static build only. Do not commit that file.");
