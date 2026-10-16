import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  QrCode,
  FileUp,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitMerge,
  Plus,
  Loader2,
  Camera,
  ShieldCheck
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  decodeBarFromShareInput,
  parseBarFromFileContent,
  findLinkedBarBySourceId,
  findSimilarBar
} from '../lib/barShare';
import { countBarDrinks } from '../lib/menus';
import { mergeMenus, summarizeReport } from '../lib/menuMerge';
import { formatPrice } from '../lib/format';
import { useMenus } from '../hooks/useMenus';
import QrScannerModal from './QrScannerModal';

const MergeReportDetails = ({ report, targetBarName }) => {
  if (!report) return null;
  const missingCount = Array.isArray(report.missing) ? report.missing.length : 0;
  const addedCount = Array.isArray(report.added) ? report.added.length : 0;
  const updatedCount = Array.isArray(report.updated) ? report.updated.length : 0;
  const keptCount = Array.isArray(report.kept) ? report.kept.length : 0;

  return (
    <div className="space-y-2 p-3.5 bg-background/80 rounded-xl border border-border/80 text-xs">
      <div className="font-semibold text-foreground flex items-center justify-between">
        <span>Effet de la fusion :</span>
        <span className="text-primary font-medium">{summarizeReport(report)}</span>
      </div>
      <ul className="space-y-1.5 pt-1.5 border-t border-border/50">
        {missingCount > 0 && (
          <li className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <span>
              <strong>{missingCount}</strong> boisson{missingCount > 1 ? 's' : ''} propre{missingCount > 1 ? 's' : ''} à « {targetBarName || 'ce bar'} » conservée{missingCount > 1 ? 's' : ''} : <em>aucun produit local ne sera supprimé</em>.
            </span>
          </li>
        )}
        {keptCount > 0 && (
          <li className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
            <span className="font-bold shrink-0 text-amber-500">★</span>
            <span>
              <strong>{keptCount}</strong> boisson{keptCount > 1 ? 's' : ''} personnalisée{keptCount > 1 ? 's' : ''} conservée{keptCount > 1 ? 's' : ''} sans être écrasée{keptCount > 1 ? 's' : ''}.
            </span>
          </li>
        )}
        {addedCount > 0 && (
          <li className="flex items-start gap-1.5 text-foreground">
            <span className="text-emerald-500 font-bold shrink-0">＋</span>
            <span><strong>{addedCount}</strong> nouvelle{addedCount > 1 ? 's' : ''} boisson{addedCount > 1 ? 's' : ''} ajoutée{addedCount > 1 ? 's' : ''}.</span>
          </li>
        )}
        {updatedCount > 0 && (
          <li className="flex items-start gap-1.5 text-foreground">
            <span className="text-blue-500 font-bold shrink-0">↻</span>
            <span><strong>{updatedCount}</strong> prix mis à jour selon la carte reçue.</span>
          </li>
        )}
      </ul>
    </div>
  );
};

