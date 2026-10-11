/*
 * Public catalog read. The JSON import is the file baked into the build.
 * parseWorks() is the same function the desk uses, so a bad record fails
 * here instead of being cast through with `as Work`.
 */
import worksJson from "../../content/works.json";
import { parseWorks } from "@/lib/catalog";
import type { Work } from "@/lib/types";

// Parsed once when the module first loads (like a file-scope static in C++),
// then shared by every page that asks for the list during the build.
const works = parseWorks(worksJson);

export function getWorks(): Work[] {
  return works;
}

export function getWork(slug: string) {
  return getWorks().find((work) => work.slug === slug);
}
