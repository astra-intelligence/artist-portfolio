import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mintSession, sessionMatches, studioPassword } from "@/lib/studio-auth";

const savedPassword = process.env.STUDIO_PASSWORD;
afterEach(() => {
  if (savedPassword === undefined) delete process.env.STUDIO_PASSWORD;
  else process.env.STUDIO_PASSWORD = savedPassword;
});

test("a session is a hex digest that does not contain the password", () => {
  const session = mintSession("correct horse battery staple");
  assert.match(session, /^[0-9a-f]{64}$/);
  assert.ok(!session.includes("correct"));
});

test("minting is stable for one password and differs between passwords", () => {
  assert.equal(mintSession("one"), mintSession("one"));
  assert.notEqual(mintSession("one"), mintSession("two"));
});

test("a minted session matches only its own password", () => {
  const session = mintSession("one");
  assert.equal(sessionMatches(session, "one"), true);
  assert.equal(sessionMatches(session, "two"), false);
});

test("cookies of the wrong length or content are rejected", () => {
  const session = mintSession("one");
  assert.equal(sessionMatches("", "one"), false);
  assert.equal(sessionMatches(session.slice(1), "one"), false);
  assert.equal(sessionMatches(`${session}0`, "one"), false);
  assert.equal(sessionMatches("one", "one"), false);
  const flipped = (session[0] === "a" ? "b" : "a") + session.slice(1);
  assert.equal(sessionMatches(flipped, "one"), false);
});

test("the studio password is trimmed and a blank one means the desk is closed", () => {
  process.env.STUDIO_PASSWORD = "  secret  ";
  assert.equal(studioPassword(), "secret");
  process.env.STUDIO_PASSWORD = "   ";
  assert.equal(studioPassword(), null);
  delete process.env.STUDIO_PASSWORD;
  assert.equal(studioPassword(), null);
});
