"use client";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  const pct = Math.round(progress);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="opacity-60">{label || "Progres traducere"}</span>
        <span className="text-chalk-yellow font-bold">{pct}%</span>
      </div>
      <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: pct < 100
              ? "linear-gradient(90deg, var(--chalkboard-light), var(--chalk-yellow))"
              : "linear-gradient(90deg, #4ade80, var(--chalk-yellow))",
          }}
        />
      </div>
    </div>
  );
}
