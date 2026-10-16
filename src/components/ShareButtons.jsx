import React, { useState } from 'react';

import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

import { Share2, Mail, MessageSquare, Phone, Check, Copy } from 'lucide-react';

import { toast } from 'sonner';
import { formatPrice } from '../lib/format';
import { groupOrderItemsByBar } from '../lib/menus';

export const formatOrderSummary = (orderData, menus = []) => {
  if (!orderData) return "Aucune commande à partager.";

  const isArray = Array.isArray(orderData);
  const items = isArray
    ? orderData
    : Array.isArray(orderData.items)
    ? orderData.items
    : [];

  const total = isArray
    ? orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : orderData.total ?? 0;

  const date = isArray
    ? new Date().toLocaleDateString('fr-FR')
    : orderData.date
    ? new Date(orderData.date).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');

  const time = isArray
    ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : orderData.date
    ? new Date(orderData.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const grouped = groupOrderItemsByBar(items, menus);

  let summary = `🍹 Commande GentBar\n`;
  summary += `📅 ${date} à ${time}\n\n`;

  if (grouped.isMultiBar) {
    summary += `Commande · ${grouped.barsCount} bars\n`;
    grouped.groups.forEach((group) => {
      const deletedSuffix = group.isDeletedBar ? ' (supprimé)' : '';
      summary += `── ${group.barIcon} ${group.barName}${deletedSuffix} ──────── ${formatPrice(group.subtotal)}\n`;
      group.items.forEach((item) => {
        const itemName = item.drinkName || item.name;
        summary += ` ${item.quantity}× ${itemName}\n`;
      });
    });
    summary += `Total ─────────────────────── ${formatPrice(total)}\n`;
  } else {
    const singleBar = grouped.groups[0];
    if (singleBar && singleBar.barName && singleBar.barName !== 'Bar supprimé') {
      const deletedSuffix = singleBar.isDeletedBar ? ' (supprimé)' : '';
      summary += `Bar : ${singleBar.barIcon} ${singleBar.barName}${deletedSuffix}\n\n`;
    } else if (singleBar?.isDeletedBar) {
      summary += `Bar : 🏪 Bar supprimé\n\n`;
    }
    summary += `📝 Détail de la commande :\n`;
    items.forEach((item) => {
      const itemName = item.drinkName || item.name;
      const quantity = item.quantity;
      const price = item.price;
      const itemTotal = quantity * price;
      summary += `• ${quantity}x ${itemName} - ${formatPrice(itemTotal)}\n`;
    });
    summary += `\n💰 Total : ${formatPrice(total)}\n`;
  }

  const note = !isArray && typeof orderData?.note === 'string' ? orderData.note.trim() : '';
  if (note) {
    summary += `\n📌 Note : ${note}\n`;
  }

  summary += `\n📱 Généré via GentBar Order App`;

  return summary;
};

const ShareButtons = ({ order, menus = [], isCurrentOrder = false, className = '', size, disabled = false }) => {
  const [copied, setCopied] = useState(false);

  const getShareText = () => formatOrderSummary(order, menus);

  const handleCopyToClipboard = async () => {
    const textToShare = getShareText();
    try {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast("Copié dans le presse-papiers", { description: "Le résumé de la commande a été copié." });
    } catch {
      toast("Erreur de copie", { description: "Impossible de copier le texte.", variant: "destructive" });
    }
  };

  const handleNativeShare = async () => {
    const textToShare = getShareText();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: "🍹 Commande GentBar",
          text: textToShare,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
      }
    }
    await handleCopyToClipboard();
  };

  const handleShare = (platform) => {
    const textToShare = getShareText();
    const encoded = encodeURIComponent(textToShare);
    switch (platform) {
      case 'email': {
        const subject = encodeURIComponent(`🍹 Commande de Boissons du ${new Date().toLocaleDateString('fr-FR')}`);
        const body = encoded;
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        break;
      }
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
        break;
      case 'sms':
        window.location.href = `sms:?body=${encoded}`;
        break;
      case 'copy':
        handleCopyToClipboard();
        break;
      default:
        break;
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  if (hasNativeShare) {
    return (
      <Button
        size={size}
        disabled={disabled}
        className={`btn-outline flex items-center justify-center gap-1.5 text-foreground border-border ${className || 'w-full'}`}
        onClick={handleNativeShare}
        aria-label="Partager la commande"
      >
        <Share2 className="w-4 h-4 flex-shrink-0" />
        <span>Partager</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          disabled={disabled}
          className={`btn-outline flex items-center justify-center gap-1.5 text-foreground border-border ${className || 'w-full'}`}
          aria-label="Partager la commande"
        >
          <Share2 className="w-4 h-4 flex-shrink-0" />
          <span>Partager</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-card text-foreground border border-border shadow-md">
        <DropdownMenuItem onClick={() => handleShare('copy')} className="flex items-center justify-between text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
          Copier le texte {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="flex items-center justify-between text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
          WhatsApp <Phone className="w-4 h-4" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')} className="flex items-center justify-between text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
          Email <Mail className="w-4 h-4" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('sms')} className="flex items-center justify-between text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
          SMS <MessageSquare className="w-4 h-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButtons;
