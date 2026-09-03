"use client";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Mockup da Tela de Fluxo de Caixa
 * 
 * Mostra:
 * - Tabela com entradas e saídas
 * - Filtros mensais
 * - Tags de categoria
 * - Indicador de saldo
 */
export function CashflowPreview() {
  const transactions = [
    {
      date: "15/01/2024",
      description: "Venda - Curso Avançado",
      category: "Vendas",
      type: "income",
      amount: 2497.00,
    },
    {
      date: "14/01/2024",
      description: "Taxa de plataforma",
      category: "Taxas",
      type: "expense",
      amount: 124.85,
    },
    {
      date: "14/01/2024",
      description: "Venda - E-book Premium",
      category: "Vendas",
      type: "income",
      amount: 97.00,
    },
    {
      date: "13/01/2024",
      description: "Anúncios Facebook",
      category: "Marketing",
      type: "expense",
      amount: 850.00,
    },
    {
      date: "12/01/2024",
      description: "Venda - Curso Básico",
      category: "Vendas",
      type: "income",
      amount: 497.00,
    },
    {
      date: "11/01/2024",
      description: "Assinatura ferramentas",
      category: "Ferramentas",
      type: "expense",
      amount: 299.00,
    },
  ];

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Fluxo de Caixa
            </h1>
            <p className="text-sm text-muted-foreground">
              Entradas e saídas do período
            </p>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg border border-white/10 bg-card px-3 py-1.5 text-sm text-foreground">
              <option>Janeiro 2024</option>
              <option>Dezembro 2023</option>
              <option>Novembro 2023</option>
            </select>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Total de Entradas
              </div>
              <div className="text-2xl font-bold text-success">
                R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-destructive/10 to-destructive/5">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Total de Saídas
              </div>
              <div className="text-2xl font-bold text-destructive">
                R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Saldo do Período
              </div>
              <div className="text-2xl font-bold text-accent">
                R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="border-white/10">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((transaction, index) => (
                    <tr
                      key={index}
                      className="transition-colors hover:bg-card-hover"
                    >
                      <td className="px-6 py-4 text-sm text-foreground">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md border border-white/10 bg-card-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                          {transaction.category}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 text-right text-sm font-semibold ${
                          transaction.type === "income"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}R${" "}
                        {transaction.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

