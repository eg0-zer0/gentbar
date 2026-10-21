import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Share2, Copy, Check, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { generateQrMatrix } from '../lib/qrcode';

export const APP_SHARE_URL = 'https://gentbar.netlify.app';

// Couleurs personnalisées du thème GentBar pour le QR code stylé
const QR_DARK_COLOR = '#1e0f2b'; // Prune très sombre pour les modules et cadres
const QR_PUPIL_COLOR = '#881337'; // Bordeaux / framboise GentBar pour les pupilles
const QR_LOGO_BG = '#0f1a2f'; // Bleu nuit du blason officiel GentBar

export const ShareAppModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Construction mémoïsée du QR code stylisé conforme à l'identité visuelle GentBar
  const qrData = useMemo(() => {
    try {
      const matrix = generateQrMatrix(APP_SHARE_URL, 'M');
      const size = matrix.length; // 29 modules
      const margin = 3;
      const viewBoxSize = size + margin * 2; // 35
      const center = viewBoxSize / 2; // 17.5
      const logoSize = 5.2; // Taille optimale du grand logo au centre
      const halfLogo = logoSize / 2;

      // Définition des 3 finder patterns (haut-gauche, haut-droite, bas-gauche)
      const finders = [
        { x: margin, y: margin, cx: margin + 3.5, cy: margin + 3.5 },
        { x: margin + size - 7, y: margin, cx: margin + size - 3.5, cy: margin + 3.5 },
        { x: margin, y: margin + size - 7, cx: margin + 3.5, cy: margin + size - 3.5 }
      ];

      // Vérifie si un module de la matrice se trouve sous l'un des 3 finders
      const isFinderModule = (mx, my) => {
        return (
          (mx < 7 && my < 7) ||
          (mx >= size - 7 && my < 7) ||
          (mx < 7 && my >= size - 7)
        );
      };

      // Vérifie si un module se trouve sous la zone du logo au centre
      const isUnderLogo = (mx, my) => {
        const vx = mx + margin + 0.5;
        const vy = my + margin + 0.5;
        return Math.abs(vx - center) <= halfLogo && Math.abs(vy - center) <= halfLogo;
      };

      // Construction du chemin SVG compact pour tous les modules de données
      const segments = [];
      for (let my = 0; my < size; my += 1) {
        for (let mx = 0; mx < size; mx += 1) {
          if (matrix[my][mx] && !isFinderModule(mx, my) && !isUnderLogo(mx, my)) {
            segments.push(`M${mx + margin},${my + margin}h1v1h-1z`);
          }
        }
      }

      return {
        dataPath: segments.join(''),
        viewBoxSize,
        center,
        logoSize,
        finders
      };
    } catch (e) {
      console.warn('Erreur génération QR code stylisé:', e);
      return null;
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
          {/* Conteneur QR code toujours sur fond blanc pur avec coins arrondis */}
          <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-border/80 shadow-md mx-auto max-w-[250px] w-full aspect-square relative">
            {qrData ? (
              <svg
                viewBox={`0 0 ${qrData.viewBoxSize} ${qrData.viewBoxSize}`}
                className="w-full h-full select-none"
                shapeRendering="crispEdges"
                aria-label="QR code vers gentbar.netlify.app avec style GentBar"
                role="img"
              >
                {/* 1. Fond blanc pur */}
                <rect width={qrData.viewBoxSize} height={qrData.viewBoxSize} fill="white" />

                {/* 2. Modules de données en prune sombre GentBar */}
                <path d={qrData.dataPath} fill={QR_DARK_COLOR} />

                {/* 3. Les 3 Finder Patterns stylisés (cadre arrondi prune + pupille ronde bordeaux) */}
                {qrData.finders.map((f, idx) => (
                  <g key={`finder-${idx}`}>
                    {/* Cadre extérieur 7x7 à coins arrondis */}
                    <rect
                      x={f.x}
                      y={f.y}
                      width={7}
                      height={7}
                      rx={1.8}
                      fill={QR_DARK_COLOR}
                    />
                    {/* Séparation blanche 5x5 à coins arrondis */}
                    <rect
                      x={f.x + 1}
                      y={f.y + 1}
                      width={5}
                      height={5}
                      rx={1.2}
                      fill="white"
                    />
                    {/* Pupille centrale circulaire bordeaux GentBar */}
                    <circle
                      cx={f.cx}
                      cy={f.cy}
                      r={1.55}
                      fill={QR_PUPIL_COLOR}
                    />
                  </g>
                ))}

                {/* 4. Grand logo GentBar au centre avec fond blason et bordure fine */}
                <g>
                  {/* Cadre de protection du logo au centre */}
                  <rect
                    x={qrData.center - qrData.logoSize / 2}
                    y={qrData.center - qrData.logoSize / 2}
                    width={qrData.logoSize}
                    height={qrData.logoSize}
                    rx={0.5}
                    fill={QR_LOGO_BG}
                    stroke="white"
                    strokeWidth={0.2}
                  />

                  {/* Blason officiel GentBar (verre de bière, couronne et texte) */}
                  <image
                    href="/icons/gentbar-logo.svg"
                    x={qrData.center - qrData.logoSize / 2 + 0.2}
                    y={qrData.center - qrData.logoSize / 2 + 0.2}
                    width={qrData.logoSize - 0.4}
                    height={qrData.logoSize - 0.4}
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
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
