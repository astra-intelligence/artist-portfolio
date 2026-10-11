import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mintSession, sessionMatches, studioPassword } from "@/lib/studio-auth";

const savedPassword = process.env.STUDIO_PASSWORD;
afterEach(() => {
  if (savedPassword === undefined) delete process.env.STUDIO_PASSWORD;
  else process.env.STUDIO_PASSWORD = savedPassword;
});

const DAY = 24 * 60 * 60 * 1000;
const issued = Date.UTC(2026, 9, 1);

test("a session holds its issue time and a digest, not the password", () => {
  const session = mintSession("correct horse battery staple", issued);
  assert.match(session, new RegExp(`^v2\\.${issued}\\.[0-9a-f]{64}$`));
  assert.ok(!session.includes("correct"));
});

test("minting is stable for one password and time, and differs otherwise", () => {
  assert.equal(mintSession("one", issued), mintSession("one", issued));
  assert.notEqual(mintSession("one", issued), mintSession("two", issued));
  assert.notEqual(mintSession("one", issued), mintSession("one", issued + 1));
});

test("a fresh session matches only its own password", () => {
  const session = mintSession("one");
  assert.equal(sessionMatches(session, "one"), true);
  assert.equal(sessionMatches(session, "two"), false);
});

test("a session expires on the server after 14 days", () => {
  const session = mintSession("one", issued);
  assert.equal(sessionMatches(session, "one", issued + 14 * DAY - 1), true);
  assert.equal(sessionMatches(session, "one", issued + 14 * DAY), false);
  assert.equal(sessionMatches(session, "one", issued + 365 * DAY), false);
});

test("a session issued in the future is refused beyond a minute of clock skew", () => {
  assert.equal(sessionMatches(mintSession("one", issued + 30 * 1000), "one", issued), true);
  assert.equal(sessionMatches(mintSession("one", issued + DAY), "one", issued), false);
});

test("an issue time cannot be changed without the password", () => {
  const [, , digest] = mintSession("one", issued).split(".");
  const later = issued + 13 * DAY;
  assert.equal(sessionMatches(`v2.${later}.${digest}`, "one", later), false);
});

test("old, malformed or altered cookies are rejected", () => {
  const session = mintSession("one", issued);
  const now = issued + DAY;
  const v1 = "a".repeat(64);
  for (const cookie of ["", "one", v1, session.slice(1), `${session}0`, session.replace("v2.", "v3."), `v2.-1.${v1}`]) {
    assert.equal(sessionMatches(cookie, "one", now), false, cookie);
  }
  const flipped = session.slice(0, -1) + (session.endsWith("a") ? "b" : "a");
  assert.equal(sessionMatches(flipped, "one", now), false);
});

test("the studio password is trimmed and a blank one means the desk is closed", () => {
  process.env.STUDIO_PASSWORD = "  secret  ";
  assert.equal(studioPassword(), "secret");
  process.env.STUDIO_PASSWORD = "   ";
  assert.equal(studioPassword(), null);
  delete process.env.STUDIO_PASSWORD;
  assert.equal(studioPassword(), null);
});
