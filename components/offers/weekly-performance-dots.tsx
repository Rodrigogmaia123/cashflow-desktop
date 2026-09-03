"use client";

type Props = {
  days: number[]; // Últimos 7 valores de ROI (já existentes)
};

/**
 * Indicador visual compacto dos últimos 7 dias usando quadradinhos coloridos
 * Semântica de cores fixa baseada em ROI
 */
export function WeeklyPerformanceDots({ days }: Props) {
  // Pegar os últimos 7 valores (ou menos se não houver)
  const last7Days = days.slice(-7);
  
  // Completar à esquerda com null se houver menos de 7 dias
  const paddedDays: (number | null)[] = [];
  const missingDays = 7 - last7Days.length;
  
  for (let i = 0; i < missingDays; i++) {
    paddedDays.push(null);
  }
  
  paddedDays.push(...last7Days);

  return (
    <div className="flex items-center justify-center gap-1 h-3">
      {paddedDays.map((roi, index) => {
        // Determinar cor baseado no ROI
        let colorClass = "";
        
        if (roi === null) {
          // Sem dados - cinza
          colorClass = "bg-neutral-700";
        } else if (roi < 1.0) {
          // Dia ruim - vermelho
          colorClass = "bg-red-500";
        } else if (roi >= 1.0 && roi < 1.5) {
          // Atenção - amarelo
          colorClass = "bg-yellow-500";
        } else {
          // Dia bom - verde
          colorClass = "bg-green-500";
        }

        return (
          <div
            key={index}
            className={`w-2 h-2 rounded-[2px] opacity-85 ${colorClass}`}
            style={{ width: "8px", height: "8px" }}
          />
        );
      })}
    </div>
  );
}

