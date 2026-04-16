import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Loader2 } from 'lucide-react';

export default function Chat({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser) return;

    await addDoc(collection(db, 'messages'), {
      conversationId,
      senderId: auth.currentUser.uid,
      text: newMessage,
      createdAt: serverTimestamp()
    });
    setNewMessage('');
  };

  if (loading) return <div className="flex justify-center p-8 text-gold"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full bg-black/20">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] p-3 rounded-2xl ${msg.senderId === auth.currentUser?.uid ? 'bg-gold text-black' : 'bg-white/10 text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <div className="p-4 border-t border-white/10 flex gap-2">
        <input 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 bg-white/10 p-2 rounded-lg text-white"
          placeholder="بنوسە..."
        />
        <button onClick={sendMessage} className="p-2 bg-gold text-black rounded-lg"><Send size={20} /></button>
      </div>
    </div>
  );
}
