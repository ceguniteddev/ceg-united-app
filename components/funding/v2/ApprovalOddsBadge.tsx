// ============================================
// ApprovalOddsBadge — Color-coded percentage badge
// ============================================
// Renders approval odds with appropriate color: High (green), Medium (yellow), Low (red)

interface ApprovalOddsBadgeProps {
  odds: number; // 0-100
}

export function ApprovalOddsBadge({ odds }: ApprovalOddsBadgeProps) {
  // Default to 0 if odds is undefined/null and cap at 98%
  const percentage = Math.min(odds ?? 0, 98);

  // Determine color scheme based on odds
  const getColorClasses = () => {
    if (percentage >= 70) {
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-200",
        label: "High",
      };
    } else if (percentage >= 40) {
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
        label: "Medium",
      };
    } else {
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        label: "Low",
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className="text-xs font-semibold">{percentage}%</span>
      <span className="text-xs font-medium">{colors.label}</span>
    </div>
  );
}
