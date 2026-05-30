export interface KeyTableEntry {
  id: string; // 識別子 例: "standard"
  label: string; // 表示名 例: "標準ローマ字"
  path: string; // fetchパス 例: "/data/keytables/standard.tsv"
  description?: string;
}

// ローマ字テーブルの1エントリ
export interface RomajiRule {
  from: string;
  to: string;
  remain: string;
}

// 問題1件
export interface Problem {
  text: string;
  reading: string;
}

// 候補1件
export interface Candidate {
  full: string; // 候補全体（例: "sha"）
  matched: string; // 入力済み部分（例: "sh"）
  rest: string; // 残り（例: "a"）
  result: string; // 変換後文字（例: "し"）
}

// ゲーム状態
// playing/result 時の状態
export interface ActiveGameState {
  status: "playing" | "result";
  config: GameConfig;
  problems: Problem[];
  currentIndex: number;
  reading: string;
  readingPos: number;
  pending: string;
  wrongPending: string; // 誤入力でpendingに入った文字（1文字のみ）
  startTime: number | null;
  elapsedMs: number;
  stats: GameStats; // 追加
}

// useGame が扱う状態（null = 未開始）
export type GameState = ActiveGameState;

// ゲーム結果
export interface GameResult {
  elapsedMs: number;
  stats: GameStats;
  kpm: number; // 正タイプ数/分
  accuracy: number; // 正タイプ数 / 全タイプ数 (0~1)
  efficiency: number; // clearedChars / correctKeys (文字あたりの打鍵短縮率)
}

// ゲームモード
export type GameMode =
  | "count" // 問題数指定タイムアタック
  | "time" // 時間指定タイムアタック
  | "endless"; // 制限なし

// ゲーム設定（SetupScreenで組み立て、useGameに渡す）
export interface GameConfig {
  mode: GameMode;
  keyTableId: string; // KeyTableEntry.id
  keyTablePath: string; // ローマ字テーブルのTSVファイルパス
  // mode === 'count' のとき使用
  problemCount?: number;
  // mode === 'time' のとき使用
  timeLimitMs?: number;
}
export interface GameStats {
  totalKeys: number; // 全タイプ数（正+誤）
  correctKeys: number; // 正タイプ数
  missKeys: number; // 誤タイプ数
  backspaceCount: number; // バックスペース数
  clearedChars: number; // クリアしたひらがな文字数
  clearedProblems: number; // クリアした文章数
}
