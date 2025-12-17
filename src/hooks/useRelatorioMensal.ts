import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generatePDFFromHTML } from '@/utils/pdfExport';

export interface ReportData {
  organizacao: {
    id: string;
    nome: string;
    cnpj: string | null;
  };
  projeto: {
    id: string;
    nome: string;
    tipo: string;
    fase_atual: string;
    data_inicio: string | null;
  };
  documentos: {
    total: number;
    aprovados: number;
    pendentes: number;
    rejeitados: number;
    enviados: number;
    percentual_aprovado: number;
  };
  diagnostico: {
    status: string;
    score_geral: number | null;
    nivel_maturidade: string | null;
    pontos_fortes: string[] | null;
    pontos_atencao: string[] | null;
    scores: {
      estrutura_societaria: number | null;
      governanca: number | null;
      compliance: number | null;
      gestao: number | null;
      planejamento: number | null;
    };
  } | null;
  adesoes_etica: {
    total_membros: number;
    total_adesoes: number;
    percentual_adesao: number;
  };
  treinamentos: {
    total_obrigatorios: number;
    total_concluidos: number;
    percentual_conclusao: number;
  };
  gerado_em: string;
  periodo: string;
}

export function useRelatorioMensal() {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { toast } = useToast();

  const fetchReportData = async (organizacaoId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-monthly-report', {
        body: { action: 'get-data', organizacao_id: organizacaoId },
      });

      if (error) throw error;
      setReportData(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message || 'Não foi possível carregar os dados do relatório.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateHTMLReport = async (organizacaoId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-monthly-report', {
        body: { action: 'generate', organizacao_id: organizacaoId },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: error.message || 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async (organizacaoId: string, nomeOrganizacao: string) => {
    setIsLoading(true);
    try {
      const html = await generateHTMLReport(organizacaoId);
      if (!html) return;

      // Generate PDF from HTML
      const pdfBlob = await generatePDFFromHTML(html);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_Mensal_${nomeOrganizacao.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Relatório gerado',
        description: 'Download do PDF iniciado com sucesso.',
      });
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Erro ao baixar relatório',
        description: error.message || 'Não foi possível baixar o relatório.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    reportData,
    fetchReportData,
    generateHTMLReport,
    downloadPDF,
  };
}
