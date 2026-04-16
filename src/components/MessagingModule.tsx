import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import SearchUsers from './SearchUsers';
import Chat from './Chat';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export default function MessagingModule({ currentUser, language, setShowLoginModal }: { currentUser: any, language: string, setShowLoginModal: (show: boolean) => void }) {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const startChat = async (otherUser: any) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    let conversationId = null;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(otherUser.uid)) {
        conversationId = doc.id;
      }
    });

    if (!conversationId) {
      const docRef = await addDoc(collection(db, 'conversations'), {
        participants: [currentUser.uid, otherUser.uid],
        type: 'private',
        createdAt: serverTimestamp()
      });
      conversationId = docRef.id;
    }
    setActiveChat(conversationId);
  };

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-white/10">
        <SearchUsers onSelectUser={startChat} />
      </div>
      <div className="flex-1">
        {activeChat ? <Chat conversationId={activeChat} /> : <div className="p-4 text-white">هەڵبژاردنی گفتوگۆ</div>}
      </div>
    </div>
  );
}
