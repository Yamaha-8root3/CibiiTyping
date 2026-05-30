import type { RomajiRule, Problem, KeyTableEntry } from "../types";
import { parseRomajiTable } from "./romajiEngine";

// keytables/index.jsonを読み込む
export async function loadKeyTableIndex(path = `${import.meta.env.BASE_URL}keytable/index.json`): Promise<KeyTableEntry[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export async function loadRomajiRules(path = `${import.meta.env.BASE_URL}keytable/keytable-no_se.txt`): Promise<RomajiRule[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const text = await res.text();
  // console.log(`Loaded romaji rules from ${path}, length: ${text.length}`);
  return parseRomajiTable(text);
}

export async function loadProblems(path = `${import.meta.env.BASE_URL}problems/default.csv`): Promise<Problem[]> {
  const res = await fetch(path);

  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  const text = await res.text();

  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const [text, reading] = parseCsvLine(line);

      if (text == null || reading == null) {
        return null;
      }

      return {
        text: text.trim(),
        reading: reading.trim()
      };
    })
    .filter((p): p is Problem => p !== null);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }

  result.push(current);
  return result;
}
