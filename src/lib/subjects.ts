/*
 * Typed view of the subject list in subjects.mjs. That file is the one
 * copy of the ids and labels. SubjectId is one of those ids rather than
 * string.
 */
import { SUBJECTS } from "./subjects.mjs";

export { SUBJECTS };

export type SubjectId = (typeof SUBJECTS)[number]["id"];

function isSubjectId(value: unknown): value is SubjectId {
  return SUBJECTS.some((subject) => subject.id === value);
}

/*
 * A painting's subjects, cleaned up: unknown ids and repeats are dropped,
 * and the rest are put in SUBJECTS order. That order makes the first entry
 * the painting's main subject, the one the grouped /work page files it
 * under, whatever order the ids arrived in. Anything that is not an array
 * gives an empty list, so a bad catalog entry never reaches the page.
 */
export function parseSubjects(value: unknown): SubjectId[] {
  if (!Array.isArray(value)) return [];
  const wanted = new Set(value.filter(isSubjectId));
  return SUBJECTS.map((subject) => subject.id).filter((id) => wanted.has(id));
}

export function subjectLabel(id: string | undefined) {
  return SUBJECTS.find((subject) => subject.id === id)?.label ?? "";
}
