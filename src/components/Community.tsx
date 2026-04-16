import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, doc, getDocs, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Users, MessageCircle, Lock, Image as ImageIcon, Send, Plus, ChevronRight, Loader2, UserPlus, Camera, Globe, ArrowLeft, Search, CheckCheck, Smile, Paperclip, LogIn, Mic, Video as VideoIcon, X, Square } from 'lucide-react';

interface CommunityProps {
  language: 'ar' | 'ku' | 'en';
  theme: 'night' | 'white' | 'cream';
  currentUser?: any;
}

export default function Community({ language, theme, currentUser }: CommunityProps) {
  const [deviceId, setDeviceId] = useState<string>('');
  const [communityUser, setCommunityUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'loading' | 'register' | 'login' | 'authenticated'>('loading');
  
  // Auth Form State
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Chat State
  const [view, setView] = useState<'list' | 'chat' | 'createGroup' | 'search'>('list');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Media State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSending, setIsSending] = useState(false);

  // New Features State
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showProfile, setShowProfile] = useState<any>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [wallpaper, setWallpaper] = useState<string>('');
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  // Initialize Device ID and check auth
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setCommunityUser({
        id: 'admin_ahmad',
        name: language === 'ar' ? 'احمد (أدمن)' : language === 'en' ? 'Ahmad (Admin)' : 'احمد (بەڕێوەبەر)',
        photoUrl: 'https://ui-avatars.com/api/?name=Ahmad&background=D4AF37&color=fff',
        role: 'admin'
      });
      setAuthMode('authenticated');
      return;
    }

    let storedDeviceId = localStorage.getItem('communityDeviceId');
    if (!storedDeviceId) {
      storedDeviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('communityDeviceId', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    const checkAuth = async () => {
      try {
        const storedUserId = localStorage.getItem('communityUserId');
        
        if (storedUserId === 'admin_ahmad') {
          setCommunityUser({
            id: 'admin_ahmad',
            name: language === 'ar' ? 'احمد (أدمن)' : language === 'en' ? 'Ahmad (Admin)' : 'احمد (بەڕێوەبەر)',
            photoUrl: 'https://ui-avatars.com/api/?name=Ahmad&background=D4AF37&color=fff',
            role: 'admin'
          });
          setAuthMode('authenticated');
          return;
        }

        if (storedUserId) {
          const userDoc = await getDoc(doc(db, 'community_users', storedUserId));
          if (userDoc.exists()) {
            setCommunityUser({ id: userDoc.id, ...userDoc.data() });
            setAuthMode('authenticated');
            return;
          } else {
            localStorage.removeItem('communityUserId');
          }
        }

        // Check if device ID exists in DB
        const q = query(collection(db, 'community_users'), where('deviceId', '==', storedDeviceId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setAuthMode('login');
        } else {
          setAuthMode('register');
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthMode('register');
      }
    };

    checkAuth();
  }, [currentUser, language]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin Bypass
    if (name.trim() === 'احمد' && passcode.trim() === '7313') {
      localStorage.setItem('communityUserId', 'admin_ahmad');
      setCommunityUser({
        id: 'admin_ahmad',
        name: language === 'ar' ? 'احمد (أدمن)' : language === 'en' ? 'Ahmad (Admin)' : 'احمد (بەڕێوەبەر)',
        photoUrl: 'https://ui-avatars.com/api/?name=Ahmad&background=D4AF37&color=fff',
        role: 'admin'
      });
      setAuthMode('authenticated');
      return;
    }

    if (!name.trim() || !passcode.trim() || !photoFile) {
      setAuthError(
        language === 'ar' 
          ? 'يرجى ملء جميع الحقول واختيار صورة' 
          : language === 'en'
          ? 'Please fill all fields and choose a photo'
          : 'تکایە هەموو زانیارییەکان پڕبکەرەوە و وێنەیەک هەڵبژێرە'
      );
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      // Upload Photo
      const storageRef = ref(storage, `community_profiles/${deviceId}_${Date.now()}`);
      await uploadBytes(storageRef, photoFile);
      const photoUrl = await getDownloadURL(storageRef);

      // Create User
      const docRef = await addDoc(collection(db, 'community_users'), {
        name,
        passcode,
        photoUrl,
        deviceId,
        createdAt: serverTimestamp()
      });

      localStorage.setItem('communityUserId', docRef.id);
      setCommunityUser({ id: docRef.id, name, passcode, photoUrl, deviceId });
      setAuthMode('authenticated');
    } catch (err) {
      console.error(err);
      setAuthError(language === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'هەڵەیەک ڕوویدا لە کاتی خۆتۆمارکردن');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    // Admin Bypass
    if (passcode.trim() === '7313') {
      localStorage.setItem('communityUserId', 'admin_ahmad');
      setCommunityUser({
        id: 'admin_ahmad',
        name: language === 'ar' ? 'احمد (أدمن)' : language === 'en' ? 'Ahmad (Admin)' : 'احمد (بەڕێوەبەر)',
        photoUrl: 'https://ui-avatars.com/api/?name=Ahmad&background=D4AF37&color=fff',
        role: 'admin'
      });
      setAuthMode('authenticated');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const q = query(collection(db, 'community_users'), where('deviceId', '==', deviceId), where('passcode', '==', passcode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        localStorage.setItem('communityUserId', userDoc.id);
        setCommunityUser({ id: userDoc.id, ...userDoc.data() });
        setAuthMode('authenticated');
      } else {
        setAuthError(
          language === 'ar' 
            ? 'الرمز السري غير صحيح' 
            : language === 'en'
            ? 'Incorrect passcode'
            : 'کۆدی نهێنی هەڵەیە'
        );
      }
    } catch (err) {
      console.error(err);
      setAuthError(
        language === 'ar' 
          ? 'حدث خطأ أثناء تسجيل الدخول' 
          : language === 'en'
          ? 'An error occurred during login'
          : 'هەڵەیەک ڕوویدا لە کاتی چوونەژوورەوە'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // Ensure Public Chat exists
  useEffect(() => {
    if (authMode !== 'authenticated' || !communityUser) return;
    
    const ensurePublicChat = async () => {
      const publicChatId = 'public_community_chat';
      const docRef = doc(db, 'conversations', publicChatId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          name: language === 'ar' ? 'الدردشة العامة' : language === 'en' ? 'Public Chat' : 'چاتی گشتی',
          participants: [communityUser.id],
          type: 'public',
          createdAt: serverTimestamp()
        });
      } else {
        const data = docSnap.data();
        if (!data.participants.includes(communityUser.id)) {
          await updateDoc(docRef, {
            participants: arrayUnion(communityUser.id)
          });
        }
      }
    };
    ensurePublicChat();
  }, [authMode, communityUser, language]);

  // Fetch Conversations
  useEffect(() => {
    if (authMode !== 'authenticated' || !communityUser) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', communityUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const sorted = convs.sort((a: any, b: any) => {
        if (a.type === 'public') return -1;
        if (b.type === 'public') return 1;
        return 0;
      });
      setConversations(sorted);
    });

    return () => unsubscribe();
  }, [authMode, communityUser]);

  // Fetch Messages for Active Chat
  useEffect(() => {
    if (!activeChat) return;
    
    // For public chat, only fetch messages from the last 24 hours
    let q;
    if (activeChat.type === 'public') {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      q = query(
        collection(db, `conversations/${activeChat.id}/messages`),
        where('createdAt', '>=', yesterday),
        orderBy('createdAt', 'asc')
      );
    } else {
      q = query(
        collection(db, `conversations/${activeChat.id}/messages`),
        orderBy('createdAt', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setMessages(msgs);
      
      // Simulate online users based on recent messages
      const online: Record<string, boolean> = {};
      msgs.slice(-20).forEach(m => {
        if (m.senderId) online[m.senderId] = true;
      });
      setOnlineUsers(online);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const q = query(
      collection(db, 'community_users'),
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    setSearchResults(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(u => u.id !== communityUser.id));
  };

  const startPrivateChat = async (otherUser: any) => {
    const existing = conversations.find(c => 
      c.type === 'private' && c.participants.includes(otherUser.id)
    );

    if (existing) {
      setActiveChat(existing);
      setView('chat');
    } else {
      const docRef = await addDoc(collection(db, 'conversations'), {
        participants: [communityUser.id, otherUser.id],
        participantNames: {
          [communityUser.id]: communityUser.name,
          [otherUser.id]: otherUser.name
        },
        type: 'private',
        createdAt: serverTimestamp()
      });
      setActiveChat({ id: docRef.id, participants: [communityUser.id, otherUser.id], type: 'private', participantNames: { [otherUser.id]: otherUser.name } });
      setView('chat');
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    const participants = [communityUser.id, ...selectedUsers];
    const docRef = await addDoc(collection(db, 'conversations'), {
      name: groupName,
      participants,
      type: 'group',
      createdBy: communityUser.id,
      createdAt: serverTimestamp()
    });
    setActiveChat({ id: docRef.id, name: groupName, participants, type: 'group' });
    setView('chat');
    setGroupName('');
    setSelectedUsers([]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'audio_message.webm', { type: 'audio/webm' });
        setMediaFile(file);
        setMediaType('audio');
        setMediaPreview(URL.createObjectURL(file));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(language === 'ar' ? 'لا يمكن الوصول إلى الميكروفون' : 'ناتوانرێت دەستگەیشتن بە مایکرۆفۆن هەبێت');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    setMediaType(null);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !mediaFile) || !activeChat || isSending) return;
    
    setIsSending(true);
    try {
      let mediaUrl = null;
      if (mediaFile) {
        const storageRef = ref(storage, `chats/${activeChat.id}/${Date.now()}_${mediaFile.name}`);
        await uploadBytes(storageRef, mediaFile);
        mediaUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, `conversations/${activeChat.id}/messages`), {
        senderId: communityUser.id,
        senderName: communityUser.name,
        senderPhoto: communityUser.photoUrl,
        content: newMessage.trim(),
        mediaUrl,
        mediaType,
        replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.content, senderName: replyingTo.senderName } : null,
        createdAt: serverTimestamp()
      });

      setNewMessage('');
      clearMedia();
      setReplyingTo(null);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الرسالة؟' : language === 'en' ? 'Are you sure you want to delete this message?' : 'دڵنیایت لە سڕینەوەی ئەم نامەیە؟')) {
      try {
        // In a real app, we'd use deleteDoc, but for this demo we'll just update it to show it's deleted
        await updateDoc(doc(db, `conversations/${activeChat.id}/messages`, msgId), {
          content: language === 'ar' ? '🚫 تم حذف هذه الرسالة' : language === 'en' ? '🚫 This message was deleted' : '🚫 ئەم نامەیە سڕایەوە',
          mediaUrl: null,
          mediaType: null,
          isDeleted: true
        });
      } catch (err) {
        console.error("Error deleting message:", err);
      }
    }
    setActiveMessageId(null);
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setActiveMessageId(null);
    alert(language === 'ar' ? 'تم نسخ النص' : language === 'en' ? 'Text copied' : 'دەقەکە کۆپی کرا');
  };

  const clearChatHistory = async () => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من مسح السجل؟' : language === 'en' ? 'Are you sure you want to clear history?' : 'دڵنیایت لە سڕینەوەی مێژووی چات؟')) {
      setMessages([]);
      alert(language === 'ar' ? 'تم مسح السجل محلياً' : language === 'en' ? 'History cleared locally' : 'مێژووی چات سڕایەوە');
    }
  };

  const leaveGroup = async () => {
    if (window.confirm(language === 'ar' ? 'هل تريد مغادرة المجموعة؟' : language === 'en' ? 'Do you want to leave the group?' : 'دەتەوێت لەم گرووپە دەربچیت؟')) {
      setView('list');
      setActiveChat(null);
    }
  };

  const getChatName = (conv: any) => {
    if (conv.type === 'public') return language === 'ar' ? 'الدردشة العامة' : language === 'en' ? 'Public Chat' : 'چاتی گشتی';
    if (conv.type === 'group') return conv.name;
    const otherId = conv.participants?.find((id: string) => id !== communityUser.id);
    return conv.participantNames?.[otherId] || 'Private Chat';
  };

  if (authMode === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (authMode === 'register' || authMode === 'login') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center" dir={language === 'ar' ? 'rtl' : 'rtl'}>
        <div className="w-20 h-20 bg-olive/20 rounded-full flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-gold" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {language === 'ar' ? 'المجتمع' : language === 'en' ? 'Community' : 'کۆمەڵگە'}
        </h2>
        <p className="text-slate-400 mb-8 max-w-xs">
          {authMode === 'register' 
            ? (language === 'ar' ? 'قم بإنشاء حسابك للتواصل مع الأعضاء' : language === 'en' ? 'Create your account to connect with members' : 'هەژمارەکەت دروست بکە بۆ پەیوەندیکردن لەگەڵ ئەندامان')
            : (language === 'ar' ? 'مرحباً بعودتك! أدخل الرمز السري للمتابعة' : language === 'en' ? 'Welcome back! Enter your passcode to continue' : 'بەخێربێیتەوە! کۆدی نهێنی بنووسە بۆ بەردەوامبوون')}
        </p>

        <form onSubmit={authMode === 'register' ? handleRegister : handleLogin} className="w-full max-w-sm space-y-4">
          {authMode === 'register' && (
            <>
              <div className="flex justify-center mb-6">
                <label className="relative cursor-pointer group">
                  <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${photoPreview ? 'border-gold' : 'border-slate-600 border-dashed'} flex items-center justify-center bg-slate-800`}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-500 group-hover:text-gold transition-colors" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ar' ? 'الاسم' : language === 'en' ? 'Name' : 'ناو'}
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gold text-right"
              />
            </>
          )}
          
          <input 
            type="password" 
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder={language === 'ar' ? 'الرمز السري (كود)' : language === 'en' ? 'Passcode' : 'کۆدی نهێنی'}
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gold text-right"
          />

          {authError && <p className="text-red-400 text-sm">{authError}</p>}

          <button 
            type="submit" 
            disabled={authLoading}
            className="w-full bg-olive text-gold py-3 rounded-xl font-bold hover:bg-olive/80 transition-colors flex items-center justify-center gap-2"
          >
            {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {authMode === 'register' 
              ? (language === 'ar' ? 'إنشاء حساب' : language === 'en' ? 'Create Account' : 'دروستکردنی هەژمار')
              : (language === 'ar' ? 'دخول' : language === 'en' ? 'Login' : 'چوونەژوورەوە')}
          </button>
        </form>
      </div>
    );
  }

  if (!communityUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'rtl'}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b shadow-md z-20 ${theme === 'night' ? 'bg-[#202c33] border-white/5' : 'bg-white border-stone-200'}`}>
        {view === 'list' ? (
          <>
            <div className="flex items-center gap-3">
              <img src={communityUser.photoUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gold/30" />
              <h3 className={`font-medium ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>{language === 'ar' ? 'المجتمع' : language === 'en' ? 'Community' : 'کۆمەڵگە'}</h3>
            </div>
            <div className={`flex items-center gap-4 ${theme === 'night' ? 'text-[#aebac1]' : 'text-stone-500'}`}>
              <Search className="w-5 h-5 cursor-pointer" onClick={() => setView('search')} />
              <Plus className="w-6 h-6 cursor-pointer" onClick={() => setView('createGroup')} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <ArrowLeft className={`w-6 h-6 cursor-pointer ${theme === 'night' ? 'text-[#aebac1]' : 'text-stone-500'}`} onClick={() => { setView('list'); setActiveChat(null); }} />
              {view === 'chat' && (
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowGroupInfo(true)}>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-olive flex items-center justify-center text-gold font-bold overflow-hidden">
                      {activeChat.type === 'public' ? <Globe className="w-6 h-6" /> : (activeChat.name?.[0] || 'P')}
                    </div>
                    {activeChat.type !== 'public' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                  </div>
                  <div>
                    <h3 className={`font-medium text-sm ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>
                      {getChatName(activeChat)}
                    </h3>
                    {activeChat.type === 'public' ? (
                      <p className="text-[10px] text-gold">{language === 'ar' ? 'تحذف الرسائل بعد 24 ساعة' : language === 'en' ? 'Messages deleted after 24h' : 'نامەکان دوای ٢٤ کاتژمێر دەسڕێنەوە'}</p>
                    ) : (
                      <p className="text-[10px] text-green-500">{language === 'ar' ? 'متصل الآن' : language === 'en' ? 'Online' : 'ئۆنلاینە'}</p>
                    )}
                  </div>
                </div>
              )}
              {view === 'search' && <h3 className={`font-medium ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>{language === 'ar' ? 'بحث عن أعضاء' : language === 'en' ? 'Search Members' : 'گەڕان بۆ ئەندامان'}</h3>}
              {view === 'createGroup' && <h3 className={`font-medium ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>{language === 'ar' ? 'مجموعة جديدة' : language === 'en' ? 'New Group' : 'گرووپێکی نوێ'}</h3>}
            </div>
            
            {view === 'chat' && (
              <div className={`flex items-center gap-3 ${theme === 'night' ? 'text-[#aebac1]' : 'text-stone-500'}`}>
                <Search className="w-5 h-5 cursor-pointer" onClick={() => setShowChatSearch(!showChatSearch)} />
                <div className="relative group">
                  <div className="cursor-pointer p-1">
                    <div className="w-1 h-1 bg-current rounded-full mb-1"></div>
                    <div className="w-1 h-1 bg-current rounded-full mb-1"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                  </div>
                  <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-lg border z-50 hidden group-hover:block ${theme === 'night' ? 'bg-[#2a3942] border-white/10' : 'bg-white border-stone-200'}`}>
                    <button onClick={clearChatHistory} className="w-full text-right px-4 py-3 text-sm hover:bg-black/5">{language === 'ar' ? 'مسح السجل' : language === 'en' ? 'Clear History' : 'سڕینەوەی مێژوو'}</button>
                    {activeChat.type !== 'public' && <button onClick={leaveGroup} className="w-full text-right px-4 py-3 text-sm text-red-500 hover:bg-black/5">{language === 'ar' ? 'مغادرة' : language === 'en' ? 'Leave' : 'دەرچوون'}</button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {view === 'list' && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => { setActiveChat(conv); setView('chat'); }}
                className={`flex items-center gap-4 p-4 cursor-pointer border-b transition-colors ${
                  theme === 'night' 
                    ? `border-white/5 hover:bg-[#202c33] ${conv.type === 'public' ? 'bg-olive/10' : ''}` 
                    : `border-stone-100 hover:bg-stone-50 ${conv.type === 'public' ? 'bg-olive/5' : ''}`
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-gold font-bold text-xl shrink-0 relative ${conv.type === 'public' ? 'bg-olive' : 'bg-olive/80'}`}>
                  {conv.type === 'public' ? <Globe className="w-7 h-7" /> : (getChatName(conv)?.[0] || '?')}
                  {conv.type !== 'public' && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`font-medium truncate ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>{getChatName(conv)}</h4>
                    <span className={`text-[10px] ${theme === 'night' ? 'text-[#8696a0]' : 'text-stone-400'}`}>
                      {conv.type === 'public' ? (language === 'ar' ? 'عام' : language === 'en' ? 'Public' : 'گشتی') : (conv.type === 'group' ? (language === 'ar' ? 'مجموعة' : language === 'en' ? 'Group' : 'گرووپ') : (language === 'ar' ? 'خاص' : language === 'en' ? 'Private' : 'تایبەت'))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${theme === 'night' ? 'text-[#8696a0]' : 'text-stone-500'}`}>
                      {conv.type === 'public' ? (language === 'ar' ? 'دردشة مع الجميع' : language === 'en' ? 'Chat with everyone' : 'چات لەگەڵ هەمووان') : (language === 'ar' ? 'اضغط لفتح الدردشة' : language === 'en' ? 'Click to open chat' : 'کلیک بکە بۆ چات')}
                    </p>
                    {Math.random() > 0.5 && conv.type !== 'public' && (
                      <div className="w-5 h-5 rounded-full bg-olive text-gold text-[10px] flex items-center justify-center font-bold">
                        {Math.floor(Math.random() * 5) + 1}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'search' && (
          <div className="h-full flex flex-col p-4">
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث بالاسم...' : language === 'en' ? 'Search by name...' : 'بە ناو بگەڕێ...'}
                className={`flex-1 rounded-xl px-4 py-2 focus:outline-none ${theme === 'night' ? 'bg-[#2a3942] text-white' : 'bg-stone-100 text-stone-900 border border-stone-200'}`}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="bg-olive text-gold p-2 rounded-xl">
                <Search className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {searchResults.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => startPrivateChat(user)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${theme === 'night' ? 'bg-[#202c33] hover:bg-[#2a3942]' : 'bg-stone-50 hover:bg-stone-100 border border-stone-100'}`}
                >
                  <img src={user.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <span className={`font-medium ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'createGroup' && (
          <div className="h-full flex flex-col p-4">
            <input 
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={language === 'ar' ? 'اسم المجموعة...' : language === 'en' ? 'Group name...' : 'ناوی گرووپ...'}
              className={`rounded-xl px-4 py-3 mb-4 focus:outline-none ${theme === 'night' ? 'bg-[#2a3942] text-white' : 'bg-stone-100 text-stone-900 border border-stone-200'}`}
            />
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث عن أعضاء...' : language === 'en' ? 'Search for members...' : 'گەڕان بۆ ئەندامان...'}
                className={`flex-1 rounded-xl px-4 py-2 focus:outline-none ${theme === 'night' ? 'bg-[#2a3942] text-white' : 'bg-stone-100 text-stone-900 border border-stone-200'}`}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="bg-olive text-gold p-2 rounded-xl">
                <Search className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {searchResults.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => {
                    if (selectedUsers.includes(user.id)) {
                      setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                    } else {
                      setSelectedUsers([...selectedUsers, user.id]);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedUsers.includes(user.id) 
                      ? 'bg-olive/20 border border-olive/50' 
                      : (theme === 'night' ? 'bg-[#202c33] hover:bg-[#2a3942]' : 'bg-stone-50 hover:bg-stone-100 border border-stone-100')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={user.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <span className={`font-medium ${theme === 'night' ? 'text-white' : 'text-stone-900'}`}>{user.name}</span>
                  </div>
                  {selectedUsers.includes(user.id) && <CheckCheck className="w-5 h-5 text-gold" />}
                </div>
              ))}
            </div>
            <button 
              onClick={createGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
              className="w-full bg-olive text-gold py-3 rounded-xl font-bold disabled:opacity-50 transition-opacity"
            >
              {language === 'ar' ? 'إنشاء المجموعة' : language === 'en' ? 'Create Group' : 'دروستکردنی گرووپ'}
            </button>
          </div>
        )}

        {view === 'chat' && (
          <div className={`flex flex-col h-full ${wallpaper ? 'bg-cover bg-center' : (theme === 'night' ? 'bg-[#0b141a]' : 'bg-[#efeae2]')}`} style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : undefined }}>
            
            {showChatSearch && (
              <div className={`p-2 border-b ${theme === 'night' ? 'bg-[#202c33] border-white/5' : 'bg-white border-stone-200'}`}>
                <input 
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث في الدردشة...' : language === 'en' ? 'Search in chat...' : 'گەڕان لە چاتدا...'}
                  className={`w-full rounded-xl px-4 py-2 text-sm focus:outline-none ${theme === 'night' ? 'bg-[#2a3942] text-white' : 'bg-stone-100 text-stone-900'}`}
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" onScroll={handleScroll}>
              {messages.filter(m => !chatSearchQuery || m.content?.includes(chatSearchQuery)).map((msg, index) => {
                const isMe = msg.senderId === communityUser.id;
                const showDate = index === 0 || new Date(msg.createdAt?.seconds * 1000).toDateString() !== new Date(messages[index - 1]?.createdAt?.seconds * 1000).toDateString();
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && msg.createdAt && (
                      <div className="flex justify-center my-4">
                        <span className={`text-[10px] px-3 py-1 rounded-lg ${theme === 'night' ? 'bg-[#202c33] text-[#8696a0]' : 'bg-white/80 text-stone-500 shadow-sm'}`}>
                          {new Date(msg.createdAt.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-start' : 'justify-end'} group relative`}>
                      {!isMe && (
                        <img 
                          src={msg.senderPhoto} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover ml-2 mt-auto cursor-pointer" 
                          onClick={() => setShowProfile({ name: msg.senderName, photoUrl: msg.senderPhoto, id: msg.senderId })}
                        />
                      )}
                      
                      <div className={`relative max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                        isMe 
                          ? 'bg-[#005c4b] text-white rounded-tr-none' 
                          : `${theme === 'night' ? 'bg-[#202c33] text-white' : 'bg-white text-stone-900'} rounded-tl-none`
                      }`}>
                        {!isMe && <p className="text-[10px] text-gold font-bold mb-1">{msg.senderName}</p>}
                        
                        {msg.replyTo && (
                          <div className={`text-xs p-2 mb-2 rounded-lg border-r-4 border-gold ${isMe ? 'bg-black/20' : 'bg-black/5'}`}>
                            <p className="font-bold text-gold">{msg.replyTo.senderName}</p>
                            <p className="truncate opacity-80">{msg.replyTo.content}</p>
                          </div>
                        )}

                        {msg.mediaUrl && (
                          <div className="mt-1 mb-2">
                            {msg.mediaType === 'image' && (
                              <img src={msg.mediaUrl} alt="Attachment" className="rounded-lg max-w-full h-auto max-h-[200px] object-contain cursor-pointer" onClick={() => window.open(msg.mediaUrl)} />
                            )}
                            {msg.mediaType === 'video' && (
                              <video src={msg.mediaUrl} controls className="rounded-lg max-w-full h-auto max-h-[200px]" />
                            )}
                            {msg.mediaType === 'audio' && (
                              <audio src={msg.mediaUrl} controls className="max-w-[200px] h-10" />
                            )}
                            {msg.mediaType === 'document' && (
                              <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gold underline text-sm">
                                <Paperclip className="w-4 h-4" /> {language === 'ar' ? 'ملف مرفق' : 'فایلی هاوپێچ'}
                              </a>
                            )}
                          </div>
                        )}
                        <p className={`${textSize === 'small' ? 'text-xs' : textSize === 'large' ? 'text-base' : 'text-sm'} leading-relaxed whitespace-pre-wrap ${msg.isDeleted ? 'italic opacity-60' : ''}`}>{msg.content}</p>
                        
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className={`text-[9px] ${isMe ? 'text-white/70' : (theme === 'night' ? 'text-[#8696a0]' : 'text-stone-400')}`}>
                            {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </span>
                          {isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                        </div>

                        {/* Message Actions Menu */}
                        {!msg.isDeleted && (
                          <div className={`absolute top-1 ${isMe ? '-right-8' : '-left-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                            <button onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)} className="p-1 bg-black/20 rounded-full text-white hover:bg-black/40">
                              <ChevronRight className="w-4 h-4 rotate-90" />
                            </button>
                            {activeMessageId === msg.id && (
                              <div className={`absolute top-6 ${isMe ? 'right-0' : 'left-0'} bg-white text-black text-xs rounded-lg shadow-xl overflow-hidden z-50 w-24`}>
                                <button onClick={() => { setReplyingTo(msg); setActiveMessageId(null); }} className="w-full text-right px-3 py-2 hover:bg-stone-100">{language === 'ar' ? 'رد' : 'وەڵام'}</button>
                                <button onClick={() => copyMessage(msg.content)} className="w-full text-right px-3 py-2 hover:bg-stone-100">{language === 'ar' ? 'نسخ' : 'کۆپی'}</button>
                                {isMe && <button onClick={() => deleteMessage(msg.id)} className="w-full text-right px-3 py-2 text-red-500 hover:bg-stone-100">{language === 'ar' ? 'حذف' : 'سڕینەوە'}</button>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            {showScrollBottom && (
              <button 
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute bottom-20 right-4 w-10 h-10 bg-olive text-gold rounded-full shadow-lg flex items-center justify-center z-40"
              >
                <ChevronRight className="w-6 h-6 rotate-90" />
              </button>
            )}

            <div className={`flex flex-col ${theme === 'night' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
              {replyingTo && (
                <div className="p-2 px-4 border-b border-black/10 flex justify-between items-center bg-black/5">
                  <div className="border-r-4 border-gold pr-3">
                    <p className="text-xs font-bold text-gold">{replyingTo.senderName}</p>
                    <p className="text-xs truncate max-w-[200px] opacity-80">{replyingTo.content}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
                </div>
              )}

              <div className="p-2 px-4 flex flex-col gap-2">
                {mediaPreview && (
                  <div className="relative self-start mb-2 bg-black/10 p-2 rounded-xl">
                    <button onClick={clearMedia} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10">
                      <X className="w-4 h-4" />
                    </button>
                    {mediaType === 'image' && <img src={mediaPreview} alt="Preview" className="h-20 rounded-lg object-cover" />}
                    {mediaType === 'video' && <video src={mediaPreview} className="h-20 rounded-lg object-cover" />}
                    {mediaType === 'audio' && <audio src={mediaPreview} controls className="h-10" />}
                    {mediaType === 'document' && <div className="h-20 w-20 flex items-center justify-center bg-white rounded-lg"><Paperclip className="w-8 h-8 text-stone-400" /></div>}
                  </div>
                )}
                
                <div className="flex items-center gap-3 w-full">
                  {isRecording ? (
                    <div className="flex-1 flex items-center gap-3 bg-red-500/10 text-red-500 rounded-xl px-4 py-2.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                      <span className="flex-1 text-sm">{language === 'ar' ? 'جاري التسجيل...' : 'تۆمارکردن...'}</span>
                      <button onClick={stopRecording} className="p-1 hover:bg-red-500/20 rounded-full">
                        <Square className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="cursor-pointer p-2 hover:bg-black/5 rounded-full transition-colors">
                        <input type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMediaFile(file);
                            setMediaPreview(URL.createObjectURL(file));
                            setMediaType(file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document');
                          }
                        }} />
                        <Paperclip className={`w-6 h-6 ${theme === 'night' ? 'text-[#8696a0]' : 'text-stone-500'}`} />
                      </label>
                      <button onClick={startRecording} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <Mic className={`w-6 h-6 ${theme === 'night' ? 'text-[#8696a0]' : 'text-stone-500'}`} />
                      </button>
                      <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={language === 'ar' ? 'اكتب رسالة' : 'نامەیەک بنووسە'}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none ${theme === 'night' ? 'bg-[#2a3942] text-white' : 'bg-white text-stone-900 border border-stone-200'}`}
                      />
                    </>
                  )}
                  <button 
                    onClick={sendMessage}
                    disabled={isSending || (!newMessage.trim() && !mediaFile)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      (newMessage.trim() || mediaFile) && !isSending ? 'bg-olive text-gold' : `bg-transparent ${theme === 'night' ? 'text-[#8696a0]' : 'text-stone-400'}`
                    }`}
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowProfile(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <img src={showProfile.photoUrl} alt="Profile" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gold" />
            <h2 className="text-2xl font-bold text-stone-900 mb-1">{showProfile.name}</h2>
            <p className="text-stone-500 mb-6">{language === 'ar' ? 'عضو في المجتمع' : 'ئەندامی کۆمەڵگە'}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => { setShowProfile(null); startPrivateChat(showProfile); }}
                className="bg-olive text-gold px-6 py-2 rounded-full font-bold hover:bg-olive/90"
              >
                {language === 'ar' ? 'مراسلة' : 'نامە ناردن'}
              </button>
              <button onClick={() => setShowProfile(null)} className="bg-stone-200 text-stone-700 px-6 py-2 rounded-full font-bold hover:bg-stone-300">
                {language === 'ar' ? 'إغلاق' : 'داخستن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Info Modal */}
      {showGroupInfo && activeChat && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowGroupInfo(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-stone-900 mb-4 text-center">{getChatName(activeChat)}</h2>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              <p className="text-sm font-bold text-stone-500">{language === 'ar' ? 'الأعضاء' : 'ئەندامەکان'}</p>
              {activeChat.participants?.map((pid: string) => (
                <div key={pid} className="flex items-center gap-3 p-2 bg-stone-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-olive/20 flex items-center justify-center text-olive font-bold text-xs">
                    {pid === communityUser.id ? (language === 'ar' ? 'أنت' : 'تۆ') : 'U'}
                  </div>
                  <span className="text-sm font-medium text-stone-800">{pid === communityUser.id ? (language === 'ar' ? 'أنت' : 'تۆ') : (activeChat.participantNames?.[pid] || 'Member')}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowGroupInfo(false)} className="w-full bg-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold hover:bg-stone-300">
              {language === 'ar' ? 'إغلاق' : 'داخستن'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
