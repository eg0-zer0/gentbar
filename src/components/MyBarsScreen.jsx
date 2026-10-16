import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Check,
  Pencil,
  Copy,
  RotateCcw,
  Trash2,
  Share2,
  ShoppingBag,
  QrCode
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { AddBarModal, RenameBarModal } from './BarSelector';
import ShareBarModal from './ShareBarModal';
import { useMenus } from '../hooks/useMenus';
import { useCart } from '../hooks/useCart';
import { countBarDrinks, isBaseBar } from '../lib/menus';

const MyBarsScreen = () => {
  const navigate = useNavigate();
  const {
    menus,
    activeMenuId,
    selectBar,
    addEmptyBar,
    duplicateExistingBar,
    renameExistingBar,
    deleteExistingBar,
    restoreBaseBar
  } = useMenus();

  const { totalItems, clearCart } = useCart(activeMenuId);

  const [addModalState, setAddModalState] = useState({
    isOpen: false,
    mode: 'menu',
    sourceBarId: null
  });
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [pendingSwitchBar, setPendingSwitchBar] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const handleUseBar = (bar) => {
    if (!bar) return;
    if (bar.id === activeMenuId) {
      navigate('/app');
      return;
    }
    if (totalItems > 0) {
      setPendingSwitchBar(bar);
      return;
    }
    selectBar(bar.id);
    navigate('/app');
  };

  const handleKeepCartAndSwitch = () => {
    if (!pendingSwitchBar) return;
    selectBar(pendingSwitchBar.id);
    setPendingSwitchBar(null);
    navigate('/app');
  };

  const handleClearCartAndSwitch = () => {
    if (!pendingSwitchBar) return;
    clearCart(false);
    selectBar(pendingSwitchBar.id);
    setPendingSwitchBar(null);
    navigate('/app');
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 pt-3 sm:pt-5 pb-12 max-w-2xl">
        {/* En-tête */}
        <header className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="flex items-center gap-1.5 px-2.5 h-9"
              aria-label="Retour au menu"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Menu</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Mes bars</h1>
          </div>

          <div>
            <Button
              type="button"
              size="sm"
              className="btn-primary flex items-center gap-1.5 h-9"
              onClick={() => setAddModalState({ isOpen: true, mode: 'menu', sourceBarId: null })}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un bar</span>
            </Button>
          </div>
        </header>

        {/* Liste des bars */}
        <div className="space-y-3" role="list" aria-label="Liste de mes bars">
          {menus.map((bar) => {
            const isActive = bar.id === activeMenuId;
            const official = isBaseBar(bar);
            const drinksCount = countBarDrinks(bar);
            const categoriesCount = Array.isArray(bar.categories) ? bar.categories.length : 0;

            return (
              <div
                key={bar.id}
                role="listitem"
                className={`rounded-lg border p-4 bg-card text-foreground shadow-xs transition-colors ${
                  isActive ? 'border-primary ring-1 ring-primary/40' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="text-2xl sm:text-3xl shrink-0 select-none mt-0.5"
                      role="img"
                      aria-label={bar.name}
                    >
                      {bar.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-base sm:text-lg text-foreground truncate">
                          {bar.name}
                        </h2>
                        {official && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border/60">
                            Carte de base
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                            <Check className="w-3 h-3" />
                            Actif
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {drinksCount} boisson{drinksCount > 1 ? 's' : ''} · {categoriesCount} catégorie
                        {categoriesCount > 1 ? 's' : ''}
                        {official ? ' · officielle' : ' · personnalisée'}
                      </p>
                    </div>
                  </div>

                  {/* Menu ⋯ */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label={`Options pour ${bar.name}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 dropdown-menu-content">
                      <DropdownMenuItem
                        className="dropdown-menu-item"
                        onClick={() => setRenameTarget(bar)}
                      >
                        <Pencil className="mr-2 w-4 h-4" />
                        Renommer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="dropdown-menu-item"
                        onClick={() =>
                          setAddModalState({
                            isOpen: true,
                            mode: 'copy',
                            sourceBarId: bar.id
                          })
                        }
                      >
                        <Copy className="mr-2 w-4 h-4" />
                        Dupliquer
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="dropdown-menu-item"
                        onClick={() => setShareTarget(bar)}
                      >
                        <Share2 className="mr-2 w-4 h-4" />
                        Partager
                      </DropdownMenuItem>

                      {!official && bar.sourceId && (
                        <DropdownMenuItem
                          className="dropdown-menu-item"
                          onClick={() => navigate('/recevoir')}
                        >
                          <QrCode className="mr-2 w-4 h-4" />
                          Mettre à jour la carte
                        </DropdownMenuItem>
                      )}

                      {official ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="dropdown-menu-item"
                            onClick={() => setRestoreTarget(bar)}
                          >
                            <RotateCcw className="mr-2 w-4 h-4" />
                            Restaurer la carte de base
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="dropdown-menu-item text-red-600 dark:text-red-400 focus:text-red-600"
                            onClick={() => setDeleteTarget(bar)}
                          >
                            <Trash2 className="mr-2 w-4 h-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Boutons d'action de la carte */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? 'outline' : 'default'}
                    className={isActive ? 'btn-outline flex-1 sm:flex-initial' : 'btn-primary flex-1 sm:flex-initial'}
                    onClick={() => handleUseBar(bar)}
                  >
                    {isActive ? 'Ouvrir le menu' : 'Utiliser'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 flex-1 sm:flex-initial"
                    onClick={() => setShareTarget(bar)}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Partager
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bouton Ajouter un bar en bas de liste */}
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full py-5 border-dashed flex items-center justify-center gap-2"
            onClick={() => setAddModalState({ isOpen: true, mode: 'menu', sourceBarId: null })}
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un bar (carte vide ou copie)</span>
          </Button>
        </div>
      </div>

      {/* Modale d'ajout / duplication */}
      <AddBarModal
        isOpen={addModalState.isOpen}
        onClose={() => setAddModalState({ isOpen: false, mode: 'menu', sourceBarId: null })}
        menus={menus}
        activeMenuId={activeMenuId}
        initialMode={addModalState.mode}
        initialSourceBarId={addModalState.sourceBarId}
        onCreateEmpty={(params) => {
          addEmptyBar({ ...params, activate: true });
          navigate('/app');
        }}
        onDuplicateBar={(srcId, params) => {
          duplicateExistingBar(srcId, { ...params, activate: true });
          navigate('/app');
        }}
      />

      {/* Modale Renommer */}
      <RenameBarModal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        bar={renameTarget}
        onRename={renameExistingBar}
      />

      {/* Confirmation de suppression (cartes personnalisées uniquement) */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.id) {
            deleteExistingBar(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        title="Supprimer cette carte ?"
        description={`Voulez-vous vraiment supprimer « ${deleteTarget?.name || ''} » ? Une sauvegarde de secours sera conservée automatiquement.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      {/* Confirmation de restauration de carte de base officielle */}
      <Dialog open={Boolean(restoreTarget)} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <DialogContent className="bg-card text-foreground w-[92vw] max-w-md mx-auto rounded-lg p-5 sm:p-6 border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Restaurer la carte officielle ?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              La carte{' '}
              <span className="font-semibold text-foreground">
                {restoreTarget?.icon} {restoreTarget?.name}
              </span>{' '}
              reprendra toutes ses catégories, boissons et tarifs d’origine. Vos modifications sur cette carte seront effacées (une sauvegarde préalable est effectuée).
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setRestoreTarget(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              className="btn-primary flex items-center gap-1.5"
              onClick={() => {
                if (restoreTarget?.id) {
                  restoreBaseBar(restoreTarget.id);
                }
                setRestoreTarget(null);
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Restaurer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue à 3 choix si panier non vide lors du clic sur « Utiliser » */}
      <Dialog
        open={Boolean(pendingSwitchBar)}
        onOpenChange={(open) => !open && setPendingSwitchBar(null)}
      >
        <DialogContent className="bg-card text-foreground w-[92vw] max-w-md mx-auto rounded-lg p-5 sm:p-6 border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Panier en cours ({totalItems} article{totalItems > 1 ? 's' : ''})
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Votre panier contient déjà des boissons. Que souhaitez-vous faire avant d’utiliser{' '}
              <span className="font-semibold text-foreground">
                {pendingSwitchBar?.icon} {pendingSwitchBar?.name}
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
              onClick={() => setPendingSwitchBar(null)}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fenêtre de partage (QR code, lien, fichier) */}
      <ShareBarModal
        bar={shareTarget}
        isOpen={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
      />
    </div>
  );
};

export default MyBarsScreen;
