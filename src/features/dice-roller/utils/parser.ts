import type { DieType } from "../store/useDiceStore";

export interface ParsedNotation {
  pool: Partial<Record<DieType, number>>;
  modifier: number;
}

const VALID_DIE_TYPES = new Set(["d4", "d6", "d8", "d10", "d12", "d20"]);

/**
 * Parses standard RPG dice notation into a physical pool and a mathematical modifier.
 * @param notation Standard RPG notation to be parsed (e.g. "2d10 + 1d4 - 5").
 */
export const parseRollNotation = (notation: string): ParsedNotation => {
  const result: ParsedNotation = { pool: {}, modifier: 0 };

  const sanitized = notation.replace(/\s+/g, "").toLowerCase();

  // tokenizer regex:
  // group 1: sign (+ or -)
  // group 2: dice count (optional, e.g., '2' in '2d20')
  // group 3: dice sides (e.g., '20' in '2d20')
  // group 5: flat integer mod (if no 'd' is present)
  const tokenRegex = /([+-]?)(?:(\d*)d(\d+)|(\d+))/g;

  let match;
  while ((match = tokenRegex.exec(sanitized)) !== null) {
    if (match[0] === "") break;

    const sign = match[1] === "-" ? -1 : 1;
    const diceCountStr = match[2];
    const sidesStr = match[3];
    const flatModStr = match[4];

    if (sidesStr) {
      // its a die roll token
      const count = diceCountStr ? parseInt(diceCountStr, 10) : 1;
      const dieType = `d${sidesStr}` as DieType;

      // strictly roll positive physical die
      // subtracting a rolled die value is complex vtt math, phys dice just stack
      const absoluteCount = Math.abs(count);

      if (VALID_DIE_TYPES.has(dieType)) {
        result.pool[dieType] = (result.pool[dieType] || 0) + absoluteCount;
      } else {
        console.warn(
          `[Parser] Ignored or unsupported die geometry: ${dieType}`,
        );
      }
    } else if (flatModStr) {
      // flat mod token
      result.modifier += sign * parseInt(flatModStr, 10);
    }
  }

  return result;
};
