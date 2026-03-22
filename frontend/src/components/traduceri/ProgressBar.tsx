"use client";

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="opacity-60">Progres traducere</span>
        <span className="text-chalk-yellow">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-chalk-green to-chalk-yellow rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
