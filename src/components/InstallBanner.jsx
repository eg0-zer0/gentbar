import React from 'react';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const InstallBanner = () => {
  const { isInstallable, installApp, isInstalled } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || isInstalled || dismissed) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5" />
        <div>
          <p className="font-medium">Installer Drink</p>
          <p className="text-xs opacity-90">Accès rapide depuis votre écran d'accueil</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          onClick={installApp}
          variant="secondary"
          size="sm"
        >
          Installer
        </Button>
        <Button
          onClick={() => setDismissed(true)}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InstallBanner;
