import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search } from 'lucide-react';

export default function SearchUsers({ onSelectUser }: { onSelectUser: (user: any) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const q = query(collection(db, 'users'), where('displayName', '>=', searchQuery), where('displayName', '<=', searchQuery + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    setSearchResults(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  return (
    <div className="p-4">
      <div className="relative">
        <input 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/10 p-2 rounded-lg text-white"
          placeholder="گەڕان بۆ بەکارهێنەر..."
        />
        <button onClick={handleSearch} className="absolute right-2 top-2 text-gold"><Search /></button>
      </div>
      <div className="mt-4">
        {searchResults.map(user => (
          <button key={user.uid} onClick={() => onSelectUser(user)} className="w-full p-2 text-white hover:bg-white/10 rounded-lg">
            {user.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
