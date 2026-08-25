"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2, HelpCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { useChapterMutation } from "@/hooks/educational-materials/chapter";
import { Chapter, QuizQuestion } from "@/schema/educational-materials/course";

interface ChapterQuizFormProps {
  initialData: Chapter;
  courseId: string;
  chapterId: string;
}

export const ChapterQuizForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterQuizFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [passingScore, setPassingScore] = useState<number>(
    initialData.quiz?.passingScorePercentage ?? 70,
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialData.quiz?.questions?.length
      ? initialData.quiz.questions
      : [
          {
            id: "q1",
            question: "",
            options: ["", ""],
            correctAnswerIndex: 0,
            explanation: "",
          },
        ],
  );

  const { updateChapter, isUpdating } = useChapterMutation();
  const router = useRouter();

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        question: "",
        options: ["", ""],
        correctAnswerIndex: 0,
        explanation: "",
      },
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleUpdateQuestionText = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], question: text };
      return copy;
    });
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = {
        ...copy[qIndex],
        options: [...copy[qIndex].options, ""],
      };
      return copy;
    });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOpts = copy[qIndex].options.filter((_, idx) => idx !== optIndex);
      let correctIdx = copy[qIndex].correctAnswerIndex;
      if (correctIdx >= newOpts.length) {
        correctIdx = Math.max(0, newOpts.length - 1);
      }
      copy[qIndex] = {
        ...copy[qIndex],
        options: newOpts,
        correctAnswerIndex: correctIdx,
      };
      return copy;
    });
  };

  const handleUpdateOption = (
    qIndex: number,
    optIndex: number,
    text: string,
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...copy[qIndex].options];
      newOpts[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: newOpts };
      return copy;
    });
  };

  const handleSetCorrectAnswer = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctAnswerIndex: optIndex };
      return copy;
    });
  };

  const handleUpdateExplanation = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], explanation: text };
      return copy;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validQuestions = questions.filter(
      (q) =>
        q.question.trim() !== "" &&
        q.options.filter((o) => o.trim() !== "").length >= 2,
    );

    if (validQuestions.length === 0) {
      toast.error("Please provide at least one valid question with 2 options");
      return;
    }

    try {
      await updateChapter({
        courseId,
        chapterId,
        data: {
          quiz: {
            questions: validQuestions,
            passingScorePercentage: passingScore,
          },
        },
      });
      toast.success("Quiz saved successfully");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to save quiz");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-600" />
          <span>Quiz Questions & Scoring</span>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="ghost"
          size="sm"
        >
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-1" />
              Edit Quiz
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <div className="mt-3 space-y-2 text-sm">
          {initialData.quiz?.questions?.length ? (
            <div>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mb-2">
                <span>{initialData.quiz.questions.length} Question(s)</span>
                <span>
                  Passing Grade: {initialData.quiz.passingScorePercentage}%
                </span>
              </div>
              <div className="space-y-2">
                {initialData.quiz.questions.map((q, i) => (
                  <div
                    key={q.id || i}
                    className="p-3 bg-white dark:bg-slate-950 rounded border text-xs space-y-1"
                  >
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {i + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-gray-500 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-1 px-2 py-1 rounded ${
                            oIdx === q.correctAnswerIndex
                              ? "bg-emerald-50 text-emerald-700 font-medium"
                              : ""
                          }`}
                        >
                          {oIdx === q.correctAnswerIndex && (
                            <Check className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 italic text-xs">
              No quiz questions added yet. Click edit to configure questions.
            </p>
          )}
        </div>
      )}

      {isEditing && (
        <form onSubmit={onSubmit} className="space-y-6 mt-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Passing Score Percentage (%)
            </label>
            <Input
              type="number"
              min={10}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="bg-white dark:bg-slate-950 mt-1 max-w-[150px]"
            />
          </div>

          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div
                key={q.id || qIndex}
                className="p-4 bg-white dark:bg-slate-950 rounded-md border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">
                    Question {qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <Input
                  value={q.question}
                  onChange={(e) =>
                    handleUpdateQuestionText(qIndex, e.target.value)
                  }
                  placeholder="Enter the question text..."
                  className="font-medium text-sm"
                />

                <div className="space-y-2">
                  <label className="text-xs text-gray-500 font-semibold block">
                    Answer Options (Click checkmark to select correct answer)
                  </label>
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          optIndex === q.correctAnswerIndex
                            ? "default"
                            : "outline"
                        }
                        className={`h-8 w-8 p-0 rounded-full shrink-0 ${
                          optIndex === q.correctAnswerIndex
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : ""
                        }`}
                        onClick={() => handleSetCorrectAnswer(qIndex, optIndex)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Input
                        value={opt}
                        onChange={(e) =>
                          handleUpdateOption(qIndex, optIndex, e.target.value)
                        }
                        placeholder={`Option ${optIndex + 1}`}
                        className="text-xs"
                      />
                      {q.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(qIndex, optIndex)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddOption(qIndex)}
                    className="text-xs text-purple-600"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Option
                  </Button>
                </div>

                <Input
                  value={q.explanation || ""}
                  onChange={(e) =>
                    handleUpdateExplanation(qIndex, e.target.value)
                  }
                  placeholder="Explanation / feedback for correct answer (optional)..."
                  className="text-xs text-gray-500 italic"
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Another Question
            </Button>
          </div>

          <div className="flex items-center gap-x-2 pt-2">
            <Button disabled={isUpdating} type="submit" size="sm">
              Save Quiz
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
