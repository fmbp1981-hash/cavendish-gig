import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface GoogleDriveViewerProps {
  fileId: string | null;
  fileName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleDriveViewer({
  fileId,
  fileName = 'Documento',
  open,
  onOpenChange
}: GoogleDriveViewerProps) {
  if (!fileId) {
    return null;
  }

  const embedLink = `https://drive.google.com/file/d/${fileId}/preview`;
  const viewLink = `https://drive.google.com/file/d/${fileId}/view`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(viewLink, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no Drive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Google Drive Embed */}
        <div className="flex-1 overflow-hidden bg-muted/50">
          <iframe
            src={embedLink}
            className="w-full h-full border-0"
            allow="autoplay"
            title={fileName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
