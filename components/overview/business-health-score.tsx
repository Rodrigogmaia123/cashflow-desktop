import Link from "next/link";
import type { BusinessHealthScore as BusinessHealthScoreType } from "@/lib/analytics/business-health-score";
import { surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

type Banner = {
  name: string;
  detail: string;
  href: string;
};

type BusinessHealthScoreProps = {
  score: BusinessHealthScoreType;
  notice?: string;
  banner?: Banner | null;
};

function ringColor(score: number) {
  if (score >= 70) return "#c7f156";
  if (score >= 40) return "#c9a227";
  return "#f08a7a";
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(score, 100)) / 100) * circumference;
  const color = ringColor(score);

  return (
    <div className="relative h-[108px] w-[108px] shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth="7"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-[34px] font-semibold leading-none" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

export function BusinessHealthScore({ score, notice, banner }: BusinessHealthScoreProps) {
  const tone = ringColor(score.score);

  return (
    <section className={cn(surface, "flex h-full flex-col p-5")}>
      <div className="flex items-center gap-5">
        <ScoreCircle score={score.score} />
        <div className="min-w-0">
          <h2 className="font-display text-[28px] font-semibold leading-none" style={{ color: tone }}>{score.label}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#9ca9a1]">{notice ?? score.description}</p>
        </div>
      </div>
      {banner && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="min-w-0 text-sm text-[#c9c0e8]">
            <span className="mr-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#ac93ff]">Melhor oferta</span>
            <span className="text-foreground">{banner.name}</span> {banner.detail}
          </p>
          <Link href={banner.href} className="shrink-0 text-sm text-[#c7f156] hover:underline">
            Ver ofertas →
          </Link>
        </div>
      )}
    </section>
  );
}
