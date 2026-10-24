import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  FolderPlus,
  Camera,
  ImageIcon,
  AlertCircle,
  Bot,
  Copy,
  ExternalLink,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { parseDrinkList, guessCategoryIcon, MAX_PASTE_CHARS } from '../lib/parseDrinkList';
import { LIMITS } from '../lib/barShare';
import { analyzeMenuPhotoWithGemini } from '../lib/geminiVision';

export const AI_PROMPT_TEMPLATE = `Voici la photo d'une carte de boissons. Rédige UNIQUEMENT la liste textuelle brute pour l'importer directement dans mon application de bar.
RÈGLES STRICTES :
1. Ne mets AUCUN texte d'introduction, AUCUN commentaire et AUCUNE politesse.
2. N'utilise PAS de tableau, PAS de puces (pas de tiret ni de bullet) et PAS de gras (**).
3. Titres de catégories : écris chaque catégorie ENTIÈREMENT EN MAJUSCULES sur sa propre ligne (ex : BIÈRES, COCKTAILS, VINS, SOFTS, VIENNOISERIES).
4. SÉPARATION DES PRODUITS GROUPÉS : Si une ligne regroupe plusieurs produits distincts de même prix séparés par des virgules, des barres ou 'ou' (ex : 'Café, thé, Chocolat 1€', 'Eau, Eau pétillante 1€', 'Coca, Oasis, Ice Tea 1,5€', 'Snikers, Kitkat, Chips 0,5€', 'Verre de Rouge, rosé, blanc 1€'), DÉCOUPE-LES IMPÉRATIVEMENT EN LIGNES DISTINCTES avec le même prix pour chacune (ex : Café 1€ puis Thé 1€ puis Chocolat 1€ ; Verre de Rouge 1€ puis Verre de Rosé 1€ puis Verre de Blanc 1€).
5. Boissons : une seule boisson par ligne au format : Nom Volume Prix € (ex : Jupiler 25cl 2,50 €).
6. Ignore totalement les recettes, listes d'ingrédients ou descriptions sous les boissons.
7. En cas de double tarif (verre / bouteille ou 25cl / 50cl), sépare-les par un slash sur la même ligne (ex : Whisky 10€ le verre / 50€ la bouteille).`;

let nextTempId = 1;
const getTempId = () => `bulk-item-${Date.now()}-${nextTempId++}`;

