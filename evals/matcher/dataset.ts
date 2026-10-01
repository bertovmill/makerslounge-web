import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Participant } from "@/lib/meetup-matcher";

/**
 * One meetup to evaluate May on.
 *
 * `planted` pairs are the closest thing a matcher has to an answer key: a need
 * that exactly one other person in the room can meet. If May misses one, that's
 * a real miss, no judge required.
 */
export interface MatcherDataset {
  name: string;
  description: string;
  meetupName: string;
  participants: Participant[];
  planted?: { person_id: string; should_match_id: string; why: string }[];
}

export const DATA_DIR = path.join(process.cwd(), "evals", "matcher", "data");

/** `name` is a file in data/ (or data/private/) without the .json. */
export async function loadDataset(name: string): Promise<MatcherDataset> {
  for (const file of [path.join(DATA_DIR, `${name}.json`), path.join(DATA_DIR, "private", `${name}.json`)]) {
    try {
      return JSON.parse(await readFile(file, "utf8")) as MatcherDataset;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  throw new Error(`No dataset "${name}" in evals/matcher/data/ or data/private/`);
}
