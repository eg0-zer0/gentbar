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
  AlertCircle
} from 'lucide-react';
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
      <DialogContent className="bg-card w-[95vw] max-w-2xl max-h-[92vh] flex flex-col p-4 sm:p-6 rounded-2xl shadow-2xl border border-border overflow-hidden">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <span>
              {allowCategories
                ? 'Créer une carte par texte collé'
                : `Ajouter plusieurs boissons${targetCategoryName ? ` à « ${targetCategoryName} »` : ''}`}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-0.5">
            Collez une liste de boissons avec leurs prix. Une analyse automatique vous permet de tout vérifier et modifier avant d’enregistrer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Encadré Astuce Photo */}
          <div className="p-3 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/80 text-xs text-muted-foreground flex items-start gap-2.5">
            <Camera className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-foreground font-medium">Astuce photo :</strong> Pas envie de tout retaper ? Prenez la carte en photo, utilisez <em>Google Lens</em> (Android) ou <em>Texte en direct</em> (iPhone) pour copier le texte reconnu, puis collez-le ici. Vérifiez bien les prix : la reconnaissance de texte se trompe parfois.
            </div>
          </div>

          {/* Zone de texte collé */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="bulk-text-input" className="font-semibold text-foreground">
                Coller votre liste ici
              </Label>
              {rawText.length > 0 && (
                <span className={`text-[11px] ${rawText.length > MAX_PASTE_CHARS ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  {rawText.length.toLocaleString('fr-FR')} / {MAX_PASTE_CHARS.toLocaleString('fr-FR')} car.
                </span>
              )}
            </div>

            <textarea
              id="bulk-text-input"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Exemple :\n${allowCategories ? 'BIÈRES AU FÛT\n' : ''}Jupiler 25cl 2,50\nCarlsberg 40cl 4,50\nDuvel — 4,50 €\n...`}
              rows={5}
              className="w-full rounded-xl border border-input bg-background p-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-y font-mono"
              aria-label="Zone de texte pour coller la liste de boissons"
            />

            {rawText.length > MAX_PASTE_CHARS && (
              <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Texte très long : seuls les 50 000 premiers caractères sont analysés.
              </p>
            )}
          </div>

          {/* Option : Séparer A / B */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="split-slashes-checkbox"
              checked={splitSlashes}
              onChange={(e) => setSplitSlashes(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <Label
              htmlFor="split-slashes-checkbox"
              className="text-xs text-foreground font-medium cursor-pointer select-none"
            >
              Séparer les « A / B » en deux boissons (ex: Coca / Zéro 2,50 → 2 boissons)
            </Label>
          </div>

          {/* Erreur de dépassement de limites */}
          {limitError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{limitError}</span>
            </div>
          )}

          {/* Section Aperçu interactif */}
          {parsedCategories.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/70">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Aperçu avant enregistrement</span>
                  {isDebouncing && <span className="text-muted-foreground text-[11px] animate-pulse">(analyse…)</span>}
                </div>

                {/* Compteur récapitulatif */}
                <div className="text-xs flex items-center gap-2 font-medium">
                  <span className="text-foreground font-bold">
                    {stats.totalDrinks} boisson{stats.totalDrinks > 1 ? 's' : ''}
                  </span>
                  {stats.warningCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      ⚠️ {stats.warningCount} à vérifier
                    </span>
                  )}
                  {stats.errorCount > 0 && (
                    <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-bold">
                      ❌ {stats.errorCount} à corriger
                    </span>
                  )}
                </div>
              </div>

              {/* Liste des catégories et boissons */}
              <div className="space-y-4 max-h-[36vh] overflow-y-auto pr-1">
                {parsedCategories.map((cat) => (
                  <div
                    key={cat.tempId}
                    className="p-3 bg-background/70 rounded-xl border border-border/80 space-y-2.5"
                  >
                    {/* En-tête de catégorie en mode allowCategories */}
                    {allowCategories && (
                      <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
                        <span className="text-lg select-none">{cat.icon}</span>
                        <Input
                          type="text"
                          value={cat.name}
                          onChange={(e) => handleUpdateCategoryName(cat.tempId, e.target.value)}
                          className="h-8 text-xs font-bold text-foreground bg-card"
                          aria-label={`Nom de la catégorie ${cat.name}`}
                        />
                        <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                          {cat.drinks.length} boisson{cat.drinks.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Lignes de boissons */}
                    {cat.drinks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-1">
                        Aucune boisson dans cette catégorie.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {cat.drinks.map((d) => (
                          <div
                            key={d.tempId}
                            className={`p-2 rounded-lg border text-xs flex flex-wrap items-center gap-2 transition ${
                              d.status === 'error'
                                ? 'bg-destructive/5 border-destructive/40'
                                : d.status === 'warning'
                                  ? 'bg-amber-500/5 border-amber-500/30'
                                  : 'bg-card border-border/60'
                            }`}
                          >
                            {/* Statut icône */}
                            <div className="shrink-0" title={d.issues.join(' · ')}>
                              {d.status === 'ok' && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              )}
                              {d.status === 'warning' && (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                              {d.status === 'error' && (
                                <XCircle className="w-4 h-4 text-destructive" />
                              )}
                            </div>

                            {/* Champ Nom modifiable */}
                            <div className="flex-1 min-w-[140px]">
                              <Input
                                type="text"
                                value={d.name}
                                onChange={(e) =>
                                  handleUpdateDrinkName(cat.tempId, d.tempId, e.target.value)
                                }
                                placeholder="Nom de la boisson"
                                className="h-8 text-xs bg-background"
                                aria-label="Nom de la boisson"
                              />
                            </div>

                            {/* Champ Prix modifiable */}
                            <div className="w-24 shrink-0">
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.10"
                                  min="0"
                                  max="1000"
                                  value={d.price === null ? '' : d.price}
                                  onChange={(e) =>
                                    handleUpdateDrinkPrice(cat.tempId, d.tempId, e.target.value)
                                  }
                                  placeholder="Prix"
                                  className="h-8 text-xs pr-6 font-mono text-right bg-background"
                                  aria-label="Prix en euros"
                                />
                                <span className="absolute right-2 top-2 text-xs text-muted-foreground select-none pointer-events-none">
                                  €
                                </span>
                              </div>
                            </div>

                            {/* Bouton Utiliser comme catégorie (si en erreur en mode catégories) */}
                            {allowCategories && d.status === 'error' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromoteToCategory(cat.tempId, d.tempId)}
                                className="h-8 px-2 text-[11px] gap-1 shrink-0 text-primary border-primary/40 hover:bg-primary/10"
                                title="Créer une catégorie avec ce texte"
                              >
                                <FolderPlus className="w-3.5 h-3.5" />
                                <span>En faire une catégorie</span>
                              </Button>
                            )}

                            {/* Bouton Supprimer la ligne */}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDrink(cat.tempId, d.tempId)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                              title="Supprimer cette ligne"
                              aria-label="Supprimer la ligne"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            {/* Affichage des avertissements / erreurs spécifiques */}
                            {d.issues && d.issues.length > 0 && (
                              <div className="w-full text-[11px] text-muted-foreground pl-6 flex items-center gap-1.5 flex-wrap">
                                {d.issues.map((issue, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      d.status === 'error'
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
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

        {/* Pied de dialogue et validation */}
        <div className="pt-3 border-t border-border shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-xs text-muted-foreground">
            {stats.errorCount > 0 ? (
              <span className="text-destructive font-medium">
                Veuillez corriger ou supprimer les {stats.errorCount} ligne{stats.errorCount > 1 ? 's' : ''} en erreur pour pouvoir ajouter.
              </span>
            ) : stats.totalDrinks > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                Prêt à ajouter {stats.totalDrinks} boisson{stats.totalDrinks > 1 ? 's' : ''}.
              </span>
            ) : (
              <span>Collez une liste ci-dessus pour commencer.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none h-10 text-xs font-medium"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleValidate}
              disabled={stats.totalDrinks === 0 || stats.errorCount > 0 || !!limitError}
              className="btn-primary flex-1 sm:flex-none h-10 text-xs font-semibold px-4"
            >
              {allowCategories
                ? `Créer la carte (${stats.totalDrinks} boisson${stats.totalDrinks > 1 ? 's' : ''})`
                : `Ajouter ${stats.totalDrinks} boisson${stats.totalDrinks > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAddDrinksModal;
