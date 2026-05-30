import type { GameState, Candidate } from "../types";

interface Props {
  state: GameState;
  candidates: { c1: Candidate[]; c2: Candidate[]; c3: Candidate[] };
  onretry: () => void;
  onquit: () => void;
}

function CandList({ items, label }: { items: Candidate[]; label: string }) {
  return (
    <div className="cand-col">
      <div className="cand-label">{label}</div>
      {items.length === 0 ? (
        <span className="cand-empty">—</span>
      ) : (
        items.map((c) => (
          <span key={c.full} className="cand-item">
            <span className="cand-matched">{c.matched}</span>
            {c.rest}
            <span className="cand-arrow">→</span>
            <span className="cand-result">{c.result}</span>
          </span>
        ))
      )}
    </div>
  );
}

// export function GameScreen({ state, candidates, onretry, onquit }: Props) {
export function GameScreen({ state, candidates, onquit }: Props) {
  const { problems, currentIndex, reading, readingPos, pending, elapsedMs, stats, config, wrongPending } = state;
  const current = problems[currentIndex];

  // モード別タイム表示
  const timeDisplay = (() => {
    if (config.mode === "time" && config.timeLimitMs) {
      const remaining = Math.max(0, config.timeLimitMs - elapsedMs);
      const s = (remaining / 1000).toFixed(1);
      const pct = remaining / config.timeLimitMs;
      return { label: s + "s", isCountdown: true, pct };
    }
    return { label: (elapsedMs / 1000).toFixed(1) + "s", isCountdown: false, pct: 1 };
  })();

  // リアルタイム精度
  const accuracy = stats.totalKeys > 0 ? Math.round((stats.correctKeys / stats.totalKeys) * 100) : 100;

  // モード別進捗
  const progressPct = config.mode === "time" ? timeDisplay.pct : currentIndex / problems.length;

  return (
    <div className="screen game">
      {/* 進捗バー */}
      <div className="progress-bar">
        <div className={`progress-fill ${config.mode === "time" && timeDisplay.pct < 0.25 ? "progress-danger" : ""}`} style={{ width: `${progressPct * 100}%` }} />
      </div>

      {/* 問題文 */}
      <div className="problem-text">{current.text}</div>

      {/* 読み：入力済み / pending / 残り */}
      <div className="reading-display">
        <span className="typed">{reading.slice(0, readingPos)}</span>
        <span className="pending">{pending}</span>
        <span className="wrong-pending">{wrongPending}</span>
        <span className="remaining">{reading.slice(readingPos)}</span>
      </div>

      {/* メイン統計 */}
      <div className="stats">
        <div className="stat-item">
          <span className="stat-value">{timeDisplay.label}</span>
          <span className="stat-label">{config.mode === "time" ? "残り" : "経過"}</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.correctKeys}</span>
          <span className="stat-label">正打</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.missKeys}</span>
          <span className="stat-label">誤打</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">精度</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.clearedProblems}</span>
          <span className="stat-label">文章</span>
        </div>
        {config.mode !== "time" && (
          <div className="stat-item">
            <span className="stat-value">
              {currentIndex + 1}/{problems.length}
            </span>
            <span className="stat-label">問</span>
          </div>
        )}
      </div>

      {/* 候補 */}
      <div className="candidates">
        <CandList items={candidates.c1} label="1文字" />
        <CandList items={candidates.c2} label="2文字" />
        <CandList items={candidates.c3} label="3文字以上" />
      </div>

      <button onClick={onquit}>トップに戻る</button>
    </div>
  );
}
