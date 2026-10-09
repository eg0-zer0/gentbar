import React, { useState } from 'react';

import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

import { Share2, Mail, MessageSquare, Phone, Check } from 'lucide-react';

import { toast } from 'sonner';

const ShareButtons = ({ order, isCurrentOrder = false }) => {

  const [copied, setCopied] = useState(false);

  const formatOrderSummary = (orderData) => {
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

    let summary = `🍹 Commande de Boissons\n`;
    summary += `📅 ${date} à ${time}\n\n`;
    summary += `📝 Détail de la commande:\n`;

    items.forEach((item) => {
      const itemName = item.drinkName;
      const quantity = item.quantity;
      const price = item.price;
      const itemTotal = quantity * price;
      summary += `• ${quantity}x ${itemName} - ${itemTotal.toFixed(2)}€\n`;
    });

    summary += `\n💰 Total: ${total.toFixed(2)}€\n\n`;
    summary += `📱 Généré via GentBar Order App`;

    return summary;
  };

  const getShareText = () => formatOrderSummary(order);

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

  const handleShare = (platform) => {
    const textToShare = getShareText();
    const encoded = encodeURIComponent(textToShare);
    switch (platform) {
      case 'email': {
        const subject = encodeURIComponent(`🍹 Commande de Boissons du ${new Date().toLocaleDateString('fr-FR')}`);
        const body = encoded;
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        break;
      }
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encoded}`, '_blank');
        break;
      case 'messenger':
        handleCopyToClipboard();
        toast("Texte copié", { description: "Collez le texte dans Messenger." });
        break;
      case 'copy':
        handleCopyToClipboard();
        break;
      default:
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
    className="btn-outline flex items-center gap-2 text-foreground border-border-color"
    aria-label="Partager la commande"
  >
    <Share2 className="w-5 h-5" />
    Partager
  </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-card border border-border-color shadow-md">
        <DropdownMenuItem onClick={() => handleShare('email')} className="flex items-center justify-between text-foreground hover:bg-primary hover:text-white cursor-pointer">
          Email <Mail className="w-4 h-4" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="flex items-center justify-between text-foreground hover:bg-primary hover:text-white cursor-pointer">
          WhatsApp <Phone className="w-4 h-4" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('sms')} className="flex items-center justify-between text-foreground hover:bg-primary hover:text-white cursor-pointer">
          SMS <MessageSquare className="w-4 h-4" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('messenger')} className="flex items-center justify-between text-foreground hover:bg-primary hover:text-white cursor-pointer">
          Messenger <MessageSquare className="w-4 h-4" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')} className="flex items-center justify-between text-foreground hover:bg-primary hover:text-white cursor-pointer">
          Copier le texte {copied && <Check className="w-4 h-4 text-green-500" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButtons;
