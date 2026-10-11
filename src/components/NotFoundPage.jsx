import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Utensils } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center px-6 py-12">
      <div className="mb-6">
        <span className="text-6xl" role="img" aria-label="Verre vide">🍺</span>
        <h1 className="text-4xl font-bold mt-4 text-foreground">
          404 — Page introuvable
        </h1>
      </div>
      <p className="text-muted-text text-base max-w-md mb-8">
        Oups ! La tournée est introuvable. La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => navigate('/app')}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Utensils className="w-4 h-4" />
          Prendre une commande
        </Button>
        <Button
          onClick={() => navigate('/')}
          className="btn-outline flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Retour à l&apos;accueil
        </Button>
      </div>
    </main>
  );
}
