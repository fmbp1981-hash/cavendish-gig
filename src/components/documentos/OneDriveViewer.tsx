import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface OneDriveViewerProps {
  fileId: string | null;
  fileName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OneDriveViewer({
  fileId,
  fileName = 'Documento',
  open,
  onOpenChange
}: OneDriveViewerProps) {
  const [embedLink, setEmbedLink] = useState<string | null>(null);
  const [viewLink, setViewLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !fileId) return;

    setLoading(true);
    supabase.functions
      .invoke('onedrive', { body: { action: 'getEmbedLink', fileId } })
      .then(({ data, error }) => {
        if (!error && data?.success) {
          setEmbedLink(data.data?.embedLink ?? null);
          setViewLink(data.data?.viewLink ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [open, fileId]);

  if (!fileId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              {viewLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(viewLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir no OneDrive
                </Button>
              )}
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

        <div className="flex-1 overflow-hidden bg-muted/50">
          {loading && <Skeleton className="w-full h-full" />}
          {!loading && embedLink && (
            <iframe
              src={embedLink}
              className="w-full h-full border-0"
              allow="autoplay"
              title={fileName}
            />
          )}
          {!loading && !embedLink && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Pré-visualização não disponível
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
