import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Plus, Settings2, Copy, FileEdit, ClipboardList, QrCode, ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BAR_ICONS, countBarDrinks, isBaseBar } from '../lib/menus';

/**
 * Sélecteur d'icône de bar (grille d'emojis rapides + champ libre).
 */
export const BarIconPicker = ({ value, onChange, id = 'bar-icon-input' }) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {BAR_ICONS.map((emoji) => {
          const isSelected = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={`w-9 h-9 rounded-md flex items-center justify-center text-lg border transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/15 ring-1 ring-primary'
                  : 'border-border bg-background hover:bg-muted/60'
              }`}
              aria-label={`Choisir l'icône ${emoji}`}
              aria-pressed={isSelected}
            >
              {emoji}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground shrink-0">
          Autre emoji :
        </Label>
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={4}
          placeholder="🍺"
          className="w-20 h-8 text-center bg-background text-foreground"
        />
      </div>
    </div>
  );
};

/**
 * Fenêtre d'ajout d'un bar (§ 4.3 : Carte vide, Copier une carte, + aperçu Coller/Recevoir).
 */
export const AddBarModal = ({
  isOpen,
  onClose,
  menus = [],
  activeMenuId,
  onCreateEmpty,
  onDuplicateBar,
  initialMode = 'menu',
  initialSourceBarId = null
}) => {
  const [step, setStep] = useState(initialMode); // 'menu' | 'empty' | 'copy'
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍺');
  const [sourceBarId, setSourceBarId] = useState(initialSourceBarId || activeMenuId || menus[0]?.id || '');

  useEffect(() => {
    if (isOpen) {
      setStep(initialMode || 'menu');
      const defaultSourceId = initialSourceBarId || activeMenuId || menus[0]?.id || '';
      setSourceBarId(defaultSourceId);
      if (initialMode === 'copy') {
        const src = menus.find((b) => b.id === defaultSourceId);
        setName(src ? `${src.name} (copie)` : '');
        setIcon(src?.icon || '🍺');
      } else {
        setName('');
        setIcon('🍺');
      }
    }
  }, [isOpen, initialMode, initialSourceBarId, activeMenuId, menus]);

  const handleSelectCopyStep = () => {
    const defaultSourceId = activeMenuId || menus[0]?.id || '';
    const src = menus.find((b) => b.id === defaultSourceId);
    setSourceBarId(defaultSourceId);
    setName(src ? `${src.name} (copie)` : '');
    setIcon(src?.icon || '🍺');
    setStep('copy');
  };

  const handleSourceChange = (newSourceId) => {
    setSourceBarId(newSourceId);
    const src = menus.find((b) => b.id === newSourceId);
    if (src) {
      setName(`${src.name} (copie)`);
      setIcon(src.icon || '🍺');
    }
  };

  const handleSubmitEmpty = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim() || '🍺';
    if (!trimmedName) {
      toast.error('Veuillez saisir un nom pour le bar.');
      return;
    }
    onCreateEmpty({ name: trimmedName, icon: trimmedIcon });
    onClose();
  };

  const handleSubmitCopy = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim() || '🍺';
    if (!sourceBarId) {
      toast.error('Veuillez choisir une carte à copier.');
      return;
    }
    if (!trimmedName) {
      toast.error('Veuillez saisir un nom pour la copie.');
      return;
    }
    onDuplicateBar(sourceBarId, { name: trimmedName, icon: trimmedIcon });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card text-foreground w-[92vw] max-w-md mx-auto rounded-lg p-5 sm:p-6 border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {step === 'empty'
              ? 'Nouvelle carte vide'
              : step === 'copy'
                ? 'Copier une carte'
                : 'Ajouter un bar'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {step === 'empty'
              ? 'Choisissez un nom et une icône. Vous pourrez ensuite ajouter vos catégories et boissons.'
              : step === 'copy'
                ? 'Créez une carte indépendante à partir d’un bar existant pour la personnaliser librement.'
                : 'Choisissez comment créer votre nouvelle carte de boissons.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'menu' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={() => {
                setName('');
                setIcon('🍺');
                setStep('empty');
              }}
              className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border bg-background hover:bg-muted/60 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">✏️ Carte vide</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Partir de zéro avec vos catégories
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSelectCopyStep}
              className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border bg-background hover:bg-muted/60 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">📋 Copier une carte</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Dupliquer un bar existant
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                toast('Bientôt disponible', {
                  description: 'L’ajout en lot par liste collée arrive à l’étape 9.8.'
                })
              }
              className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border/60 bg-background/50 opacity-75 hover:opacity-100 text-left transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">📝 Coller une liste</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Texte ou photo de carte
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                toast('Bientôt disponible', {
                  description: 'La réception par lien, QR code ou fichier arrive à l’étape 9.7e.'
                })
              }
              className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border/60 bg-background/50 opacity-75 hover:opacity-100 text-left transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">📲 Recevoir</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Lien, QR code ou fichier
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 'empty' && (
          <form onSubmit={handleSubmitEmpty} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="empty-bar-name" className="block mb-1 text-foreground">
                Nom du bar
              </Label>
              <Input
                id="empty-bar-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Ex : Chez Mimi, Buvette du stade…"
                required
                autoFocus
                className="w-full bg-background text-foreground"
              />
            </div>

            <div>
              <Label className="block mb-1.5 text-foreground">Icône</Label>
              <BarIconPicker value={icon} onChange={setIcon} id="empty-bar-icon" />
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
              {initialMode === 'menu' ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('menu')}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
              )}
              <Button type="submit" className="btn-primary">
                Créer la carte
              </Button>
            </div>
          </form>
        )}

        {step === 'copy' && (
          <form onSubmit={handleSubmitCopy} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="copy-source-bar" className="block mb-1 text-foreground">
                Carte à copier
              </Label>
              <select
                id="copy-source-bar"
                value={sourceBarId}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {menus.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icon} {b.name} ({countBarDrinks(b)} boissons)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="copy-bar-name" className="block mb-1 text-foreground">
                Nom de la nouvelle carte
              </Label>
              <Input
                id="copy-bar-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Ex : Soirée Anniversaire"
                required
                className="w-full bg-background text-foreground"
              />
            </div>

            <div>
              <Label className="block mb-1.5 text-foreground">Icône</Label>
              <BarIconPicker value={icon} onChange={setIcon} id="copy-bar-icon" />
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
              {initialMode === 'menu' ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('menu')}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
              )}
              <Button type="submit" className="btn-primary">
                Dupliquer la carte
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Fenêtre pour renommer un bar et modifier son icône.
 */
