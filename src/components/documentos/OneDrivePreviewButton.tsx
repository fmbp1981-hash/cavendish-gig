import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { OneDriveViewer } from './OneDriveViewer';
import { toast } from 'sonner';

interface OneDrivePreviewButtonProps {
  driveFileId: string | null;
  fileName: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function OneDrivePreviewButton({
  driveFileId,
  fileName,
  className,
  variant = 'outline',
  size = 'sm'
}: OneDrivePreviewButtonProps) {
  const [open, setOpen] = useState(false);

  const handlePreview = () => {
    if (!driveFileId) {
      toast.error('Documento não disponível no OneDrive');
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
        Ver no OneDrive
      </Button>

      <OneDriveViewer
        fileId={driveFileId}
        fileName={fileName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
