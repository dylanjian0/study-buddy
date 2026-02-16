"use client";

import { useState } from "react";
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
  onBack: () => void;
}

export default function QuizMode({ questions, onBack }: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [completed, setCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_answer;

  const handleSelect = (optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);

    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedAnswer;
    setAnswers(newAnswers);

    if (selectedAnswer === currentQuestion.correct_answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers(new Array(questions.length).fill(null));
    setCompleted(false);
  };

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "";
    let messageColor = "";
    if (percentage >= 80) {
      message = "Excellent work! You really know this material!";
      messageColor = "text-emerald-600";
    } else if (percentage >= 60) {
      message = "Good job! A bit more review and you'll ace it!";
      messageColor = "text-amber-600";
    } else {
      message =
        "Keep studying! Review the study guide and try again.";
      messageColor = "text-red-600";
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quiz Complete!
          </h2>
          <p className="text-4xl font-bold text-indigo-600 mb-2">
            {score}/{questions.length}
          </p>
          <p className="text-gray-500 mb-2">{percentage}% correct</p>
          <p className={`font-medium mb-8 ${messageColor}`}>{message}</p>

          {/* Answer Summary */}
          <div className="mb-8 text-left">
            <h3 className="font-semibold text-gray-700 mb-3">Answer Summary</h3>
            <div className="space-y-2">
              {questions.map((q, i) => {
                const wasCorrect = answers[i] === q.correct_answer;
                return (
                  <div
                    key={i}
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
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl
                font-medium hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to review
            </button>
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl
                font-medium hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <span className="text-sm text-gray-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
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
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
            let optionStyle = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50";
            if (selectedAnswer === i && !showResult) {
              optionStyle = "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200";
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
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${optionStyle} ${
                  showResult ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
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
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                  )}
                  {showResult &&
                    i === selectedAnswer &&
                    !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                    )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && currentQuestion.explanation && (
          <div className="mx-6 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Explanation: </span>
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl
                font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl
                font-medium hover:bg-indigo-700 transition-colors"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                "See Results"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
