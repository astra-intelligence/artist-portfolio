import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { GitHubError, commitGitFiles, isGitConflict, readGitFile, readGitHead } from "@/lib/github-catalog";

const TOKEN = "github_pat_secret123";
const savedToken = process.env.STUDIO_GITHUB_TOKEN;
const head = { repo: "o/r", branch: "main", parentSha: "p", baseTree: "t" };
let logged: string[];

function replyWith(status: number, body: string) {
  mock.method(globalThis, "fetch", async () => new Response(body, { status }));
}

beforeEach(() => {
  process.env.STUDIO_GITHUB_TOKEN = TOKEN;
  logged = [];
  mock.method(console, "error", (line: string) => logged.push(line));
});

afterEach(() => {
  mock.restoreAll();
  if (savedToken === undefined) delete process.env.STUDIO_GITHUB_TOKEN;
  else process.env.STUDIO_GITHUB_TOKEN = savedToken;
});

const internals = JSON.stringify({ message: `Bad credentials for ${TOKEN}`, documentation_url: "https://docs.github.com/rest" });

test("a failed read shows a plain message and logs GitHub's reply", async () => {
  replyWith(401, internals);
  await assert.rejects(readGitHead(), (error: unknown) => {
    assert.ok(error instanceof GitHubError);
    assert.equal(error.status, 401);
    assert.equal(error.message, "GitHub could not load the catalog. Try again in a minute.");
    return true;
  });
  assert.equal(logged.length, 1);
  assert.match(logged[0], /GitHub GET \/git\/ref\/heads\/main responded 401: .*Bad credentials/);
});

test("a failed save shows a plain message without GitHub's wording", async () => {
  replyWith(403, internals);
  await assert.rejects(
    commitGitFiles(head, "Update", [{ path: "content/works.json", bytes: Buffer.from("[]") }]),
    (error: unknown) => {
      assert.ok(error instanceof GitHubError);
      assert.equal(error.message, "GitHub did not accept the save. Try again in a minute.");
      assert.ok(!error.message.includes("Bad credentials"));
      return true;
    },
  );
  assert.match(logged[0], /GitHub POST \/git\/blobs responded 403/);
});

test("the token never reaches the log", async () => {
  replyWith(500, internals);
  await assert.rejects(readGitHead());
  assert.ok(!logged[0].includes(TOKEN));
  assert.ok(logged[0].includes("[redacted]"));
});

test("conflicts keep their status so a save can retry", async () => {
  replyWith(422, "{}");
  await assert.rejects(
    commitGitFiles(head, "Update", [{ path: "content/works.json", bytes: Buffer.from("[]") }]),
    (error: unknown) => isGitConflict(error),
  );
});

test("a missing catalog file is still read as absent", async () => {
  replyWith(404, "{}");
  assert.equal(await readGitFile("content/works.json", "main"), null);
});