export const BulkAddDrinksModal = ({
  isOpen,
  onClose,
  onConfirm,
  allowCategories = false,
  targetCategoryName = '',
  existingNames = [],
  currentDrinksCount = 0,
  currentCategoriesCount = 0
}) => {
  const [rawText, setRawText] = useState('');
  const [splitSlashes, setSplitSlashes] = useState(false);
  const [parsedCategories, setParsedCategories] = useState([]);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const existingNamesKey = Array.isArray(existingNames) ? existingNames.join(';;;') : '';
  const debounceTimerRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [aiScanError, setAiScanError] = useState(null);
  const handleTriggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const handleTriggerGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  const handlePhotoSelected = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    setIsAnalyzingPhoto(true);
    setAiScanError(null);
    const toastId = toast.loading('Analyse IA de la carte en cours avec Gemini…');

    try {
      const extractedText = await analyzeMenuPhotoWithGemini(file);
      setRawText(extractedText);
      toast.success('Carte analysée avec succès par l’IA !', { id: toastId });
    } catch (err) {
      console.error('Erreur scan photo:', err);
      const msg = err.message || 'Échec de l’analyse de la photo.';
      setAiScanError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Réinitialisation à l'ouverture de la modale
  useEffect(() => {
    if (isOpen) {
      setRawText('');
      setSplitSlashes(false);
      setParsedCategories([]);
      setIsDebouncing(false);
    }
  }, [isOpen]);

  // Analyse avec délai (debounce ~220ms) lors de la saisie / du collage
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!rawText.trim()) {
      setParsedCategories([]);
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    debounceTimerRef.current = setTimeout(() => {
      const res = parseDrinkList(rawText, {
        allowCategories,
        existingNames,
        splitSlashes
      });

      // Assigner un identifiant temporaire à chaque catégorie et boisson pour l'édition dans l'aperçu
      const structured = (res.categories || []).map((cat) => ({
        tempId: getTempId(),
        name: cat.name,
        icon: cat.icon || guessCategoryIcon(cat.name),
        drinks: (cat.drinks || []).map((d) => ({
          tempId: getTempId(),
          name: d.name,
          price: d.price,
          status: d.status,
          issues: [...(d.issues || [])],
          raw: d.raw
        }))
      }));

      setParsedCategories(structured);
      setIsDebouncing(false);
    }, 220);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rawText, splitSlashes, allowCategories, existingNamesKey, isOpen]);

  // Statistiques calculées à partir de l'état d'aperçu modifiable
  const stats = useMemo(() => {
    let totalDrinks = 0;
    let okCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (const cat of parsedCategories) {
      for (const d of cat.drinks) {
        totalDrinks += 1;
        if (d.status === 'ok') okCount += 1;
        else if (d.status === 'warning') warningCount += 1;
        else if (d.status === 'error') errorCount += 1;
      }
    }

    return {
      totalDrinks,
      okCount,
      warningCount,
      errorCount,
      categoryCount: parsedCategories.length
    };
  }, [parsedCategories]);

  // Vérification des limites de LIMITS
  const limitError = useMemo(() => {
    if (allowCategories) {
      const projectedCats = currentCategoriesCount + parsedCategories.length;
      if (projectedCats > LIMITS.MAX_CATEGORIES) {
        return `Limite dépassée : le bar contiendrait ${projectedCats} catégories (maximum ${LIMITS.MAX_CATEGORIES}).`;
      }
    }
    const projectedDrinks = currentDrinksCount + stats.totalDrinks;
    if (projectedDrinks > LIMITS.MAX_DRINKS) {
      return `Limite dépassée : le bar contiendrait ${projectedDrinks} boissons (maximum ${LIMITS.MAX_DRINKS}).`;
    }
    return null;
  }, [allowCategories, currentCategoriesCount, parsedCategories.length, currentDrinksCount, stats.totalDrinks]);

  // Actions de modification directe dans l'aperçu
  const handleUpdateDrinkName = (catTempId, drinkTempId, newName) => {
    setParsedCategories((prev) =>
      prev.map((cat) => {
        if (cat.tempId !== catTempId) return cat;
        return {
          ...cat,
          drinks: cat.drinks.map((d) => {
            if (d.tempId !== drinkTempId) return d;
            const trimmed = newName;
            const issues = [];
            let status = 'ok';
            if (!trimmed.trim()) {
              status = 'error';
              issues.push('Nom manquant');
            } else if (trimmed.length > LIMITS.MAX_NAME_LENGTH) {
              status = 'warning';
              issues.push(`Nom supérieur à ${LIMITS.MAX_NAME_LENGTH} car.`);
            }
            if (d.price === null) {
              status = 'error';
              issues.push('Aucun prix');
            } else if (d.price > LIMITS.MAX_PRICE_CENTS / 100) {
              status = 'error';
              issues.push('Prix supérieur à 1000 €');
            }
            return {
              ...d,
              name: trimmed,
              status,
              issues
            };
          })
        };
      })
    );
  };

  const handleUpdateDrinkPrice = (catTempId, drinkTempId, newPriceStr) => {
    setParsedCategories((prev) =>
      prev.map((cat) => {
        if (cat.tempId !== catTempId) return cat;
        return {
          ...cat,
          drinks: cat.drinks.map((d) => {
            if (d.tempId !== drinkTempId) return d;
            const parsedPrice = parseFloat(newPriceStr.replace(',', '.'));
            const issues = [];
            let status = 'ok';
            let priceVal = Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) / 100 : null;

            if (!d.name || !d.name.trim()) {
              status = 'error';
              issues.push('Nom manquant');
            }
            if (priceVal === null) {
              status = 'error';
              issues.push('Aucun prix');
            } else if (priceVal > LIMITS.MAX_PRICE_CENTS / 100) {
              status = 'error';
              issues.push('Prix supérieur à 1000 €');
            } else if (priceVal === 0) {
              status = 'warning';
              issues.push('Prix à 0 €');
            }
            return {
              ...d,
              price: priceVal,
              status,
              issues
            };
          })
        };
      })
    );
  };

  const handleDeleteDrink = (catTempId, drinkTempId) => {
    setParsedCategories((prev) =>
      prev
        .map((cat) => {
          if (cat.tempId !== catTempId) return cat;
          return {
            ...cat,
            drinks: cat.drinks.filter((d) => d.tempId !== drinkTempId)
          };
        })
        .filter((cat) => cat.drinks.length > 0 || allowCategories)
    );
  };

  const handleDeleteAllErrors = () => {
    setParsedCategories((prev) =>
      prev
        .map((cat) => ({
          ...cat,
          drinks: cat.drinks.filter((d) => d.status !== 'error')
        }))
        .filter((cat) => cat.drinks.length > 0 || (allowCategories && cat.name !== 'Divers'))
    );
  };

  const handleOpenAI = (target) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
      }
    } catch {
      // Ignorer si l'accès clipboard échoue
    }

    const labels = {
      claude: 'Claude',
      mistral: 'Mistral',
      chatgpt: 'ChatGPT'
    };

    const urls = {
      claude: `https://claude.ai/new?q=${encodeURIComponent(AI_PROMPT_TEMPLATE)}`,
      mistral: `https://chat.mistral.ai/chat?q=${encodeURIComponent(AI_PROMPT_TEMPLATE)}`,
      chatgpt: `https://chatgpt.com/?q=${encodeURIComponent(AI_PROMPT_TEMPLATE)}`
    };

    toast.success(`Prompt copié ! Joignez la photo dans ${labels[target] || 'l’IA'} puis validez.`, {
      duration: 5000
    });

    const targetUrl = urls[target] || urls.claude;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyPrompt = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
        toast.success('Prompt copié dans le presse-papier !', { duration: 3000 });
      }
    } catch {
      toast.error('Impossible de copier le prompt.');
    }
  };

  const handleUpdateCategoryName = (catTempId, newName) => {
    setParsedCategories((prev) =>
      prev.map((cat) => {
        if (cat.tempId !== catTempId) return cat;
        return {
          ...cat,
          name: newName,
          icon: guessCategoryIcon(newName)
        };
      })
    );
  };

  // Convertir une ligne en erreur en nouveau titre de catégorie (mode allowCategories)
  const handlePromoteToCategory = (catTempId, drinkTempId) => {
    setParsedCategories((prev) => {
      const next = [];
      for (const cat of prev) {
        if (cat.tempId !== catTempId) {
          next.push(cat);
          continue;
        }

        const drinkIndex = cat.drinks.findIndex((d) => d.tempId === drinkTempId);
        if (drinkIndex === -1) {
          next.push(cat);
          continue;
        }

        const targetDrink = cat.drinks[drinkIndex];
        const beforeDrinks = cat.drinks.slice(0, drinkIndex);
        const afterDrinks = cat.drinks.slice(drinkIndex + 1);

        if (beforeDrinks.length > 0 || cat.name !== 'Divers') {
          next.push({
            ...cat,
            drinks: beforeDrinks
          });
        }

        const newCatName = targetDrink.name.replace(/:$/, '').trim() || 'Catégorie';
        next.push({
          tempId: getTempId(),
          name: newCatName,
          icon: guessCategoryIcon(newCatName),
          drinks: afterDrinks
        });
      }
      return next.filter((c) => c.drinks.length > 0 || c.name !== 'Divers');
    });
  };

  const handleValidate = () => {
    if (stats.totalDrinks === 0 || stats.errorCount > 0 || limitError) return;

    if (allowCategories) {
      // Nettoyage et formatage final des catégories créées
      const finalCategories = parsedCategories
        .filter((c) => c.drinks.length > 0)
        .map((c) => ({
          name: c.name.slice(0, LIMITS.MAX_NAME_LENGTH),
          icon: c.icon || guessCategoryIcon(c.name),
          drinks: c.drinks.map((d) => ({
            name: d.name.slice(0, LIMITS.MAX_NAME_LENGTH),
            price: Math.round(d.price * 100) / 100
          }))
        }));
      onConfirm({ categories: finalCategories });
    } else {
      // Mode catégorie unique
      const allDrinks = parsedCategories.flatMap((c) => c.drinks).map((d) => ({
        name: d.name.slice(0, LIMITS.MAX_NAME_LENGTH),
        price: Math.round(d.price * 100) / 100
      }));
      onConfirm(allDrinks);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-[420px] sm:max-w-[440px] max-h-[92vh] flex flex-col p-5 bg-[#101c38] text-slate-200 rounded-[22px] border border-[#23355b]/80 shadow-2xl shadow-black/80 overflow-hidden focus:outline-none [&>button.absolute]:hidden">
        {/* En-tête Stitch avec icône document rose et croix de fermeture */}
        <header className="shrink-0 flex flex-col gap-1.5 pb-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="text-[#e11d48] shrink-0 mt-0.5">
                <FileText className="w-6 h-6 stroke-[1.8]" />
              </div>
              <DialogTitle className="text-[17px] font-bold text-white tracking-tight leading-tight">
                {allowCategories
                  ? 'Créer une carte par texte collé'
                  : `Ajouter plusieurs boissons${targetCategoryName ? ` à « ${targetCategoryName} »` : ''}`}
              </DialogTitle>
            </div>
            {/* Bouton de fermeture croix */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la modale"
              className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
          <DialogDescription className="text-[12.5px] leading-relaxed text-[#94a3b8] font-normal">
            Collez une liste de boissons avec leurs prix. Une analyse automatique vous permet de tout vérifier et modifier avant d’enregistrer.
          </DialogDescription>
        </header>

        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 scrollbar-thin">
          {/* 1. Action principale : Scanner une photo de carte avec l'IA */}
          <section className="bg-[#16254a]/70 rounded-xl p-3.5 border border-[#2b4175]/60 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-start gap-2.5">
              {/* Badge d'icône avec étoile magique rose */}
              <div className="w-8 h-8 rounded-lg bg-[#2e1a34] border border-[#e11d48]/30 flex items-center justify-center text-[#f43f5e] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] font-semibold text-white tracking-tight leading-snug">
                    Scanner une photo de carte
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    Instantané
                  </span>
                </div>
                <p className="text-[11.5px] leading-snug text-[#94a3b8] mt-1 font-normal">
                  Prenez une photo ou choisissez une image : l'IA extrait et range automatiquement toutes les boissons.
                </p>
              </div>
            </div>

            {/* Boutons d'action pour photo et galerie */}
            <div className="flex items-center gap-2 mt-0.5">
              {isAnalyzingPhoto ? (
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-[#e11d48] to-[#f43f5e] opacity-80 text-white rounded-lg text-xs font-semibold shadow-sm cursor-not-allowed"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyse IA en cours…</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleTriggerCamera}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-[#e11d48] to-[#f43f5e] hover:from-[#d0143f] hover:to-[#e11d48] active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer border-0"
                    title="Prendre une photo directement avec l'appareil photo"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Prendre photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerGallery}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#132244] hover:bg-[#1a2f5c] active:scale-[0.98] text-slate-100 border border-[#2b4175] rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    title="Choisir une image dans votre galerie de photos"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-300" />
                    <span>Galerie</span>
                  </button>
                </>
              )}
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelected}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelected}
            />
          </section>

          {/* 2. Repli en cas d'erreur ou d'épuisement de quota Gemini */}
          {aiScanError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 text-amber-300 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span>L'analyse directe a rencontré un souci ({aiScanError}). Vous pouvez utiliser votre IA habituelle :</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiScanError(null)}
                  className="text-[11px] text-slate-400 hover:text-white shrink-0 cursor-pointer underline"
                >
                  Fermer
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenAI('claude')}
                  className="h-7 text-xs px-2.5 gap-1.5 font-medium hover:bg-white/10 border border-[#2b4175] rounded-lg cursor-pointer bg-[#132244] text-slate-200 flex items-center"
                  title="Ouvrir Claude avec le prompt pré-rempli"
                >
                  <span className="text-amber-400 font-bold">●</span>
                  <span>Claude</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAI('mistral')}
                  className="h-7 text-xs px-2.5 gap-1.5 font-medium hover:bg-white/10 border border-[#2b4175] rounded-lg cursor-pointer bg-[#132244] text-slate-200 flex items-center"
                  title="Ouvrir Mistral avec le prompt pré-rempli"
                >
                  <span className="text-orange-400 font-bold">●</span>
                  <span>Mistral</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAI('chatgpt')}
                  className="h-7 text-xs px-2.5 gap-1.5 font-medium hover:bg-white/10 border border-[#2b4175] rounded-lg cursor-pointer bg-[#132244] text-slate-200 flex items-center"
                  title="Ouvrir ChatGPT avec le prompt pré-rempli"
                >
                  <span className="text-emerald-400 font-bold">●</span>
                  <span>ChatGPT</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="h-7 text-xs px-2 gap-1 text-slate-400 hover:text-white cursor-pointer flex items-center"
                  title="Copier le prompt dans le presse-papier"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copier prompt</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Zone de texte collé */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="drinks-raw-text" className="font-semibold text-slate-200 tracking-tight">
                Ou collez votre liste directement ci-dessous
              </label>
              {rawText.length > 0 && (
                <span className={`text-[11px] ${rawText.length > MAX_PASTE_CHARS ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                  {rawText.length.toLocaleString('fr-FR')} / {MAX_PASTE_CHARS.toLocaleString('fr-FR')} car.
                </span>
              )}
            </div>

            <div className="relative w-full">
              <textarea
                id="drinks-raw-text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Exemple :\n${allowCategories ? 'BIÈRES AU FÛT\n' : ''}Jupiler 25cl 2,50\nCarlsberg 40cl 4,50\nDuvel  4,50 €`}
                rows={5}
                spellCheck={false}
                className="w-full bg-[#0a1426] border border-[#23355b] rounded-xl py-3 px-3.5 text-xs text-slate-200 font-mono leading-relaxed placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#e11d48]/50 focus:border-[#e11d48]/60 resize-none transition"
                aria-label="Zone de texte pour coller la liste de boissons"
              />
            </div>

            {rawText.length > MAX_PASTE_CHARS && (
              <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Texte très long : seuls les 50 000 premiers caractères sont analysés.
              </p>
            )}

            {/* Option : Séparer A / B et A, B, C */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <input
                type="checkbox"
                id="split-lists"
                checked={splitSlashes}
                onChange={(e) => setSplitSlashes(e.target.checked)}
                className="w-4 h-4 rounded border-[#2b4175] bg-[#0c1936] text-[#e11d48] accent-[#e11d48] focus:ring-0 focus:ring-offset-0 cursor-pointer flex-shrink-0"
              />
              <label
                htmlFor="split-lists"
                className="text-xs text-slate-300 font-normal leading-snug cursor-pointer select-none"
              >
                Séparer les listes « A / B » ou « A, B, C » de même prix
              </label>
            </div>
          </section>

          {/* Erreur de dépassement de limites */}
          {limitError && (
            <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="font-medium">{limitError}</span>
            </div>
          )}

          {/* Section Aperçu interactif */}
          {parsedCategories.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#23355b]/70">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#e11d48]" />
                  <span>Aperçu avant enregistrement</span>
                  {isDebouncing && <span className="text-slate-400 text-[11px] animate-pulse">(analyse…)</span>}
                </div>

                {/* Compteur récapitulatif & Actions d'erreurs */}
                <div className="text-xs flex items-center gap-2 font-medium flex-wrap">
                  <span className="text-white font-bold">
                    {stats.totalDrinks} boisson{stats.totalDrinks > 1 ? 's' : ''}
                  </span>
                  {stats.warningCount > 0 && (
                    <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      ⚠️ {stats.warningCount} à vérifier
                    </span>
                  )}
                  {stats.errorCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                        ❌ {stats.errorCount} à corriger
                      </span>
                      <button
                        type="button"
                        onClick={handleDeleteAllErrors}
                        className="h-6 px-2 text-[11px] font-semibold text-rose-300 border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 rounded-lg flex items-center gap-1 cursor-pointer"
                        title="Supprimer d'un coup toutes les lignes sans prix ou en erreur"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Supprimer erreurs ({stats.errorCount})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Liste des catégories et boissons */}
              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                {parsedCategories.map((cat) => (
                  <div
                    key={cat.tempId}
                    className="p-3 bg-[#0a1426] rounded-xl border border-[#23355b] space-y-2.5"
                  >
                    {/* En-tête de catégorie en mode allowCategories */}
                    {allowCategories && (
                      <div className="flex items-center gap-2 pb-1.5 border-b border-[#23355b]/60">
                        <span className="text-lg select-none">{cat.icon}</span>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => handleUpdateCategoryName(cat.tempId, e.target.value)}
                          className="h-8 text-xs font-bold text-white bg-[#0e1b35] border border-[#23355b] rounded-lg px-2 flex-1 focus:outline-none focus:border-[#e11d48]"
                          aria-label={`Nom de la catégorie ${cat.name}`}
                        />
                        <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                          {cat.drinks.length} boisson{cat.drinks.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Lignes de boissons */}
                    {cat.drinks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-1">
                        Aucune boisson dans cette catégorie.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {cat.drinks.map((d) => (
                          <div
                            key={d.tempId}
                            className={`p-2 rounded-lg border text-xs flex flex-wrap items-center gap-2 transition ${
                              d.status === 'error'
                                ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                                : d.status === 'warning'
                                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                                  : 'bg-[#101e3d]/60 border-[#23355b]/70 text-slate-200'
                            }`}
                          >
                            {/* Statut icône */}
                            <div className="shrink-0" title={d.issues.join(' · ')}>
                              {d.status === 'ok' && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                              {d.status === 'warning' && (
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                              )}
                              {d.status === 'error' && (
                                <XCircle className="w-4 h-4 text-rose-400" />
                              )}
                            </div>

                            {/* Champ Nom modifiable */}
                            <div className="flex-1 min-w-[140px]">
                              <input
                                type="text"
                                value={d.name}
                                onChange={(e) =>
                                  handleUpdateDrinkName(cat.tempId, d.tempId, e.target.value)
                                }
                                placeholder="Nom de la boisson"
                                className="w-full h-8 text-xs bg-[#08142c] border border-[#23355b] rounded-lg px-2 text-white focus:outline-none focus:border-[#e11d48]"
                                aria-label="Nom de la boisson"
                              />
                            </div>

                            {/* Champ Prix modifiable */}
                            <div className="w-24 shrink-0">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.10"
                                  min="0"
                                  max="1000"
                                  value={d.price === null ? '' : d.price}
                                  onChange={(e) =>
                                    handleUpdateDrinkPrice(cat.tempId, d.tempId, e.target.value)
                                  }
                                  placeholder="Prix"
                                  className="w-full h-8 text-xs pr-6 font-mono text-right bg-[#08142c] border border-[#23355b] rounded-lg px-2 text-white focus:outline-none focus:border-[#e11d48]"
                                  aria-label="Prix en euros"
                                />
                                <span className="absolute right-2 top-2 text-xs text-slate-400 select-none pointer-events-none">
                                  €
                                </span>
                              </div>
                            </div>

                            {/* Bouton Utiliser comme catégorie */}
                            {allowCategories && d.status === 'error' && (
                              <button
                                type="button"
                                onClick={() => handlePromoteToCategory(cat.tempId, d.tempId)}
                                className="h-8 px-2 text-[11px] gap-1 shrink-0 text-rose-300 border border-rose-500/40 hover:bg-rose-500/10 rounded-lg flex items-center cursor-pointer"
                                title="Créer une catégorie avec ce texte"
                              >
                                <FolderPlus className="w-3.5 h-3.5" />
                                <span>En faire une catégorie</span>
                              </button>
                            )}

                            {/* Bouton Supprimer la ligne */}
                            <button
                              type="button"
                              onClick={() => handleDeleteDrink(cat.tempId, d.tempId)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                              title="Supprimer cette ligne"
                              aria-label="Supprimer la ligne"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Affichage des avertissements / erreurs spécifiques */}
                            {d.issues && d.issues.length > 0 && (
                              <div className="w-full text-[11px] text-slate-400 pl-6 flex items-center gap-1.5 flex-wrap">
                                {d.issues.map((issue, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      d.status === 'error'
                                        ? 'bg-rose-500/15 text-rose-300'
                                        : 'bg-amber-500/15 text-amber-300'
                                    }`}
                                  >
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Séparateur horizontal Stitch */}
        <hr className="border-t border-[#23355b]/70 my-0.5" />

        {/* Message d'état informatif */}
        <p className="text-[12px] text-center text-[#8a9bb5] font-normal -mt-0.5">
          {stats.errorCount > 0 ? (
            <span className="text-rose-400 font-medium flex items-center justify-center gap-1.5 flex-wrap">
              <span>{stats.errorCount} ligne{stats.errorCount > 1 ? 's' : ''} en erreur.</span>
              <button
                type="button"
                onClick={handleDeleteAllErrors}
                className="underline font-semibold hover:opacity-80 cursor-pointer"
              >
                Tout retirer en 1 clic
              </button>
            </span>
          ) : stats.totalDrinks > 0 ? (
            <span className="text-emerald-400 font-medium">
              Prêt à ajouter {stats.totalDrinks} boisson{stats.totalDrinks > 1 ? 's' : ''}.
            </span>
          ) : (
            <span>Collez une liste ci-dessus pour commencer.</span>
          )}
        </p>

        {/* Boutons d'action Stitch (Annuler / Créer la carte) */}
        <footer className="grid grid-cols-2 gap-3 pt-0.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#14223f] hover:bg-[#1a2c52] active:scale-[0.98] border border-[#2a3f6a] rounded-xl text-xs font-semibold text-slate-200 transition-all text-center cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={stats.totalDrinks === 0 || stats.errorCount > 0 || !!limitError}
            className={`w-full py-2.5 px-3 rounded-xl text-xs transition-all text-center ${
              stats.totalDrinks === 0 || stats.errorCount > 0 || !!limitError
                ? 'bg-[#7f1d3a]/60 text-[#c2708b] cursor-not-allowed font-medium'
                : 'bg-gradient-to-r from-[#e11d48] to-[#f43f5e] hover:from-[#d0143f] hover:to-[#e11d48] active:scale-[0.98] text-white font-bold shadow-md shadow-rose-950/30 cursor-pointer'
            }`}
          >
            {allowCategories
              ? `Créer la carte (${stats.totalDrinks} boisson${stats.totalDrinks > 1 ? 's' : ''})`
              : `Ajouter ${stats.totalDrinks} boisson${stats.totalDrinks > 1 ? 's' : ''}`}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAddDrinksModal;
