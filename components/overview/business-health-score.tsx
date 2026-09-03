import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import type { BusinessHealthScore as BusinessHealthScoreType } from "@/lib/analytics/business-health-score";

type BusinessHealthScoreProps = {
  score: BusinessHealthScoreType;
};

function getScoreColor(score: number) {
  if (score >= 70) return "text-accent";
  if (score >= 40) return "text-warning";
  return "text-destructive-vibrant";
}

function getScoreBgColor(score: number) {
  if (score >= 70) return "bg-accent-soft";
  if (score >= 40) return "bg-warning-soft";
  return "bg-destructive-soft";
}

function getScoreRingColor(score: number) {
  if (score >= 70) return "stroke-accent";
  if (score >= 40) return "stroke-warning";
  return "stroke-destructive-vibrant";
}

function getScoreGradientId(score: number) {
  if (score >= 70) return "healthScoreGradient";
  return undefined;
}

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45; // raio = 45
  const offset = circumference - (score / 100) * circumference;
  const hasGradient = score >= 70;
  const gradientId = getScoreGradientId(score);

  return (
    <div className="relative h-24 w-24">
      <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
        {hasGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C7F000" stopOpacity="1" />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity="1" />
            </linearGradient>
          </defs>
        )}
        {/* Círculo de fundo */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted"
        />
        {/* Círculo do progresso */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={hasGradient ? `url(#${gradientId})` : "currentColor"}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={hasGradient ? "transition-all duration-500" : `transition-all duration-500 ${getScoreRingColor(score)}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${score >= 70 ? "text-accent" : getScoreColor(score)}`}>{score}</span>
      </div>
    </div>
  );
}

export function BusinessHealthScore({ score }: BusinessHealthScoreProps) {
  return (
    <Card className={`transition-all hover:shadow-lg hover:-translate-y-0.5 ${score.score >= 70 ? "hover:shadow-accent/10" : ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Business Health Score</h3>
              <Tooltip content="Score de 0-100 calculado com base em lucro, ROI, alertas e tendência de receita. Quanto maior, melhor a saúde do negócio.">
                <span className="cursor-help text-[10px] text-muted-foreground">ℹ️</span>
              </Tooltip>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Indicador geral de saúde financeira</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ScoreCircle score={score.score} />
          <div className="flex-1 space-y-3">
            <div className={`inline-flex items-center rounded-xl border px-4 py-2 ${getScoreBgColor(score.score)} ${score.score >= 70 ? "border-accent/30" : score.score >= 40 ? "border-warning/30" : "border-destructive-vibrant/30"}`}>
              <span className={`text-sm font-semibold ${getScoreColor(score.score)}`}>{score.label}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{score.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
