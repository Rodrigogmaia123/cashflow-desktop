"use client";

import { formatCurrency, formatPercentage, getCategoryStatus } from "@/types/report";
import type { PeriodReport, CategoryBudgetReport } from "@/types/report";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

interface PeriodReportViewProps {
  report: PeriodReport;
}

export function PeriodReportView({ report }: PeriodReportViewProps) {
  const isPositive = report.netDifference >= 0;
  const performanceRate =
    report.categoriesWithBudget > 0
      ? (report.categoriesOK / report.categoriesWithBudget) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header - Resumo Executivo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Relatório de Fechamento
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(report.startDate).toLocaleDateString("pt-BR")} -{" "}
              {new Date(report.endDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              isPositive
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="font-bold text-lg">
              {isPositive ? "+" : ""}
              {formatCurrency(report.netDifference)}
            </span>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <StatCard
            label="Orçado Total"
            value={formatCurrency(report.totalBudgeted)}
            color="blue"
          />
          <StatCard
            label="Gasto Total"
            value={formatCurrency(report.totalSpent)}
            color="purple"
          />
          <StatCard
            label="Economizado"
            value={formatCurrency(report.totalSaved)}
            color="green"
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <StatCard
            label="Estourado"
            value={formatCurrency(report.totalExceeded)}
            color="red"
            icon={<AlertCircle className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Performance Geral
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {report.categoriesWithBudget}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Com Orçamento
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {report.categoriesOK}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">OK</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {report.categoriesExceeded}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Estouraram
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-500">
              {report.categoriesWithoutBudget}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Sem Orçamento
            </div>
          </div>
        </div>

        {/* Barra de Performance */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Taxa de Sucesso
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatPercentage(performanceRate)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={cn(
                "h-3 rounded-full transition-all",
                performanceRate >= 80
                  ? "bg-green-500"
                  : performanceRate >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
              )}
              style={{ width: `${performanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recomendações */}
      {report.recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Recomendações
          </h3>
          <ul className="space-y-2">
            {report.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"
              >
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detalhes por Categoria */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Detalhes por Categoria
        </h3>
        {report.categories.map((category) => (
          <CategoryReportCard key={category.categoryId} category={category} />
        ))}
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface StatCardProps {
  label: string;
  value: string;
  color: "blue" | "purple" | "green" | "red";
  icon?: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    purple:
      "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
    green:
      "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    red: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  };

  const textClasses = {
    blue: "text-blue-900 dark:text-blue-100",
    purple: "text-purple-900 dark:text-purple-100",
    green: "text-green-900 dark:text-green-100",
    red: "text-red-900 dark:text-red-100",
  };

  return (
    <div className={cn("rounded-lg p-4 border", colorClasses[color])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
        {icon}
      </div>
      <div className={cn("text-xl font-bold", textClasses[color])}>{value}</div>
    </div>
  );
}

interface CategoryReportCardProps {
  category: CategoryBudgetReport;
}

function CategoryReportCard({ category }: CategoryReportCardProps) {
  const status = getCategoryStatus(category);

  const colorClasses = {
    green: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    red: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    orange:
      "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    gray: "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700",
  };

  return (
    <div
      className={cn(
        "rounded-lg p-4 border transition-all",
        colorClasses[status.color as keyof typeof colorClasses]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{status.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {category.categoryName}
            </h4>
            {category.budgetName && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {category.budgetName}
              </p>
            )}
          </div>
        </div>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            status.color === "green" &&
              "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
            status.color === "red" &&
              "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
            status.color === "orange" &&
              "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
            status.color === "blue" &&
              "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
            status.color === "gray" &&
              "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-gray-600 dark:text-gray-400">Orçado</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(category.budgetedAmount)}
          </div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400">Gasto</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(category.actualSpent)}
          </div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400">Diferença</div>
          <div
            className={cn(
              "font-semibold",
              category.difference >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {category.difference >= 0 ? "+" : ""}
            {formatCurrency(category.difference)}
          </div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400">% Usado</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {category.budgetedAmount > 0
              ? formatPercentage(category.percentUsed)
              : "N/A"}
          </div>
        </div>
      </div>

      {category.budgetedAmount > 0 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                category.hasExceeded
                  ? "bg-red-500"
                  : category.percentUsed >= 90
                  ? "bg-orange-500"
                  : "bg-green-500"
              )}
              style={{
                width: `${Math.min(category.percentUsed, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
