import type { RomajiRule, Candidate } from "../types";

// TSVテキストをパース（大文字小文字区別あり）
export function parseRomajiTable(tsv: string): RomajiRule[] {
  return tsv
    .split("\n")
    .filter((l) => l.trim())
    .map((line) => {
      const [from = "", to = "", remain = ""] = line.split("\t");
      return { from, to, remain };
    })
    .filter((r) => r.from && r.to);
}

// pending+入力キーがルールに完全一致 → 消費して次状態を返す
export function tryConsume(rules: RomajiRule[], pending: string, reading: string, pos: number): { newPos: number; newPending: string } | null {
  const target = reading.slice(pos);
  for (const rule of rules) {
    if (rule.from === pending && target.startsWith(rule.to)) {
      return { newPos: pos + rule.to.length, newPending: rule.remain };
    }
  }
  return null;
}

// pendingが有効なprefixかどうか
export function isValidPrefix(rules: RomajiRule[], pending: string, reading: string, pos: number): boolean {
  const target = reading.slice(pos);
  return rules.some((r) => r.from.startsWith(pending) && target.startsWith(r.to));
}

// 現在の候補リストを返す（1文字・2文字・3文字以上に分類済み）
export function getCandidates(rules: RomajiRule[], pending: string, reading: string, pos: number): { c1: Candidate[]; c2: Candidate[]; c3: Candidate[] } {
  const target = reading.slice(pos);
  const seen = new Set<string>();
  const c1: Candidate[] = [],
    c2: Candidate[] = [],
    c3: Candidate[] = [];

  for (const rule of rules) {
    if (!rule.from.startsWith(pending)) continue;
    if (!target.startsWith(rule.to)) continue;
    if (seen.has(rule.from)) continue;
    seen.add(rule.from);

    const candidate: Candidate = {
      full: rule.from,
      matched: rule.from.slice(0, pending.length),
      rest: rule.from.slice(pending.length),
      result: rule.to
    };

    if (rule.from.length <= 1) c1.push(candidate);
    else if (rule.from.length === 2) c2.push(candidate);
    else c3.push(candidate);
  }

  return { c1, c2, c3 };
}

// 全角→半角正規化
export function normalizeChar(ch: string): string {
  // 全角英数記号 → 半角
  // eslint-disable-next-line no-irregular-whitespace
  return ch.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/　/g, " "); // 全角スペース
}

// ローマ字テーブルにない文字を直接照合（記号など）
export function tryDirect(ch: string, reading: string, pos: number): { newPos: number; newPending: string } | null {
  const normalized = normalizeChar(ch);
  const target = normalizeChar(reading[pos]);
  if (!target) return null;
  if (normalized === target || ch === target) {
    return { newPos: pos + 1, newPending: "" };
  }
  return null;
}
