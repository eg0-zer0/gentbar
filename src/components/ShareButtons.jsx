import React, { useState } from 'react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Share2, Mail, MessageSquare, Phone, Copy, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ShareButtons = ({ order, isCurrentOrder = false }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Formate le résumé de la commande en texte clair avec retours à la ligne
  const formatOrderSummary = (orderData) => {
    const isArray = Array.isArray(orderData);
    const items = isArray ? orderData : orderData.items;
    const total = isArray
      ? orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      : orderData.total;

    const date = isArray ? new Date().toLocaleDateString('fr-FR') : new Date(orderData.date).toLocaleDateString('fr-FR');
    const time = isArray
      ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : new Date(orderData.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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

  const shareText = formatOrderSummary(order);
  const encodedText = encodeURIComponent(shareText);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copié dans le presse-papiers",
        description: "Le résumé de la commande a été copié.",
      });
    } catch (error) {
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier le texte.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform) => {
    switch (platform) {
      case 'email': {
        const subject = encodeURIComponent(`🍹 Commande de Boissons du ${new Date().toLocaleDateString('fr-FR')}`);
        const body = encodeURIComponent(shareText);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        break;
      }
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodedText}`, '_blank');
        break;
      case 'messenger':
        // Pas d'API officielle, on copie le texte
        handleCopyToClipboard();
        toast({
          title: "Texte copié",
          description: "Collez le texte dans Messenger.",
        });
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
        <Button variant="outline" size="sm" aria-label="Partager la commande">
          <Share2 className="mr-2" /> Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-52">
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="mr-2" /> Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageSquare className="mr-2" /> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('sms')}>
          <Phone className="mr-2" /> SMS
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('messenger')}>
          <MessageSquare className="mr-2" /> Messenger
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')} className="flex items-center justify-between">
          Copier le texte {copied ? <Check /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButtons;
