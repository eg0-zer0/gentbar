import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserPlus } from 'lucide-react';

const AddFriendModal = ({ onAddFriend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [friendName, setFriendName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (friendName.trim()) {
      onAddFriend(friendName.trim());
      setFriendName('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un ami
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un ami</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="friendName">Nom de l'ami</Label>
            <Input
              id="friendName"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="Ex: Marie, Pierre..."
              required
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;