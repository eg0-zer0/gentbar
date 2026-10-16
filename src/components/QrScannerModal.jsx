import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertCircle, RefreshCw, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

export const QrScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [hasNativeDetector, setHasNativeDetector] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const isDetectorSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    setHasNativeDetector(isDetectorSupported);
  }, []);

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
      setCameraError('Votre navigateur ne prend pas en charge l’accès direct à la caméra.');
      setScanning(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();

        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          runDetectionLoop(detector);
        }
      }
    } catch (err) {
      console.warn('Erreur accès caméra:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('L’accès à la caméra a été refusé. Veuillez autoriser l’appareil photo dans vos réglages.');
      } else {
        setCameraError('Impossible d’ouvrir la caméra sur cet appareil.');
      }
      setScanning(false);
    }
  };

  const runDetectionLoop = async (detector) => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      if (videoRef.current.readyState >= 2) {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          if (rawValue) {
            stopCamera();
            onScanSuccess(rawValue);
            onClose();
            return;
          }
        }
      }
    } catch (e) {
      // Ignorer les erreurs d'une frame isolée
    }

    animFrameRef.current = requestAnimationFrame(() => runDetectionLoop(detector));
  };

  // Traitement d'une photo / image prise par l'utilisateur
  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const imageBitmap = await createImageBitmap(file);
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(imageBitmap);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          stopCamera();
          onScanSuccess(barcodes[0].rawValue);
          onClose();
          return;
        }
        setCameraError('Aucun QR code détecté sur cette photo. Essayez de vous rapprocher.');
      } catch (err) {
        setCameraError('Impossible d’analyser cette image.');
      }
    } else {
      setCameraError('La détection automatique de QR code sur image nécessite BarcodeDetector.');
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

            {/* Note d'information si BarcodeDetector absent */}
            {!hasNativeDetector && !cameraError && (
              <div className="absolute bottom-2 inset-x-2 p-2 rounded-lg bg-black/80 backdrop-blur text-[11px] text-amber-300 text-center leading-tight">
                Détection temps réel indisponible sur ce navigateur. Utilisez le bouton photo ci-dessous.
              </div>
            )}
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
