import { cn } from "@/lib/utils";
import type { Difficulty } from "@/store/assignmentStore";

const config: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: "Easy", className: "bg-green-100 text-green-700 border-green-200" },
  medium: { label: "Moderate", className: "bg-amber-100 text-amber-700 border-amber-200" },
  hard: { label: "Hard", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { label, className } = config[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border letter-tight",
        className
      )}
    >
      {label}
    </span>
  );
}
