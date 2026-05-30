import { useState, useEffect, useCallback, useRef } from "react";
import type { RomajiRule, GameState, GameResult, GameConfig, Problem, GameStats } from "../types";
import { tryConsume, isValidPrefix, getCandidates, tryDirect } from "../lib/romajiEngine";
import { shuffle } from "../lib/utils";

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [candidates, setCandidates] = useState<ReturnType<typeof getCandidates> | null>(null);
  const [lastConfig, setLastConfig] = useState<GameConfig | null>(null);
  const rulesRef = useRef<RomajiRule[]>([]);
  const timerRef = useRef<number | null>(null);
  // timeモード用のカウントダウンタイマー
  const timeTimerRef = useRef<number | null>(null);

  const startTimer = useCallback((startTime: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState((s) => (s ? { ...s, elapsedMs: Date.now() - startTime } : s));
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeTimerRef.current) {
      clearTimeout(timeTimerRef.current);
      timeTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const endGame = useCallback(() => {
    stopTimer();
    setState((s) => (s ? { ...s, status: "result" } : s));
  }, [stopTimer]);

  const startGame = useCallback(
    (config: GameConfig, allProblems: Problem[], rules: RomajiRule[]) => {
      stopTimer();
      setLastConfig(config);
      rulesRef.current = rules; // 引数から受け取る

      let problems = shuffle(allProblems);
      if (config.mode === "count" && config.problemCount) {
        problems = problems.slice(0, config.problemCount);
      }

      const startTime = Date.now();
      setState({
        status: "playing",
        config,
        problems,
        currentIndex: 0,
        reading: problems[0].reading,
        readingPos: 0,
        pending: "",
        wrongPending: "",
        startTime,
        elapsedMs: 0,
        stats: {
          totalKeys: 0,
          correctKeys: 0,
          missKeys: 0,
          backspaceCount: 0,
          clearedChars: 0,
          clearedProblems: 0
        }
      });

      if (config.mode === "time" && config.timeLimitMs) {
        timeTimerRef.current = setTimeout(() => endGame(), config.timeLimitMs);
      }

      startTimer(startTime);
    },
    [stopTimer, startTimer, endGame]
  );

  const handleKey = useCallback(
    (key: string) => {
      // Backspaceでpendingを1文字削除
      if (key === "Backspace") {
        setState((prev) => {
          if (!prev || prev.status !== "playing" || prev.pending === "") return prev;
          return {
            ...prev,
            wrongPending: "",
            pending: prev.pending.slice(0, -1),
            stats: { ...prev.stats, backspaceCount: prev.stats.backspaceCount + 1 }
          };
        });
        return;
      }

      if (key.length !== 1) return;
      const rules = rulesRef.current;
      setState((prev) => {
        if (!prev || prev.status !== "playing") return prev;
        const newPending = prev.pending + key;
        const startTime = prev.startTime ?? Date.now();

        const consumed = tryConsume(rules, newPending, prev.reading, prev.readingPos);
        if (consumed) {
          const { newPos, newPending: nextPending } = consumed;
          const addedChars = newPos - prev.readingPos; // クリアしたひらがな文字数
          const newStats: GameStats = {
            ...prev.stats,
            totalKeys: prev.stats.totalKeys + 1,
            correctKeys: prev.stats.correctKeys + 1
          };

          if (newPos >= prev.reading.length && nextPending === "") {
            // 1文章クリア
            newStats.clearedChars = prev.stats.clearedChars + addedChars;
            newStats.clearedProblems = prev.stats.clearedProblems + 1;

            const nextIndex = prev.currentIndex + 1;
            const isLast = nextIndex >= prev.problems.length;

            if (isLast && prev.config.mode === "count") {
              stopTimer();
              return { ...prev, status: "result", elapsedMs: Date.now() - startTime, startTime, stats: newStats };
            }
            const nextProblems = isLast ? shuffle(prev.problems) : prev.problems;
            const nextIdx = isLast ? 0 : nextIndex;
            return {
              ...prev,
              wrongPending: "",
              problems: nextProblems,
              currentIndex: nextIdx,
              reading: nextProblems[nextIdx].reading,
              readingPos: 0,
              pending: "",
              startTime,
              stats: newStats
            };
          }

          newStats.clearedChars = prev.stats.clearedChars + addedChars;
          return { ...prev, wrongPending: "", readingPos: newPos, pending: nextPending, startTime, stats: newStats };
        }

        if (isValidPrefix(rules, newPending, prev.reading, prev.readingPos)) {
          return {
            ...prev,
            pending: newPending,
            stats: {
              ...prev.stats,
              wrongPending: "",
              totalKeys: prev.stats.totalKeys + 1,
              correctKeys: prev.stats.correctKeys + 1
            }
          };
        }

        // pendingが空のときのみ直接照合を試みる（記号など）
        if (prev.pending === "") {
          const direct = tryDirect(key, prev.reading, prev.readingPos);
          if (direct) {
            const { newPos } = direct;
            const addedChars = newPos - prev.readingPos;
            const newStats: GameStats = {
              ...prev.stats,
              totalKeys: prev.stats.totalKeys + 1,
              correctKeys: prev.stats.correctKeys + 1,
              clearedChars: prev.stats.clearedChars + addedChars
            };

            const nextIndex = prev.currentIndex + 1;
            const isLast = newPos >= prev.reading.length;

            if (isLast) {
              newStats.clearedProblems = prev.stats.clearedProblems + 1;
              if (prev.config.mode === "count" && nextIndex >= prev.problems.length) {
                stopTimer();
                return { ...prev, status: "result", elapsedMs: Date.now() - startTime, startTime, stats: newStats };
              }
              const nextProblems = nextIndex >= prev.problems.length ? shuffle(prev.problems) : prev.problems;
              const nextIdx = nextIndex >= prev.problems.length ? 0 : nextIndex;
              return {
                ...prev,
                wrongPending: "",
                problems: nextProblems,
                currentIndex: nextIdx,
                reading: nextProblems[nextIdx].reading,
                readingPos: 0,
                pending: "",
                startTime,
                stats: newStats
              };
            }

            return { ...prev, wrongPending: "", readingPos: newPos, pending: "", startTime, stats: newStats };
          }
        }

        // 誤タイプ
        return {
          ...prev,
          wrongPending: key,
          stats: {
            ...prev.stats,
            totalKeys: prev.stats.totalKeys + 1,
            missKeys: prev.stats.missKeys + 1
          }
        };
      });
    },
    [stopTimer]
  );

  const status = state?.status;
  useEffect(() => {
    if (status !== "playing") return;

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      handleKey(e.key);
    };

    window.addEventListener("keydown", onKey, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [status, handleKey]);

  useEffect(() => {
    if (state?.status === "playing") {
      setCandidates(getCandidates(rulesRef.current, state.pending, state.reading, state.readingPos));
    } else {
      setCandidates(null);
    }
  }, [state]);

  const result: GameResult | null =
    state?.status === "result"
      ? (() => {
          const { stats, elapsedMs } = state;
          const minutes = elapsedMs / 60000;
          return {
            elapsedMs,
            stats,
            kpm: Math.round(stats.correctKeys / minutes),
            accuracy: stats.totalKeys > 0 ? stats.correctKeys / stats.totalKeys : 1,
            // ひらがな1文字あたりの平均打鍵数の逆数（1に近いほど短縮）
            efficiency: stats.correctKeys > 0 ? stats.clearedChars / stats.correctKeys : 1
          };
        })()
      : null;

  const resetGame = useCallback(() => {
    stopTimer();
    setState(null);
  }, [stopTimer]);

  return { state, candidates, result, lastConfig, startGame, resetGame };
}