export const ReceiveBarPage = ({
  menus: propMenus,
  onImportNewBar: propImportNewBar,
  onMergeBar: propMergeBar
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hookMenus = useMenus();

  const menus = propMenus || hookMenus.menus;
  const onImportNewBar = propImportNewBar || hookMenus.importNewBar;
  const onMergeBar = propMergeBar || hookMenus.mergeIncomingBar;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pastedLink, setPastedLink] = useState('');
  const [incomingBar, setIncomingBar] = useState(null);
  const [selectedTargetBarId, setSelectedTargetBarId] = useState('');
  const [showMergeSelector, setShowMergeSelector] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Analyse automatique du hash à l'arrivée sur /recevoir#c=...
  useEffect(() => {
    const rawHash = window.location.hash || location.hash || '';
    if (rawHash && rawHash.includes('c=')) {
      setLoading(true);
      setError(null);
      decodeBarFromShareInput(rawHash)
        .then((res) => {
          if (res.valid) {
            setIncomingBar(res.bar);
          } else {
            setError(res.error || 'Carte invalide.');
          }
        })
        .catch(() => {
          setError('Impossible de lire cette carte.');
        })
        .finally(() => setLoading(false));
    }
  }, [location]);

  // Détection de lien automatique (sourceId connu) ou ressemblance (noms en commun)
  const linkedBar = useMemo(() => {
    if (!incomingBar) return null;
    return findLinkedBarBySourceId(menus, incomingBar.sourceId);
  }, [menus, incomingBar]);

  const similarResult = useMemo(() => {
    if (!incomingBar || linkedBar) return null;
    return findSimilarBar(menus, incomingBar);
  }, [menus, incomingBar, linkedBar]);

  // Initialisation du bar cible par défaut pour la fusion
  useEffect(() => {
    if (linkedBar) {
      setSelectedTargetBarId(linkedBar.id);
    } else if (similarResult?.bar) {
      setSelectedTargetBarId(similarResult.bar.id);
    } else if (menus.length > 0) {
      setSelectedTargetBarId(menus[0].id);
    }
  }, [linkedBar, similarResult, menus]);

  // Aperçu du rapport de fusion dynamique
  const mergePreview = useMemo(() => {
    if (!incomingBar || !selectedTargetBarId) return null;
    const target = menus.find((b) => b && b.id === selectedTargetBarId);
    if (!target) return null;
    return mergeMenus(target, incomingBar, { matchBy: 'name' });
  }, [menus, incomingBar, selectedTargetBarId]);

  const handleAnalyzePasted = async (e) => {
    if (e) e.preventDefault();
    if (!pastedLink.trim()) {
      toast.error('Veuillez coller un lien ou un code de partage.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await decodeBarFromShareInput(pastedLink.trim());
      if (res.valid) {
        setIncomingBar(res.bar);
      } else {
        setError(res.error || 'Format de lien non reconnu.');
      }
    } catch {
      setError('Impossible de décoder ce lien.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (scannedRawValue) => {
    setIsScannerOpen(false);
    if (!scannedRawValue || !scannedRawValue.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await decodeBarFromShareInput(scannedRawValue.trim());
      if (res.valid) {
        setIncomingBar(res.bar);
        toast.success('QR code scanné avec succès !');
      } else {
        setError(res.error || 'Contenu de QR code non reconnu.');
      }
    } catch {
      setError('Impossible de lire ce QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const res = parseBarFromFileContent(text);
        if (res.valid) {
          setIncomingBar(res.bar);
        } else {
          setError(res.error || 'Fichier de carte non valide.');
        }
      } catch {
        setError('Erreur de lecture du fichier.');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Impossible de lire ce fichier.');
      setLoading(false);
    };
    reader.readAsText(file);
    // Reset de l'input pour permettre de ré-importer le même fichier
    e.target.value = '';
  };

  const handleConfirmAddAsNew = () => {
    if (!incomingBar || !onImportNewBar) return;
    const newBar = onImportNewBar(incomingBar, { activate: true });
    if (newBar) {
      navigate('/bars');
    }
  };

  const handleConfirmMerge = (targetId) => {
    const finalTargetId = targetId || selectedTargetBarId;
    if (!incomingBar || !finalTargetId || !onMergeBar) return;
    const result = onMergeBar(finalTargetId, incomingBar, { activate: true });
    if (result) {
      navigate('/bars');
    }
  };

  const totalIncomingDrinks = incomingBar ? countBarDrinks(incomingBar) : 0;
  const categoriesSummary = incomingBar?.categories
    ? incomingBar.categories.map((c) => `${c.name} (${c.drinks?.length || 0})`).join(' · ')
    : '';

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* En-tête */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/bars')}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Mes bars</span>
          </button>
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Recevoir une carte</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-card rounded-xl border border-border p-6 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Analyse de la carte en cours…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Erreur de réception</div>
              <p className="text-xs text-destructive/90">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="mt-2 h-7 px-2 text-xs"
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Aperçu de la carte décodée */}
        {incomingBar && !loading ? (
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                {incomingBar.icon}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1">
                  Carte reçue
                </span>
                <h1 className="text-xl font-bold truncate text-foreground">{incomingBar.name}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalIncomingDrinks} boisson{totalIncomingDrinks > 1 ? 's' : ''} réparties en{' '}
                  {incomingBar.categories?.length || 0} catégorie{incomingBar.categories?.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Résumé des catégories */}
            {categoriesSummary && (
              <div className="p-3 bg-background/60 rounded-xl border border-border/60 text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Aperçu : </span>
                {categoriesSummary}
              </div>
            )}

            {/* CAS 1 : Carte liée connue par son sourceId */}
            {linkedBar ? (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-foreground">Carte déjà connue dans vos bars</div>
                    <p className="text-muted-foreground mt-0.5">
                      Cette carte provient de « {linkedBar.name} » ({linkedBar.icon}). Vous pouvez la mettre à jour directement.
                    </p>
                  </div>
                </div>

                {mergePreview?.report && (
                  <MergeReportDetails report={mergePreview.report} targetBarName={linkedBar.name} />
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={() => handleConfirmMerge(linkedBar.id)}
                    className="btn-primary w-full sm:flex-1 h-10 font-semibold flex items-center justify-center gap-2"
                  >
                    <GitMerge className="w-4 h-4" />
                    Mettre à jour « {linkedBar.name} »
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConfirmAddAsNew}
                    className="w-full sm:w-auto h-10 text-xs"
                  >
                    Ajouter comme nouveau bar
                  </Button>
                </div>
              </div>
            ) : (
              /* CAS 2 : Carte nouvelle / choix explicite */
              <div className="space-y-4 pt-2">
                {/* Alerte ressemblance (§ 4.4) */}
                {similarResult && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      Ce bar ressemble à « <strong className="font-semibold">{similarResult.bar.name}</strong> » ({similarResult.commonCount} boisson{similarResult.commonCount > 1 ? 's' : ''} en commun).
                    </span>
                  </div>
                )}

                <div className="space-y-2.5">
                  <Button
                    type="button"
                    onClick={handleConfirmAddAsNew}
                    className="btn-primary w-full h-11 font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter comme nouveau bar
                  </Button>

                  {!showMergeSelector ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMergeSelector(true)}
                      className="w-full h-10 flex items-center justify-center gap-2 text-sm"
                    >
                      <GitMerge className="w-4 h-4" />
                      Fusionner avec un bar existant…
                    </Button>
                  ) : (
                    <div className="p-4 rounded-xl border border-border bg-background/60 space-y-3">
                      <Label className="block text-xs font-semibold">Choisir le bar à fusionner :</Label>
                      <select
                        value={selectedTargetBarId}
                        onChange={(e) => setSelectedTargetBarId(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {menus.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.icon} {b.name} ({countBarDrinks(b)} boiss.)
                          </option>
                        ))}
                      </select>

                      {mergePreview?.report && (
                        <MergeReportDetails
                          report={mergePreview.report}
                          targetBarName={menus.find((b) => b && b.id === selectedTargetBarId)?.name}
                        />
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowMergeSelector(false)}
                          className="flex-1 h-9 text-xs"
                        >
                          Masquer
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleConfirmMerge(selectedTargetBarId)}
                          className="btn-primary flex-1 h-9 text-xs font-semibold"
                        >
                          Confirmer la fusion
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIncomingBar(null);
                  navigate('/bars');
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          /* Formulaires d'import manuel (lien ou fichier) */
          !loading && (
            <div className="space-y-6">
              {/* Option 0 : Scanner directement avec l'appareil photo */}
              <div className="bg-card rounded-2xl border border-primary/30 p-5 shadow-sm space-y-3 bg-gradient-to-br from-primary/5 via-card to-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-foreground">Scanner directement</h2>
                    <p className="text-xs text-muted-foreground">
                      Pointez l'appareil photo vers le QR code d'un ami
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="btn-primary w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scanner un QR code</span>
                </Button>
              </div>

              {/* Option 1 : Coller un lien */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-foreground">Coller un lien de partage</h2>
                    <p className="text-xs text-muted-foreground">
                      Lien reçu par message, e-mail ou WhatsApp
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAnalyzePasted} className="space-y-3">
                  <Input
                    type="text"
                    value={pastedLink}
                    onChange={(e) => setPastedLink(e.target.value)}
                    placeholder="Collez votre lien ici (ex: https://...)"
                    className="w-full bg-background text-sm"
                  />
                  <Button type="submit" className="btn-primary w-full h-10 text-sm font-medium">
                    Analyser le lien
                  </Button>
                </form>
              </div>

              {/* Option 2 : Ouvrir un fichier */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-foreground">Ouvrir un fichier de carte</h2>
                    <p className="text-xs text-muted-foreground">
                      Fichier exporté (.gentbar.json ou .json)
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,.gentbar.json,application/json"
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-10 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  Choisir un fichier…
                </Button>
              </div>

              {/* Aide iOS */}
              <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
                💡 Sur iPhone, si vous avez scanné un QR code dans Safari, vous pouvez copier l'adresse et la coller ici dans votre application installée.
              </p>
            </div>
          )
        )}
      </main>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default ReceiveBarPage;
