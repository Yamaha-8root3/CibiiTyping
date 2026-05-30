import type { GameResult } from "../types";

interface Props {
  result: GameResult;
  onRetry: () => void;
  onBackToSetup: () => void;
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="result-row">
      <span className="result-row-label">{label}</span>
      <span className="result-row-value">
        {value}
        {sub && <span className="result-row-sub">{sub}</span>}
      </span>
    </div>
  );
}

export function ResultScreen({ result, onRetry, onBackToSetup }: Props) {
  const { elapsedMs, stats, kpm, accuracy, efficiency } = result;
  const elapsed = (elapsedMs / 1000).toFixed(2);
  const accuracyPct = Math.round(accuracy * 100);
  const efficiencyPct = Math.round(efficiency * 100);

  return (
    <div className="screen result">
      <div className="result-header">
        <div className="result-time">
          {elapsed}
          <span className="result-time-unit">秒</span>
        </div>
        <div className="result-kpm">
          {kpm}
          <span className="result-kpm-unit">打/分</span>
        </div>
      </div>

      <div className="result-card">
        <div className="result-section-label">打鍵</div>
        <StatRow label="全タイプ数" value={`${stats.totalKeys}`} sub="打" />
        <StatRow label="正タイプ" value={`${stats.correctKeys}`} sub="打" />
        <StatRow label="誤タイプ" value={`${stats.missKeys}`} sub="打" />
        <StatRow label="バックスペース" value={`${stats.backspaceCount}`} sub="回" />
      </div>

      <div className="result-card">
        <div className="result-section-label">成績</div>
        <StatRow label="精度" value={`${accuracyPct}`} sub="%" />
        <StatRow label="効率" value={`${efficiencyPct}`} sub="% (文字数/正打数)" />
        <StatRow label="クリア文章数" value={`${stats.clearedProblems}`} sub="問" />
        <StatRow label="入力文字数" value={`${stats.clearedChars}`} sub="文字" />
      </div>

      <div className="result-actions">
        <button className="btn-primary" onClick={onRetry}>
          もう一度
        </button>
        <button onClick={onBackToSetup}>設定に戻る</button>
      </div>
    </div>
  );
}
