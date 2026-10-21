import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Share2, Copy, Check, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { generateQrMatrix, buildQrSvgPath } from '../lib/qrcode';

export const APP_SHARE_URL = 'https://gentbar.netlify.app';

export const ShareAppModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Génération du QR code en niveau M pour garantir une lecture instantanée avec logo central
  const qrSvg = useMemo(() => {
    try {
      const matrix = generateQrMatrix(APP_SHARE_URL, 'M');
      const svg = buildQrSvgPath(matrix, 3);
      const center = svg.viewBoxSize / 2;
      // Taille de la pastille du logo : ~19% du QR code (~6.6 modules sur 35)
      const badgeSize = svg.viewBoxSize * 0.19;
      const logoSize = badgeSize * 0.85;

      return {
        path: svg.path,
        viewBoxSize: svg.viewBoxSize,
        center,
        badgeSize,
        logoSize
      };
    } catch (e) {
      console.warn('Erreur génération QR code app:', e);
      return { path: '', viewBoxSize: 0, center: 0, badgeSize: 0, logoSize: 0 };
    }
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(APP_SHARE_URL);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = APP_SHARE_URL;
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
    const sharePayload = {
      title: 'GentBar — Commande de boissons',
      text: 'Commande tes boissons facilement avec GentBar :',
      url: APP_SHARE_URL
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        toast.success('Lien partagé !');
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card w-[92vw] max-w-sm mx-auto rounded-xl p-5 sm:p-6 shadow-xl border border-border">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2 text-foreground">
            <QrCode className="w-5 h-5 text-primary" />
            <span>Partager GentBar</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Faites scanner ce QR code pour ouvrir l’application sur un autre smartphone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Conteneur QR code toujours sur fond blanc pur avec coins arrondis pour contraste optimal */}
          <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-border/80 shadow-md mx-auto max-w-[240px] w-full aspect-square relative">
            {qrSvg.path ? (
              <svg
                viewBox={`0 0 ${qrSvg.viewBoxSize} ${qrSvg.viewBoxSize}`}
                className="w-full h-full text-neutral-900 select-none"
                shapeRendering="crispEdges"
                aria-label="QR code vers gentbar.netlify.app avec logo GentBar"
                role="img"
              >
                {/* Fond blanc du QR code */}
                <rect width={qrSvg.viewBoxSize} height={qrSvg.viewBoxSize} fill="white" />

                {/* Modules noirs */}
                <path d={qrSvg.path} fill="currentColor" />

                {/* Pastille blanche de protection au centre */}
                <rect
                  x={qrSvg.center - qrSvg.badgeSize / 2}
                  y={qrSvg.center - qrSvg.badgeSize / 2}
                  width={qrSvg.badgeSize}
                  height={qrSvg.badgeSize}
                  rx={qrSvg.badgeSize * 0.22}
                  fill="white"
                  stroke="white"
                  strokeWidth={0.3}
                />

                {/* Logo GentBar incrusté au centre */}
                <image
                  href="/icons/icon-192x192.png"
                  x={qrSvg.center - qrSvg.logoSize / 2}
                  y={qrSvg.center - qrSvg.logoSize / 2}
                  width={qrSvg.logoSize}
                  height={qrSvg.logoSize}
                  preserveAspectRatio="xMidYMid meet"
                />
              </svg>
            ) : (
              <p className="text-xs text-neutral-500 text-center">QR code indisponible</p>
            )}
          </div>

          {/* Lien en clair cliquable */}
          <div className="text-center">
            <a
              href={APP_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              gentbar.netlify.app
            </a>
          </div>

          {/* Boutons d'actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              onClick={handleNativeShare}
              className="btn-primary w-full h-10 flex items-center justify-center gap-2 font-medium text-xs sm:text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="btn-outline w-full h-10 flex items-center justify-center gap-2 font-medium text-xs sm:text-sm"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAppModal;
