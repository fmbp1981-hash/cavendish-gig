"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PDFViewer = dynamic(() => import('./PDFViewer').then(mod => ({ default: mod.PDFViewer })), {
  ssr: false,
  loading: () => null
});

interface DocumentoPreviewButtonProps {
  url?: string | null;
  storagePath?: string | null;
  fileName: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DocumentoPreviewButton({
  url,
  storagePath,
  fileName,
  className,
  variant = 'outline',
  size = 'sm'
}: DocumentoPreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPDF = fileName.toLowerCase().endsWith('.pdf') ||
    (url ?? '').toLowerCase().endsWith('.pdf');

  const handlePreview = async () => {
    if (!isPDF) {
      toast.info('Preview disponível apenas para PDFs. Use o botão Baixar para outros formatos.');
      return;
    }

    // Gera signed URL a partir do storage_path (bucket privado)
    if (storagePath) {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('documentos')
          .createSignedUrl(storagePath, 3600); // 1 hora

        if (error) throw error;
        setSignedUrl(data.signedUrl);
        setOpen(true);
      } catch (err) {
        console.error('Erro ao gerar URL de preview:', err);
        toast.error('Não foi possível gerar o link de preview.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback: usa url direta (apenas para URLs externas/públicas)
    if (url) {
      setSignedUrl(url);
      setOpen(true);
      return;
    }

    toast.error('Arquivo não disponível para preview.');
  };

  if (!storagePath && !url) return null;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handlePreview}
        disabled={loading}
        className={className}
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
          : <Eye className="h-4 w-4 mr-2" />
        }
        Visualizar
      </Button>

      {signedUrl && (
        <PDFViewer
          url={signedUrl}
          fileName={fileName}
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setSignedUrl(null);
          }}
        />
      )}
    </>
  );
}
