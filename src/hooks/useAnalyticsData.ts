import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDocumentosAnalytics() {
  return useQuery({
    queryKey: ["documentos-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_requeridos_status")
        .select("status");

      if (error) throw error;

      // Count documents by status
      const statusCount = data.reduce((acc: Record<string, number>, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(statusCount).map(([status, count]) => ({
        name: status === "pendente" ? "Pendente" :
              status === "enviado" ? "Enviado" :
              status === "em_analise" ? "Em Análise" :
              status === "aprovado" ? "Aprovado" :
              "Rejeitado",
        value: count,
        status,
      }));
    },
  });
}

export function useProjetosAnalytics() {
  return useQuery({
    queryKey: ["projetos-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select("fase_atual");

      if (error) throw error;

      // Count projects by phase
      const phaseCount = data.reduce((acc: Record<string, number>, projeto) => {
        acc[projeto.fase_atual] = (acc[projeto.fase_atual] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(phaseCount).map(([phase, count]) => ({
        name: phase === "diagnostico" ? "Diagnóstico" :
              phase === "implementacao" ? "Implementação" :
              "Recorrência",
        value: count as number,
        phase,
      }));
    },
  });
}

export function useTreinamentosAnalytics() {
  return useQuery({
    queryKey: ["treinamentos-analytics"],
    queryFn: async () => {
      // Get all organizations with training enrollments
      const { data, error } = await supabase
        .from("treinamento_inscricoes")
        .select(`
          organizacao_id,
          status,
          organizacoes (
            nome
          )
        `);

      if (error) throw error;

      // Group by organization and calculate completion rate
      const orgStats = data.reduce((acc: Record<string, any>, inscricao: any) => {
        const orgId = inscricao.organizacao_id;
        if (!acc[orgId]) {
          acc[orgId] = {
            nome: inscricao.organizacoes?.nome || "Sem Nome",
            total: 0,
            concluidos: 0,
          };
        }
        acc[orgId].total++;
        if (inscricao.status === "concluido") {
          acc[orgId].concluidos++;
        }
        return acc;
      }, {});

      // Calculate percentages and format for chart
      return Object.values(orgStats).map((org: any) => ({
        name: org.nome,
        total: org.total,
        concluidos: org.concluidos,
        taxa: Math.round((org.concluidos / org.total) * 100),
      })).slice(0, 10); // Top 10 organizations
    },
  });
}

export function useTarefasTimeline() {
  return useQuery({
    queryKey: ["tarefas-timeline"],
    queryFn: async () => {
      // Get tasks completed in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("tarefas")
        .select("status, updated_at")
        .gte("updated_at", thirtyDaysAgo.toISOString())
        .order("updated_at");

      if (error) throw error;

      // Group by day and count completed tasks
      const dailyStats: Record<string, { date: string; concluidas: number; pendentes: number }> = {};

      data.forEach((tarefa) => {
        const date = new Date(tarefa.updated_at).toISOString().split("T")[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { date, concluidas: 0, pendentes: 0 };
        }
        if (tarefa.status === "concluida") {
          dailyStats[date].concluidas++;
        } else {
          dailyStats[date].pendentes++;
        }
      });

      // Fill missing days with zeros
      const result = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        result.push(
          dailyStats[dateStr] || {
            date: dateStr,
            concluidas: 0,
            pendentes: 0,
          }
        );
      }

      return result;
    },
  });
}

export function useOrganizacoesTimeline() {
  return useQuery({
    queryKey: ["organizacoes-timeline"],
    queryFn: async () => {
      // Get organizations created in the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from("organizacoes")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at");

      if (error) throw error;

      // Group by month
      const monthlyStats: Record<string, number> = {};

      data.forEach((org) => {
        const date = new Date(org.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
      });

      // Fill missing months with zeros and format
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthName = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
        result.push({
          mes: monthName,
          total: monthlyStats[monthKey] || 0,
        });
      }

      return result;
    },
  });
}
