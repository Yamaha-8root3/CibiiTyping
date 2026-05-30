import { useState, useEffect, useCallback } from "react";
import type { KeyTableEntry, Problem, RomajiRule } from "./types";
import { loadProblems, loadKeyTableIndex, loadRomajiRules } from "./lib/loader";
import { useGame } from "./hooks/useGame";
import { SetupScreen } from "./components/SetupScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";

export default function App() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [keyTables, setKeyTables] = useState<KeyTableEntry[]>([]);
  // 選択中のテーブル1つだけキャッシュ
  const [cachedRules, setCachedRules] = useState<{ id: string; rules: RomajiRule[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { state, candidates, result, startGame, resetGame, lastConfig } = useGame();

  useEffect(() => {
    Promise.all([loadProblems(), loadKeyTableIndex()])
      .then(([p, kt]) => {
        setProblems(p);
        setKeyTables(kt);
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  // SetupScreenでテーブル選択が変わったときに呼ぶ
  const handleTableSelect = useCallback(
    async (entry: KeyTableEntry) => {
      if (cachedRules?.id === entry.id) return; // 同じなら再fetchしない
      const rules = await loadRomajiRules(entry.path);
      setCachedRules({ id: entry.id, rules });
    },
    [cachedRules?.id]
  );

  if (loadError) return <div className="error">{loadError}</div>;

  if (problems.length === 0 || keyTables.length === 0) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!state) {
    return (
      <SetupScreen
        problems={problems}
        keyTables={keyTables}
        lastConfig={lastConfig}
        cachedRules={cachedRules}
        onTableSelect={handleTableSelect}
        onStart={(config, probs) => {
          if (!cachedRules) return;
          startGame(config, probs, cachedRules.rules);
        }}
      />
    );
  }
  if (state.status === "playing" && candidates) {
    return (
      <GameScreen
        state={state}
        candidates={candidates}
        onretry={() => {
          if (!cachedRules) return;
          startGame(state.config, problems, cachedRules.rules);
        }}
        onquit={resetGame}
      />
    );
  }
  if (state.status === "result" && result) {
    return (
      <ResultScreen
        result={result}
        onRetry={() => {
          if (!cachedRules) return;
          startGame(state.config, problems, cachedRules.rules);
        }}
        onBackToSetup={resetGame}
      />
    );
  }
  return null;
}
