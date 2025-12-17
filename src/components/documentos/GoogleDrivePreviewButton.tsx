import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { GoogleDriveViewer } from './GoogleDriveViewer';
import { toast } from 'sonner';

interface GoogleDrivePreviewButtonProps {
  driveFileId: string | null;
  fileName: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function GoogleDrivePreviewButton({
  driveFileId,
  fileName,
  className,
  variant = 'outline',
  size = 'sm'
}: GoogleDrivePreviewButtonProps) {
  const [open, setOpen] = useState(false);

  const handlePreview = () => {
    if (!driveFileId) {
      toast.error('Documento não disponível no Google Drive');
      return;
    }

    setOpen(true);
  };

  if (!driveFileId) {
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
        Ver no Drive
      </Button>

      <GoogleDriveViewer
        fileId={driveFileId}
        fileName={fileName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
