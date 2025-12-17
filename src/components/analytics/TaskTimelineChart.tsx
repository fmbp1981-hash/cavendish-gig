import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTarefasTimeline } from "@/hooks/useAnalyticsData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function TaskTimelineChart() {
  const { data, isLoading } = useTarefasTimeline();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Tarefas</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Tarefas</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            Nenhuma tarefa encontrada
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format dates for display
  const formattedData = data.map((item) => ({
    ...item,
    dia: new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Evolução de Tarefas</CardTitle>
        <CardDescription>Concluídas vs Pendentes nos últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="dia"
              interval={4}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="concluidas"
              stroke="#10b981"
              strokeWidth={2}
              name="Concluídas"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="pendentes"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Pendentes"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
