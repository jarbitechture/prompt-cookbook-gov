import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, RotateCcw, Trophy, AlertCircle } from "lucide-react";
import type { TasteTest, TasteTestQuestion } from "@/lib/tasteTests";

interface TasteTestModalProps {
  test: TasteTest;
  onClose: () => void;
  onPass: (testId: string) => void;
}

export default function TasteTestModal({ test, onClose, onPass }: TasteTestModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | number | null)[]>(
    () => new Array(test.questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const question = test.questions[currentIndex];
  const progress = ((currentIndex + 1) / test.questions.length) * 100;
  const currentAnswer = answers[currentIndex];

  const setAnswer = useCallback(
    (value: string | number) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = value;
        return next;
      });
    },
    [currentIndex]
  );

  const handleNext = () => {
    if (currentIndex < test.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate score
      let correct = 0;
      test.questions.forEach((q, i) => {
        const ans = answers[i];
        if (q.type === "multiple-choice" || q.type === "scenario-match") {
          if (ans === q.correctAnswer) correct++;
        } else {
          // For text-based answers, check if the answer contains the keyword
          if (
            typeof ans === "string" &&
            typeof q.correctAnswer === "string" &&
            ans.toLowerCase().includes(q.correctAnswer.toLowerCase())
          ) {
            correct++;
          }
        }
      });
      setScore(correct);
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers(new Array(test.questions.length).fill(null));
    setShowResults(false);
    setScore(0);
  };

  const passed = score >= test.passingScore;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "oklch(0.998 0.002 70)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid oklch(0.92 0.01 70)" }}
        >
          <div>
            <h2 className="font-serif font-bold text-lg" style={{ color: "oklch(0.20 0.025 38)" }}>
              {test.title}
            </h2>
            {!showResults && (
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.04 50)" }}>
                Question {currentIndex + 1} of {test.questions.length}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
            style={{ color: "oklch(0.50 0.04 50)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {!showResults && (
          <div className="h-1" style={{ background: "oklch(0.92 0.01 70)" }}>
            <motion.div
              className="h-full"
              style={{ background: "oklch(0.55 0.12 45)" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-5">
          <AnimatePresence mode="wait">
            {showResults ? (
              <ResultsView
                key="results"
                score={score}
                total={test.questions.length}
                passing={test.passingScore}
                passed={passed}
                questions={test.questions}
                answers={answers}
                onRetry={handleRetry}
                onPass={() => {
                  onPass(test.id);
                  onClose();
                }}
              />
            ) : (
              <QuestionView
                key={question.id}
                question={question}
                answer={currentAnswer}
                onAnswer={setAnswer}
                onNext={handleNext}
                isLast={currentIndex === test.questions.length - 1}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ── Question View ──────────────────────────────────────────

function QuestionView({
  question,
  answer,
  onAnswer,
  onNext,
  isLast,
}: {
  question: TasteTestQuestion;
  answer: string | number | null;
  onAnswer: (v: string | number) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const canProceed =
    answer !== null && answer !== undefined && (typeof answer !== "string" || answer.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.2 }}
    >
      <p className="font-medium text-sm mb-4 leading-relaxed" style={{ color: "oklch(0.25 0.03 40)" }}>
        {question.question}
      </p>

      {/* Multiple choice / Scenario match */}
      {(question.type === "multiple-choice" || question.type === "scenario-match") && question.options && (
        <div className="space-y-2 mb-5">
          {question.options.map((opt, i) => {
            const selected = answer === i;
            return (
              <button
                key={i}
                onClick={() => onAnswer(i)}
                className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all"
                style={{
                  background: selected ? "oklch(0.55 0.12 45 / 0.12)" : "oklch(0.96 0.005 70)",
                  border: selected
                    ? "2px solid oklch(0.55 0.12 45)"
                    : "1px solid oklch(0.90 0.01 70)",
                  color: selected ? "oklch(0.30 0.06 40)" : "oklch(0.35 0.03 45)",
                  fontWeight: selected ? 600 : 400,
                }}
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2"
                  style={{
                    background: selected ? "oklch(0.55 0.12 45)" : "oklch(0.88 0.02 70)",
                    color: selected ? "oklch(0.98 0.01 75)" : "oklch(0.50 0.04 50)",
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Prompt fix */}
      {question.type === "prompt-fix" && (
        <div className="mb-5">
          <textarea
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Rewrite the prompt here..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg text-sm resize-none"
            style={{
              background: "oklch(0.96 0.005 70)",
              border: "1px solid oklch(0.88 0.02 70)",
              color: "oklch(0.25 0.03 40)",
            }}
          />
        </div>
      )}

      {/* Fill the recipe */}
      {question.type === "fill-the-recipe" && (
        <div className="mb-5">
          <input
            type="text"
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 rounded-lg text-sm"
            style={{
              background: "oklch(0.96 0.005 70)",
              border: "1px solid oklch(0.88 0.02 70)",
              color: "oklch(0.25 0.03 40)",
            }}
          />
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: canProceed ? "oklch(0.55 0.12 45)" : "oklch(0.88 0.02 70)",
          color: canProceed ? "oklch(0.98 0.01 75)" : "oklch(0.60 0.03 55)",
          cursor: canProceed ? "pointer" : "not-allowed",
        }}
      >
        {isLast ? "Submit" : "Next"}
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ── Results View ──────────────────────────────────────────

function ResultsView({
  score,
  total,
  passing,
  passed,
  questions,
  answers,
  onRetry,
  onPass,
}: {
  score: number;
  total: number;
  passing: number;
  passed: boolean;
  questions: TasteTestQuestion[];
  answers: (string | number | null)[];
  onRetry: () => void;
  onPass: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Score summary */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{
          background: passed ? "oklch(0.55 0.14 145 / 0.15)" : "oklch(0.55 0.18 25 / 0.15)",
        }}>
          {passed ? (
            <Trophy className="w-8 h-8" style={{ color: "oklch(0.50 0.14 145)" }} />
          ) : (
            <AlertCircle className="w-8 h-8" style={{ color: "oklch(0.50 0.18 25)" }} />
          )}
        </div>
        <h3
          className="font-serif font-bold text-xl mb-1"
          style={{ color: passed ? "oklch(0.40 0.12 145)" : "oklch(0.40 0.15 25)" }}
        >
          {passed ? "Passed!" : "Not quite..."}
        </h3>
        <p className="text-sm" style={{ color: "oklch(0.50 0.04 50)" }}>
          You scored <strong>{score}</strong> out of <strong>{total}</strong> (need {passing} to pass)
        </p>
      </div>

      {/* Question breakdown */}
      <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
        {questions.map((q, i) => {
          const ans = answers[i];
          let isCorrect = false;
          if (q.type === "multiple-choice" || q.type === "scenario-match") {
            isCorrect = ans === q.correctAnswer;
          } else {
            isCorrect =
              typeof ans === "string" &&
              typeof q.correctAnswer === "string" &&
              ans.toLowerCase().includes(q.correctAnswer.toLowerCase());
          }

          return (
            <div
              key={q.id}
              className="rounded-lg px-4 py-3 text-xs"
              style={{
                background: isCorrect ? "oklch(0.96 0.02 145)" : "oklch(0.96 0.02 25)",
                border: isCorrect ? "1px solid oklch(0.85 0.06 145)" : "1px solid oklch(0.85 0.06 25)",
              }}
            >
              <p className="font-medium mb-1" style={{ color: "oklch(0.30 0.03 40)" }}>
                {isCorrect ? "Correct" : "Incorrect"} — Q{i + 1}
              </p>
              <p style={{ color: "oklch(0.45 0.03 48)" }}>{q.explanation}</p>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {passed ? (
          <button
            onClick={onPass}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "oklch(0.50 0.14 145)", color: "oklch(0.98 0.01 75)" }}
          >
            <Trophy className="w-4 h-4" />
            Claim Your Tier
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "oklch(0.55 0.12 45)", color: "oklch(0.98 0.01 75)" }}
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
        <button
          onClick={() => {
            if (passed) {
              onPass();
            } else {
              // just close if they want to leave
              const modal = document.querySelector("[data-taste-test-close]");
              if (modal) (modal as HTMLButtonElement).click();
            }
          }}
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: "oklch(0.94 0.01 70)",
            color: "oklch(0.45 0.04 48)",
            border: "1px solid oklch(0.88 0.02 70)",
          }}
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
