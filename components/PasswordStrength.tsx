"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

type Checks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

const requirementList: { key: keyof Checks; label: string }[] = [
  { key: "length", label: "8 minimum characters" },
  { key: "upper", label: "Require uppercase character" },
  { key: "lower", label: "Require lowercase character" },
  { key: "number", label: "Require numeric character" },
  { key: "special", label: "Require special character" },
];

function evaluate(password: string): Checks {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    // exclude space from counting as special:
    special: /[^\w\s]/.test(password),
  };
}

function scoreFromChecks(c: Checks) {
  return Object.values(c).filter(Boolean).length; // 0..5
}

function colorByScore(score: number) {
  if (score <= 2) return "bg-red-500";
  if (score === 3) return "bg-yellow-500";
  if (score === 4) return "bg-lime-500";
  return "bg-green-500";
}

function labelByScore(score: number) {
  return ["Very weak", "Weak", "Okay", "Good", "Strong", "Strong"][score] ?? "Very weak";
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = evaluate(password ?? "");
  const score = scoreFromChecks(checks);
  const percent = (score / 5) * 100;

  return (
    <div className="space-y-2" aria-live="polite">
      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-2 ${colorByScore(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
      </div>

      {/* Label */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Password strength</span>
        <motion.span
          key={score}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="font-medium"
        >
          {labelByScore(score)}
        </motion.span>
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
        {requirementList.map(({ key, label }) => {
          const ok = checks[key];
          return (
            <li key={key} className="flex items-center gap-2">
              <AnimatePresence mode="wait" initial={false}>
                {ok ? (
                  <motion.span
                    key="ok"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    className="text-green-600"
                    aria-hidden
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="no"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    className="text-red-500"
                    aria-hidden
                  >
                    <XCircle className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
              <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
