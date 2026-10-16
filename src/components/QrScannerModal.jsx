import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertCircle, RefreshCw, Upload } from 'lucide-react';
import jsQR from 'jsqr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

/**
 * Utilitaire de décodage jsQR via Canvas 2D.
 */
const scanCanvasWithJsQr = (canvas, source, width, height, inversionAttempts = 'dontInvert') => {
  if (!canvas || !source || width <= 0 || height <= 0) return null;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts
  });
  return code ? code.data : null;
};

export const QrScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      setScanning(false);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setScanning(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError('Votre navigateur ne prend pas en charge l’accès direct à la caméra (nécessite HTTPS sur mobile). Utilisez le bouton photo ci-dessous.');
      setScanning(false);
      return;
    }

    let stream = null;
    try {
      // 1. Caméra dorsale idéale (smartphone)
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (firstErr) {
      // 2. Repli souple (webcam PC ou toute caméra)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      } catch (err) {
        console.warn('Erreur accès caméra:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('L’accès à la caméra a été refusé. Veuillez l’autoriser dans les réglages du navigateur.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('Aucune caméra détectée sur cet appareil. Utilisez le bouton photo ci-dessous.');
        } else {
          setCameraError('Impossible d’ouvrir la caméra (nécessite HTTPS hors localhost). Utilisez le bouton photo ci-dessous.');
        }
        setScanning(false);
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();

        const nativeDetector =
          typeof window !== 'undefined' && 'BarcodeDetector' in window
            ? new window.BarcodeDetector({ formats: ['qr_code'] })
            : null;

        runDetectionLoop(nativeDetector);
      }
    }
  };

  const runDetectionLoop = async (nativeDetector) => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      if (videoRef.current.readyState >= 2) {
        let foundData = null;

        // 1. Détection ultra-rapide si BarcodeDetector natif disponible
        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              foundData = barcodes[0].rawValue;
            }
          } catch (e) {
            // Repli sur jsQR en cas d'erreur de trame
          }
        }

        // 2. Repli universel jsQR si pas de BarcodeDetector (Firefox, Safari...)
        if (!foundData) {
          if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
          }
          const vWidth = videoRef.current.videoWidth || 640;
          const vHeight = videoRef.current.videoHeight || 480;
          const scale = Math.min(1, 640 / Math.max(vWidth, vHeight));
          const scanWidth = Math.floor(vWidth * scale);
          const scanHeight = Math.floor(vHeight * scale);

          foundData = scanCanvasWithJsQr(
            canvasRef.current,
            videoRef.current,
            scanWidth,
            scanHeight,
            'dontInvert'
          );
        }

        if (foundData) {
          stopCamera();
          onScanSuccess(foundData);
          onClose();
          return;
        }
      }
    } catch (e) {
      // Ignorer les erreurs d'une trame isolée
    }

    animFrameRef.current = requestAnimationFrame(() => runDetectionLoop(nativeDetector));
  };

  // Traitement d'une photo / image prise par l'utilisateur (compatible 100% navigateurs)
  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const rawData = scanCanvasWithJsQr(canvas, img, w, h, 'attemptBoth');

          if (rawData) {
            stopCamera();
            onScanSuccess(rawData);
            onClose();
          } else {
            setCameraError('Aucun QR code détecté sur cette photo. Rapprochez-vous du code ou ajustez la lumière.');
          }
        } catch (err) {
          setCameraError('Impossible d’analyser cette image.');
        }
      };
      img.onerror = () => {
        setCameraError('Impossible d’ouvrir l’image sélectionnée.');
      };
      img.src = event.target?.result;
    };
    reader.onerror = () => {
      setCameraError('Erreur de lecture du fichier.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground w-[94vw] max-w-md mx-auto rounded-2xl p-4 sm:p-5 border border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Scanner un QR code
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pointez votre appareil vers le QR code de la carte à importer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Zone de visée vidéo */}
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-border">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Viseur visuel superposé */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-primary/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl -mb-1 -mr-1" />
              </div>
            </div>
          </div>

          {cameraError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{cameraError}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={startCamera}
                  className="mt-1.5 h-7 text-xs px-2"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Réessayer
                </Button>
              </div>
            </div>
          )}

          {/* Option photo alternative */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoFile}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 text-xs flex items-center justify-center gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              Prendre / choisir une photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 text-xs text-muted-foreground"
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrScannerModal;
