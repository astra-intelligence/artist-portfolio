/*
 * Previous / next for a painting page. The walk stays inside the painting's
 * main subject (subjects[0], the group the /work page files it under), so
 * stepping through matches what a visitor saw in that group. A painting with
 * no subject, or alone in its subject, walks the whole catalog instead.
 *
 * The ends wrap around, like a ring buffer: "next" on the last painting is
 * the first one, so a visitor never hits a dead end.
 *
 * The parameter type is generic (like a C++ template) so this works on any
 * record with a slug and subjects, which keeps the tests small.
 */
import type { SubjectId } from "@/lib/subjects";

type Walkable = { slug: string; subjects: SubjectId[] };

export function neighbours<T extends Walkable>(
  works: T[],
  slug: string,
): { previous?: T; next?: T; subject?: SubjectId } {
  const work = works.find((entry) => entry.slug === slug);
  if (!work) return {};
  const subject = work.subjects[0];
  const group = subject ? works.filter((entry) => entry.subjects[0] === subject) : [];
  const inSubject = group.length > 1;
  const ring = inSubject ? group : works;
  if (ring.length < 2) return {};
  const index = ring.indexOf(work);
  return {
    // `%` in JavaScript keeps the sign of the left side, as in C++, so add
    // the length before taking the remainder to step back from index 0.
    previous: ring[(index - 1 + ring.length) % ring.length],
    next: ring[(index + 1) % ring.length],
    subject: inSubject ? subject : undefined,
  };
}