export const RenameBarModal = ({ isOpen, onClose, bar, onRename }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍺');

  useEffect(() => {
    if (bar && isOpen) {
      setName(bar.name || '');
      setIcon(bar.icon || '🍺');
    }
  }, [bar, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim() || '🍺';
    if (!trimmedName) {
      toast.error('Veuillez saisir un nom de bar.');
      return;
    }
    if (bar?.id) {
      onRename(bar.id, { name: trimmedName, icon: trimmedIcon });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card text-foreground w-[92vw] max-w-md mx-auto rounded-lg p-5 sm:p-6 border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Renommer la carte
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Modifiez le nom ou l’icône de « {bar?.name} ».
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="rename-bar-name" className="block mb-1 text-foreground">
              Nom du bar
            </Label>
            <Input
              id="rename-bar-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              autoFocus
              className="w-full bg-background text-foreground"
            />
          </div>

          <div>
            <Label className="block mb-1.5 text-foreground">Icône</Label>
            <BarIconPicker value={icon} onChange={setIcon} id="rename-bar-icon" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="btn-primary">
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Sélecteur rapide de bar (ouvert depuis le bouton du bar actif dans l'en-tête),
 * avec gestion du changement de bar lorsque le panier n'est pas vide (§ 4.2).
 */
const BarSelector = ({
  isOpen,
  onClose,
  menus = [],
  activeMenuId,
  onSelectBar,
  onCreateEmptyBar,
  onDuplicateBar,
  cartItemsCount = 0,
  onClearCart
}) => {
  const navigate = useNavigate();
  const [pendingBar, setPendingBar] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPendingBar(null);
    }
  }, [isOpen]);

  const handleBarClick = (bar) => {
    if (!bar) return;
    if (bar.id === activeMenuId) {
      onClose();
      return;
    }
    if (cartItemsCount > 0) {
      setPendingBar(bar);
      return;
    }
    onSelectBar(bar.id);
    onClose();
  };

  const handleKeepCartAndSwitch = () => {
    if (!pendingBar) return;
    onSelectBar(pendingBar.id);
    setPendingBar(null);
    onClose();
  };

  const handleClearCartAndSwitch = () => {
    if (!pendingBar) return;
    if (onClearCart) {
      onClearCart(false);
    }
    onSelectBar(pendingBar.id);
    setPendingBar(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !pendingBar} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-card text-foreground w-[92vw] max-w-md mx-auto rounded-lg p-5 sm:p-6 border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Choisir un bar
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Sélectionnez la carte à afficher pour prendre votre commande.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {menus.map((bar) => {
              const isActive = bar.id === activeMenuId;
              const drinksCount = countBarDrinks(bar);
              const official = isBaseBar(bar);

              return (
                <button
                  key={bar.id}
                  type="button"
                  onClick={() => handleBarClick(bar)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10 text-foreground font-semibold'
                      : 'border-border bg-background hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 flex items-center justify-center text-primary shrink-0">
                      {isActive ? <Check className="w-4 h-4 stroke-[2.5]" /> : null}
                    </span>
                    <span className="text-xl shrink-0" role="img" aria-label={bar.name}>
                      {bar.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="truncate text-sm sm:text-base">{bar.name}</span>
                        {official && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                            Base
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {drinksCount} boiss.
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-border flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                setShowAddModal(true);
              }}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un bar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onClose();
                navigate('/bars');
              }}
              className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="w-4 h-4" />
              Gérer mes bars
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue à 3 choix si le panier n'est pas vide (§ 4.2) */}
      <Dialog open={Boolean(pendingBar)} onOpenChange={(open) => !open && setPendingBar(null)}>
        <DialogContent className="bg-card text-foreground w-[92vw] max-w-md mx-auto rounded-lg p-5 sm:p-6 border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Panier en cours ({cartItemsCount} article{cartItemsCount > 1 ? 's' : ''})
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Votre panier contient déjà des boissons. Que souhaitez-vous faire avant d’ouvrir{' '}
              <span className="font-semibold text-foreground">
                {pendingBar?.icon} {pendingBar?.name}
              </span>{' '}
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-2.5">
            <Button
              type="button"
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              onClick={handleKeepCartAndSwitch}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Ajouter ce bar à la commande en cours</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full flex items-center justify-center gap-2 py-2.5"
              onClick={handleClearCartAndSwitch}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Vider le panier et changer</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setPendingBar(null)}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale d'ajout d'un bar */}
      <AddBarModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        menus={menus}
        activeMenuId={activeMenuId}
        onCreateEmpty={onCreateEmptyBar}
        onDuplicateBar={onDuplicateBar}
      />
    </>
  );
};

export default BarSelector;
