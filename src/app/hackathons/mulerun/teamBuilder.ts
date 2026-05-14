import { CATEGORIES } from "./categories";

export type Signup = {
  id: string;
  name: string;
  categories: string[];
};

export type Team = {
  members: Signup[];
  sharedCategories: string[];
  unionCategories: string[];
  why: string;
};

const CATEGORY_NAMES = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

function nameOf(slug: string): string {
  return CATEGORY_NAMES[slug] ?? slug;
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const x of setA) if (setB.has(x)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function avgJaccard(person: Signup, group: Signup[]): number {
  if (group.length === 0) return 0;
  let sum = 0;
  for (const m of group) sum += jaccard(person.categories, m.categories);
  return sum / group.length;
}

/**
 * Greedy team building:
 *   1) Take the most-overlapping pair as the seed.
 *   2) Add the person with the highest avg similarity to that pair, if any
 *      remaining people exist and the pair has < 3 members.
 *   3) Repeat with the rest of the pool.
 *   4) Stragglers (single leftover) get appended to the smallest team.
 */
export function buildTeams(signups: Signup[]): Team[] {
  const pool = [...signups];
  const teams: Signup[][] = [];

  while (pool.length >= 2) {
    let bestI = 0;
    let bestJ = 1;
    let bestScore = -1;
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const score = jaccard(pool[i].categories, pool[j].categories);
        if (score > bestScore) {
          bestScore = score;
          bestI = i;
          bestJ = j;
        }
      }
    }
    const team: Signup[] = [pool[bestI], pool[bestJ]];
    pool.splice(bestJ, 1);
    pool.splice(bestI, 1);

    if (pool.length > 0) {
      let bestIdx = 0;
      let bestAvg = -1;
      for (let k = 0; k < pool.length; k++) {
        const avg = avgJaccard(pool[k], team);
        if (avg > bestAvg) {
          bestAvg = avg;
          bestIdx = k;
        }
      }
      const forced = pool.length === 1;
      const wouldStrand = pool.length - 1 === 1;
      const decentMatch = bestAvg > 0;
      if (forced || (decentMatch && !wouldStrand)) {
        team.push(pool[bestIdx]);
        pool.splice(bestIdx, 1);
      }
    }

    teams.push(team);
  }

  if (pool.length === 1) {
    const lone = pool[0];
    let bestTeam = 0;
    let bestAvg = -1;
    for (let i = 0; i < teams.length; i++) {
      const avg = avgJaccard(lone, teams[i]);
      if (avg > bestAvg) {
        bestAvg = avg;
        bestTeam = i;
      }
    }
    teams[bestTeam].push(lone);
  }

  return teams.map((members) => {
    const sets = members.map((m) => new Set(m.categories));
    const shared = [...sets[0]].filter((c) => sets.every((s) => s.has(c)));
    const union = Array.from(new Set(members.flatMap((m) => m.categories)));
    return {
      members,
      sharedCategories: shared,
      unionCategories: union,
      why:
        shared.length > 0
          ? `Shared interests: ${shared.map(nameOf).join(", ")}.`
          : `Spans ${union.map(nameOf).join(", ")} — a cross-functional crew.`,
    };
  });
}
