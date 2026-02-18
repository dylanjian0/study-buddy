"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  position: number;
}

interface QuizModeProps {
  questions: QuizQuestion[];
  isStreaming: boolean;
  onBack: () => void;
}

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);

  return <>{display}</>;
}

const optionVariants = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25, delay: i * 0.06 },
  }),
};

export default function QuizMode({
  questions,
  isStreaming,
  onBack,
}: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answersMap, setAnswersMap] = useState<Map<number, number | null>>(new Map());
  const [completed, setCompleted] = useState(false);
  const confettiFired = useRef(false);

  // Expected total questions for streaming indicator
  const TOTAL_EXPECTED_QUESTIONS = 10;

  // Derive answers array from map, ensuring it has the right length
  const answers = Array.from({ length: questions.length }, (_, i) => answersMap.get(i) ?? null);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_answer;

  const isLastLoadedQuestion = currentIndex === questions.length - 1;
  const moreQuestionsComing = isStreaming && questions.length < TOTAL_EXPECTED_QUESTIONS;
  const waitingForNext =
    isLastLoadedQuestion && moreQuestionsComing && showResult;

  const handleSelect = (optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);

    setAnswersMap((prev) => new Map(prev).set(currentIndex, selectedAnswer));

    if (selectedAnswer === currentQuestion.correct_answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    const isLast = !isStreaming && currentIndex >= questions.length - 1;
    if (isLast) {
      setCompleted(true);
    } else if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswersMap(new Map());
    setCompleted(false);
    confettiFired.current = false;
  };

  // Fire confetti for good scores
  useEffect(() => {
    if (completed && !confettiFired.current) {
      const percentage = Math.round((score / questions.length) * 100);
      if (percentage >= 80) {
        confettiFired.current = true;
        const fire = () => {
          confetti({ particleCount: 80, spread: 70, origin: { x: 0.3, y: 0.6 } });
          confetti({ particleCount: 80, spread: 70, origin: { x: 0.7, y: 0.6 } });
        };
        fire();
        setTimeout(fire, 300);
      }
    }
  }, [completed, score, questions.length]);

  if (completed) {
    const totalAnswered = questions.length;
    const percentage = Math.round((score / totalAnswered) * 100);
    let message = "";
    let messageColor = "";
    if (percentage >= 80) {
      message = "Excellent work! You really know this material!";
      messageColor = "text-emerald-600";
    } else if (percentage >= 60) {
      message = "Good job! A bit more review and you'll ace it!";
      messageColor = "text-amber-600";
    } else {
      message = "Keep studying! Review the study guide and try again.";
      messageColor = "text-red-600";
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6"
          >
            <Trophy className="w-10 h-10 text-indigo-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quiz Complete!
          </h2>
          <p className="text-4xl font-bold text-indigo-600 mb-2">
            <AnimatedCounter value={score} />/{totalAnswered}
          </p>
          <p className="text-gray-500 mb-2">{percentage}% correct</p>
          <p className={`font-medium mb-8 ${messageColor}`}>{message}</p>

          <div className="mb-8 text-left">
            <h3 className="font-semibold text-gray-700 mb-3">Answer Summary</h3>
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            >
              {questions.map((q, i) => {
                const wasCorrect = answers[i] === q.correct_answer;
                return (
                  <motion.div
                    key={i}
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                    className={`p-3 rounded-lg border text-sm ${
                      wasCorrect
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {wasCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-gray-800 font-medium">
                          Q{i + 1}: {q.question}
                        </p>
                        {!wasCorrect && (
                          <p className="text-gray-600 mt-1">
                            Correct answer: {q.options[q.correct_answer]}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl
                font-medium hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to review
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl
                font-medium hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Waiting for first question
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to review
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12">
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/3 mx-auto" />
            <div className="skeleton h-10 w-2/3 mx-auto" />
            <div className="space-y-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">
            Generating your quiz questions...
          </p>
        </div>
      </div>
    );
  }

  const displayTotal = isStreaming
    ? `${questions.length}...`
    : `${questions.length}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to review
        </button>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 rounded-full bg-indigo-500"
            />
          )}
          <span className="text-sm text-gray-500">
            Question {currentIndex + 1} of {displayTotal}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.05 }}
              className={`h-1.5 flex-1 rounded-full origin-left ${
                i < currentIndex
                  ? answers[i] === questions[i].correct_answer
                    ? "bg-emerald-400"
                    : "bg-red-400"
                  : i === currentIndex
                  ? "bg-indigo-400"
                  : "bg-gray-200"
              }`}
            />
          ))}
          {isStreaming && (
            <div className="h-1.5 flex-1 rounded-full bg-gray-100 animate-pulse" />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full mb-3">
              Question {currentIndex + 1}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="p-6 space-y-3">
            {currentQuestion.options.map((option, i) => {
              let optionStyle =
                "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50";
              if (selectedAnswer === i && !showResult) {
                optionStyle =
                  "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200";
              }
              if (showResult) {
                if (i === currentQuestion.correct_answer) {
                  optionStyle = "border-emerald-400 bg-emerald-50";
                } else if (i === selectedAnswer && !isCorrect) {
                  optionStyle = "border-red-400 bg-red-50";
                } else {
                  optionStyle = "border-gray-200 opacity-50";
                }
              }

              return (
                <motion.button
                  key={i}
                  custom={i}
                  variants={optionVariants}
                  initial="hidden"
                  animate="show"
                  whileHover={!showResult ? { scale: 1.01 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  onClick={() => handleSelect(i)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${optionStyle} ${
                    showResult ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors ${
                        selectedAnswer === i && !showResult
                          ? "bg-indigo-600 text-white"
                          : showResult && i === currentQuestion.correct_answer
                          ? "bg-emerald-500 text-white"
                          : showResult && i === selectedAnswer && !isCorrect
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-gray-800">{option}</span>
                    {showResult && i === currentQuestion.correct_answer && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="ml-auto"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </motion.div>
                    )}
                    {showResult && i === selectedAnswer && !isCorrect && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="ml-auto"
                      >
                        <XCircle className="w-5 h-5 text-red-500" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {showResult && currentQuestion.explanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="mx-6 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Explanation: </span>
                    {currentQuestion.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            {!showResult ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl
                  font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </motion.button>
            ) : waitingForNext ? (
              <div className="flex items-center gap-2 px-6 py-2.5 text-gray-500">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 rounded-full bg-indigo-400"
                />
                <span className="text-sm">Loading next question...</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl
                  font-medium hover:bg-indigo-700 transition-colors"
              >
                {!isStreaming && currentIndex >= questions.length - 1 ? (
                  "See Results"
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
