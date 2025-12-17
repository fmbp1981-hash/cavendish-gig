import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import { toast } from 'sonner';

interface DocumentoPreviewButtonProps {
  url: string | null;
  fileName: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DocumentoPreviewButton({
  url,
  fileName,
  className,
  variant = 'outline',
  size = 'sm'
}: DocumentoPreviewButtonProps) {
  const [open, setOpen] = useState(false);

  const handlePreview = () => {
    if (!url) {
      toast.error('URL do documento não disponível');
      return;
    }

    // Check if it's a PDF
    const isPDF = url.toLowerCase().endsWith('.pdf') || fileName.toLowerCase().endsWith('.pdf');

    if (!isPDF) {
      toast.info('Preview disponível apenas para PDFs. Baixe o arquivo para visualizar.');
      return;
    }

    setOpen(true);
  };

  if (!url) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handlePreview}
        className={className}
      >
        <Eye className="h-4 w-4 mr-2" />
        Visualizar
      </Button>

      <PDFViewer
        url={url}
        fileName={fileName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
