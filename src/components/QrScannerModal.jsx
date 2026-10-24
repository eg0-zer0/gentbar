import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertCircle, RefreshCw, Upload, Loader2 } from 'lucide-react';
let jsQRInstance = null;
let jsQRPromise = null;

/**
 * Import dynamique à la demande de jsQR (chargé uniquement à l'ouverture du scanner).
 */
const loadJsQR = () => {
  if (jsQRInstance) return Promise.resolve(jsQRInstance);
  if (!jsQRPromise) {
    jsQRPromise = import('jsqr')
      .then((mod) => {
        jsQRInstance = mod.default || mod;
        return jsQRInstance;
      })
      .catch((err) => {
        jsQRPromise = null;
        throw err;
      });
  }
  return jsQRPromise;
};
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

/**
 * Utilitaire de décodage jsQR via Canvas 2D.
 */
const scanCanvasWithJsQr = (canvas, source, width, height, inversionAttempts = 'dontInvert') => {
  if (!jsQRInstance || !canvas || !source || width <= 0 || height <= 0) return null;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const code = jsQRInstance(imageData.data, imageData.width, imageData.height, {
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

  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      return;
    }

    loadJsQR().catch(() => {});
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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Votre navigateur ne prend pas en charge l’accès direct à la caméra (nécessite HTTPS sur mobile). Utilisez le bouton photo ci-dessous.');
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
    } catch {
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
          } catch {
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
    } catch {
      // Ignorer les erreurs d'une trame isolée
    }

    animFrameRef.current = requestAnimationFrame(() => runDetectionLoop(nativeDetector));
  };

  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  // Fonction d'aide pour charger une image en HTMLImageElement
  const loadHtmlImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Traitement d'une photo / image prise par l'utilisateur (compatible 100% navigateurs)
  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setAnalyzingPhoto(true);

    try {
      // 1. Tenter en priorité BarcodeDetector natif (Chrome Android, Google ML Kit, ultra-puissant sur photos d'écran)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const bmp = await createImageBitmap(file);
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(bmp);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            stopCamera();
            onScanSuccess(barcodes[0].rawValue);
            onClose();
            return;
          }
        } catch {
          // Continuer vers le repli jsQR
        }
      }

      // 2. Préparer la source image (createImageBitmap gère nativement l'orientation EXIF)
      let source = null;
      let naturalWidth = 0;
      let naturalHeight = 0;
      try {
        source = await createImageBitmap(file);
        naturalWidth = source.width;
        naturalHeight = source.height;
      } catch {
        source = await loadHtmlImage(file);
        naturalWidth = source.width;
        naturalHeight = source.height;
      }

      if (!source || naturalWidth <= 0 || naturalHeight <= 0) {
        throw new Error('Image invalide');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const jsQR = await loadJsQR();

      // PASSE A : Image globale haute résolution (max 1800px pour préserver la netteté des modules QR denses)
      const maxDim = 1800;
      let w = naturalWidth;
      let h = naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(source, 0, 0, w, h);
      let imgData = ctx.getImageData(0, 0, w, h);

      let found = jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (found && found.data) {
        stopCamera();
        onScanSuccess(found.data);
        onClose();
        return;
      }

      // PASSE B : Recadrage sur la zone centrale (65% x 65%) - indispensable quand le QR code est au milieu de la photo
      const cropW = Math.floor(naturalWidth * 0.65);
      const cropH = Math.floor(naturalHeight * 0.65);
      const startX = Math.floor((naturalWidth - cropW) / 2);
      const startY = Math.floor((naturalHeight - cropH) / 2);

      canvas.width = Math.min(cropW, 1200);
      canvas.height = Math.min(cropH, 1200);
      ctx.drawImage(source, startX, startY, cropW, cropH, 0, 0, canvas.width, canvas.height);
      imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      found = jsQR(imgData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
      if (found && found.data) {
        stopCamera();
        onScanSuccess(found.data);
        onClose();
        return;
      }

      // PASSE C : Binarisation adaptative (filtre fort contraste pour reflets d'écran d'ordinateur)
      const dataArr = imgData.data;
      const binarized = new Uint8ClampedArray(dataArr.length);
      let sumLum = 0;
      for (let i = 0; i < dataArr.length; i += 4) {
        sumLum += 0.299 * dataArr[i] + 0.587 * dataArr[i + 1] + 0.114 * dataArr[i + 2];
      }
      const avgLum = sumLum / (dataArr.length / 4);
      const threshold = Math.max(70, Math.min(185, avgLum));

      for (let i = 0; i < dataArr.length; i += 4) {
        const lum = 0.299 * dataArr[i] + 0.587 * dataArr[i + 1] + 0.114 * dataArr[i + 2];
        const val = lum > threshold ? 255 : 0;
        binarized[i] = val;
        binarized[i + 1] = val;
        binarized[i + 2] = val;
        binarized[i + 3] = 255;
      }

      found = jsQR(binarized, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
      if (found && found.data) {
        stopCamera();
        onScanSuccess(found.data);
        onClose();
        return;
      }

      setCameraError('Aucun QR code détecté sur cette photo. Essayez de vous rapprocher de l’écran ou de prendre la photo bien de face.');
    } catch (err) {
      console.warn('Erreur analyse photo QR:', err);
      setCameraError('Impossible d’analyser cette image.');
    } finally {
      setAnalyzingPhoto(false);
      e.target.value = '';
    }
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
              disabled={analyzingPhoto}
              className="flex-1 h-10 text-xs flex items-center justify-center gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              {analyzingPhoto ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyse de la photo…</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Prendre / choisir une photo</span>
                </>
              )}
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
