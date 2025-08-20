import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const InstallPrompt = () => {
  const { isInstallable, installApp, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = React.useState(false);

React.useEffect(() => {
  // AVANT : Affichage après 30 secondes
  // if (isInstallable && !isInstalled) {
  //   const timer = setTimeout(() => {
  //     setShowPrompt(true);
  //   }, 30000);
  //   return () => clearTimeout(timer);
  // }

  // APRÈS : Affichage immédiat si installable et pas installé
  if (isInstallable && !isInstalled) {
    setShowPrompt(true);
  }
}, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  if (!isInstallable || isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-sm">Installer Drink</h3>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Ajoutez l'application à votre écran d'accueil pour un accès rapide.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstall} size="sm" className="flex-1 text-xs">
                  Installer
                </Button>
                <Button 
                  onClick={() => setShowPrompt(false)}
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                >
                  Plus tard
                </Button>
              </div>
            </div>
            <Button
              onClick={() => setShowPrompt(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;
