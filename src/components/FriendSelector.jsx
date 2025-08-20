import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Users, UserCheck } from 'lucide-react';
import AddFriendModal from './AddFriendModal';

const FriendSelector = ({ friends, selectedFriend, onSelectFriend, onAddFriend }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Commander pour
          </div>
          <AddFriendModal onAddFriend={onAddFriend} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {friends.map((friend) => (
            <Button
              key={friend}
              variant={selectedFriend === friend ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectFriend(friend)}
              className={selectedFriend === friend ? 
                "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white" : 
                ""
              }
            >
              {selectedFriend === friend && <UserCheck className="w-4 h-4 mr-2" />}
              {friend}
            </Button>
          ))}
          {friends.length === 0 && (
            <p className="text-gray-500 text-sm">Aucun ami ajouté pour le moment</p>
          )}
        </div>
        
        {selectedFriend && (
          <Badge className="mt-3 bg-green-100 text-green-800">
            Commande en cours pour: {selectedFriend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default FriendSelector;