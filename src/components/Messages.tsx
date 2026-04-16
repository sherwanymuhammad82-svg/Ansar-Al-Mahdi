import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Send, UserPlus, Users, MessageSquare, ChevronRight } from 'lucide-react';
import { safeFetch } from '../utils/fetchUtils';

export default function Messages({ currentUser, language }: { currentUser: any, language: string }) {
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchChats = () => {
    safeFetch<any[]>(`/api/chats?userId=${currentUser.id}`)
      .then(data => setChats(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
    if (activeChat) {
      const fetchMessages = () => {
        safeFetch<any[]>(`/api/chats/${activeChat.id}/messages`)
          .then(data => setMessages(data))
          .catch(err => console.error(err));
      };
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 2) {
      safeFetch<any[]>(`/api/users/search?q=${e.target.value}`)
        .then(data => setSearchResults(data.filter((u: any) => u.id !== currentUser.id)))
        .catch(err => console.error(err));
    } else {
      setSearchResults([]);
    }
  };

  const startChat = (otherUser: any) => {
    safeFetch<any>('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participants: [currentUser.id, otherUser.id],
        participantNames: {
          [currentUser.id]: currentUser.name,
          [otherUser.id]: otherUser.name
        },
        isGroup: false
      })
    })
    .then(chat => {
      setSearchQuery('');
      setSearchResults([]);
      setActiveChat(chat);
      fetchChats();
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;
    safeFetch(`/api/chats/${activeChat.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        userName: currentUser.name,
        content: newMessage
      })
    }).then(() => {
      setNewMessage('');
      // Optimistic update
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        content: newMessage,
        createdAt: { _seconds: Date.now() / 1000 }
      }]);
    });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] max-w-5xl mx-auto p-4 gap-4">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-1/3 flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-gold mb-4">
            {language === 'ar' ? 'الرسائل' : 'نامەکان'}
          </h2>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={language === 'ar' ? 'ابحث عن مستخدم...' : 'گەڕان بۆ بەکارهێنەر...'}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-gold/50"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-2 w-[calc(100%-2rem)] bg-slate-900 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => startChat(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-right"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                    {user.name?.[0] || '?'}
                  </div>
                  <span className="text-white">{user.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {chats.map(chat => {
            const otherUserId = chat.participants?.find((id: string) => id !== currentUser.id);
            const chatName = chat.isGroup ? chat.name : chat.participantNames?.[otherUserId] || 'Unknown';
            
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-right mb-1 ${activeChat?.id === chat.id ? 'bg-gold/10 border border-gold/30' : 'hover:bg-white/5'}`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  {chat.isGroup ? <Users className="w-6 h-6 text-gold" /> : <span className="text-gold font-bold text-lg">{chatName?.[0] || '?'}</span>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-white font-medium truncate">{chatName}</h4>
                  <p className="text-slate-400 text-xs truncate">{chat.lastMessage || '...'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/20">
              <button className="md:hidden text-slate-400" onClick={() => setActiveChat(null)}>
                <ChevronRight className="w-6 h-6" />
              </button>
              <h3 className="text-lg font-bold text-white">
                {activeChat.isGroup ? activeChat.name : activeChat.participantNames?.[activeChat.participants?.find((id: string) => id !== currentUser.id)]}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
              {/* Messages are reversed because we want newest at bottom, but flex-col-reverse makes it easier to scroll to bottom */}
              {[...messages].reverse().map(msg => {
                const isMe = msg.userId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-olive text-gold rounded-tr-sm' : 'bg-slate-800 text-white rounded-tl-sm'}`}>
                      {!isMe && activeChat.isGroup && <p className="text-xs text-gold mb-1">{msg.userName}</p>}
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={language === 'ar' ? 'اكتب رسالة...' : 'نامەیەک بنووسە...'}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50"
              />
              <button
                onClick={sendMessage}
                className="w-12 h-12 rounded-xl bg-olive flex items-center justify-center text-gold hover:bg-olive/80 transition-colors shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p>{language === 'ar' ? 'اختر محادثة للبدء' : 'گفتوگۆیەک هەڵبژێرە بۆ دەستپێکردن'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
