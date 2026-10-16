import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Share2, Copy, Download, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { encodeBarToShareLink, serializeBarToFileContent, QR_WARN_LENGTH } from '../lib/barShare';
import { generateQrMatrix, buildQrSvgPath } from '../lib/qrcode';
import { countBarDrinks } from '../lib/menus';

export const ShareBarModal = ({ bar, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState({ path: '', viewBoxSize: 0 });

  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !bar) {
      setShareData(null);
      setQrSvg({ path: '', viewBoxSize: 0 });
      return;
    }

    setLoading(true);
    setCopied(false);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gentbar.netlify.app';

    encodeBarToShareLink(bar, origin)
      .then((data) => {
        if (cancelled) return;
        setShareData(data);
        try {
          const matrix = generateQrMatrix(data.url);
          const svg = buildQrSvgPath(matrix, 3);
          setQrSvg(svg);
        } catch (e) {
          console.warn('QR code generation error:', e);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Erreur encodage carte:', err);
        toast.error('Impossible d’encoder cette carte pour le partage.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, bar]);

  const handleCopy = async () => {
    if (!shareData?.url) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareData.url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Lien copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier le lien.');
    }
  };

  const handleNativeShare = async () => {
    if (!shareData?.url || !bar) return;
    const sharePayload = {
      title: `Carte ${bar.name} — GentBar`,
      text: `Voici la carte « ${bar.name} » sur GentBar :`,
      url: shareData.url
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        toast.success('Carte partagée !');
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleExportFile = () => {
    if (!bar) return;
    try {
      const jsonContent = serializeBarToFileContent(bar);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (bar.name || 'carte')
        .toLowerCase()
        .replace(/[^a-z0-9à-ÿ]+/g, '-')
        .replace(/^-+|-+$/g, '');
      a.href = url;
      a.download = `${safeName || 'bar'}.gentbar.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Fichier de carte téléchargé');
    } catch {
      toast.error('Erreur lors de l’export du fichier.');
    }
  };

  const drinksCount = countBarDrinks(bar);
  const isLarge = shareData?.isLargeForQr || (shareData?.length || 0) > QR_WARN_LENGTH;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card w-[92vw] max-w-md mx-auto rounded-xl p-5 sm:p-6 shadow-xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span>Partager {bar?.icon || '🍺'}</span>
            <span className="truncate">{bar?.name || 'la carte'}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {drinksCount} boisson{drinksCount > 1 ? 's' : ''} · Scannez le QR code ou envoyez le lien.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Préparation de la carte…</p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Conteneur QR code toujours sur fond blanc net pour scan parfait */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border shadow-inner mx-auto max-w-[260px] w-full aspect-square">
              {qrSvg.path ? (
                <svg
                  viewBox={`0 0 ${qrSvg.viewBoxSize} ${qrSvg.viewBoxSize}`}
                  className="w-full h-full text-neutral-900"
                  shapeRendering="crispEdges"
                  aria-label={`QR code pour la carte ${bar?.name}`}
                  role="img"
                >
                  <path d={qrSvg.path} fill="currentColor" />
                </svg>
              ) : (
                <p className="text-xs text-neutral-500 text-center">QR code indisponible</p>
              )}
            </div>

            {/* Avertissement carte volumineuse (§ 4.4 : au-delà de 1 000 car.) */}
            {isLarge && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-semibold">Carte volumineuse</span> ({shareData?.length} car.) : préférez le lien ou le fichier pour un partage plus rapide.
                </div>
              </div>
            )}

            {/* Actions principales */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                onClick={handleNativeShare}
                className="btn-primary w-full h-11 flex items-center justify-center gap-2 font-medium"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="w-full h-11 flex items-center justify-center gap-2 font-medium"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier le lien'}
              </Button>
            </div>

            {/* Export fichier */}
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleExportFile}
                className="w-full h-9 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter en fichier (.gentbar.json)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareBarModal;
