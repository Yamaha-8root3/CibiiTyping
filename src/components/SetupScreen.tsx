import { useState, useEffect } from "react";
import type { Problem, KeyTableEntry, GameConfig, GameMode, RomajiRule } from "../types";

interface Props {
  problems: Problem[];
  keyTables: KeyTableEntry[];
  lastConfig: GameConfig | null;
  cachedRules: { id: string; rules: RomajiRule[] } | null;
  onTableSelect: (entry: KeyTableEntry) => void;
  onStart: (config: GameConfig, problems: Problem[]) => void;
}

const MODE_LABELS: { mode: GameMode; label: string; desc: string }[] = [
  { mode: "endless", label: "無制限", desc: "エンドレスモード" },
  { mode: "count", label: "問題数指定", desc: "指定した問題数をクリア" },
  { mode: "time", label: "時間指定", desc: "制限時間内に何問打てるか" }
];

const COUNT_OPTIONS = [10, 20, 30, 50];
const TIME_OPTIONS = [
  { label: "30秒", ms: 30000 },
  { label: "1分", ms: 60000 },
  { label: "2分", ms: 120000 },
  { label: "3分", ms: 180000 }
];

export function SetupScreen({ problems, keyTables, lastConfig, cachedRules, onTableSelect, onStart }: Props) {
  const [selectedTableId, setSelectedTableId] = useState<string>(lastConfig?.keyTableId ?? keyTables[0]?.id ?? "");
  const [mode, setMode] = useState<GameMode>(lastConfig?.mode ?? "endless");
  const [problemCount, setProblemCount] = useState<number>(lastConfig?.problemCount ?? COUNT_OPTIONS[0]);
  const [timeLimitMs, setTimeLimitMs] = useState<number>(lastConfig?.timeLimitMs ?? TIME_OPTIONS[1].ms);

  // 初回マウント時に選択中のテーブルをfetch
  useEffect(() => {
    const entry = keyTables.find((kt) => kt.id === selectedTableId);
    if (entry) onTableSelect(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableSelect = (kt: KeyTableEntry) => {
    setSelectedTableId(kt.id);
    onTableSelect(kt);
  };

  const handleStart = () => {
    if (!selectedTableId || problems.length === 0 || !cachedRules) return;
    const selected = keyTables.find((kt) => kt.id === selectedTableId);
    if (!selected) return;
    onStart(
      {
        mode,
        keyTableId: selectedTableId,
        keyTablePath: selected.path,
        problemCount: mode === "count" ? problemCount : undefined,
        timeLimitMs: mode === "time" ? timeLimitMs : undefined
      },
      problems
    );
  };

  const isReady = !!cachedRules && cachedRules.id === selectedTableId;

  return (
    <div className="screen setup">
      <h1>CibiiTyping</h1>
      <h3>v1.0.0</h3>

      <div className="setup-section">
        <div className="setup-label">ローマ字テーブル</div>
        <div className="keytable-list">
          {keyTables.map((kt) => (
            <button key={kt.id} className={`keytable-item ${selectedTableId === kt.id ? "selected" : ""}`} onClick={() => handleTableSelect(kt)}>
              <span className="keytable-label">
                {kt.label} {selectedTableId === kt.id && !isReady && <span className="keytable-desc">読み込み中...</span>}
              </span>
              {kt.description && <span className="keytable-desc">{kt.description}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <div className="setup-label">ゲームモード</div>
        <div className="mode-list">
          {MODE_LABELS.map((m) => (
            <button key={m.mode} className={`keytable-item ${mode === m.mode ? "selected" : ""}`} onClick={() => setMode(m.mode)}>
              <span className="keytable-label">{m.label}</span>
              <span className="keytable-desc">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === "count" && (
        <div className="setup-section">
          <div className="setup-label">問題数</div>
          <div className="option-chips">
            {COUNT_OPTIONS.map((n) => (
              <button key={n} className={`chip ${problemCount === n ? "selected" : ""}`} onClick={() => setProblemCount(n)}>
                {n}問
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "time" && (
        <div className="setup-section">
          <div className="setup-label">制限時間</div>
          <div className="option-chips">
            {TIME_OPTIONS.map((t) => (
              <button key={t.ms} className={`chip ${timeLimitMs === t.ms ? "selected" : ""}`} onClick={() => setTimeLimitMs(t.ms)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="setup-footer">
        <span className="setup-info">文章数:{problems.length}</span>
        <button className="btn-primary" onClick={handleStart} disabled={!isReady || problems.length === 0}>
          {isReady ? "スタート" : "読み込み中..."}
        </button>
      </div>
      <div>
        <p>
          LΛMPLIGHT氏が開発、利用しているローマ字配列「Sibii」(サイビー)を練習できるゲームです
          <br />
          例文は<a href="https://lamplight0.sakura.ne.jp/a/langs/wordlist.php?lang=lis">レベル別単語･例文帳(莉語)</a>より引用しています
          <br />
          Sibiiについて、ローマ字テーブルのダウンロード、対応表は
          <a href="https://lamplight0.sakura.ne.jp/a/articles/?id=1135">こちら</a>
          <br />
          LΛMPLIGHTトップは<a href="https://lamplight0.sakura.ne.jp/a/">こちら</a>
          <br />
          ソースコード、バグ報告(特に文章の誤字など)はGithubにて
        </p>
      </div>
    </div>
  );
}
