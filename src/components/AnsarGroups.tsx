import React, { useEffect, useState } from 'react';
import { MessageCircle, ExternalLink, ChevronRight, ChevronLeft, Users, Send, Loader2, Play, Video, Facebook, Plus, Trash2, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeFetchText } from '../utils/fetchUtils';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface TelegramPost {
  id: string;
  postId: string | null;
  img: string;
  text: string;
  cleanText?: string;
  date: string;
  url: string | null;
  isTikTok?: boolean;
}

export const AnsarGroups = ({ theme, language, onBackToHome }: { theme: 'night' | 'white' | 'cream', language: 'ar' | 'ku' | 'en', onBackToHome?: () => void }) => {
  const [viewingGroup, setViewingGroup] = useState<string | null>(null);
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);
  const { currentUser } = useUser();
  const [customGroups, setCustomGroups] = useState<any[]>([]);
  const [hiddenGroups, setHiddenGroups] = useState<string[]>([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ id: '', platform: 'telegram', titleAr: '', titleKu: '', titleEn: '', descriptionAr: '', descriptionKu: '', descriptionEn: '', url: '', videoUrl: '', language: 'all' });

  const getTelegramId = (input: string) => {
    if (!input) return '';
    let id = input.trim().replace(/^@/, '');
    if (id.includes('t.me/')) {
      const parts = id.split('/');
      id = parts[parts.length - 1];
      if (!id && parts.length > 1) {
        id = parts[parts.length - 2];
      }
      // Remove query params if any
      id = id.split('?')[0];
    }
    return id;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/shorts/')) {
      const id = url.split('/shorts/')[1]?.split(/[?#]/)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const defaultGroupsAr = [
    {
      id: 'ANSARALMHDY313',
      type: 'channel',
      titleAr: 'قناة أنصار المهدي (العربية)',
      titleKu: 'کەناڵی سەرخەرانی مەهدی (عەرەبی)',
      titleEn: 'Ansar Al-Mahdi Channel (Arabic)',
      descriptionAr: 'تابع آخر الأخبار والمستجدات والبيانات الرسمية باللغة العربية.',
      descriptionKu: 'دوایین هەواڵ و بڵاوکراوە فەرمییەکان بە زمانی عەرەبی لێرە ببینە.',
      descriptionEn: 'Follow the latest news, updates, and official statements in Arabic.',
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'friends_of_imam_mahdi313',
      platform: 'tiktok',
      titleAr: 'أصدقاء الإمام المهدي (تيك توك)',
      titleKu: 'هاوڕێیانی ئیمام مەهدی (تیک تۆک)',
      titleEn: 'Friends of Imam Mahdi (TikTok)',
      descriptionAr: 'تابعوا مقاطع الفيديو القصيرة والمحتوى الهادف على تيك توك.',
      descriptionKu: 'بینەری کورتە ڤیدیۆ و ناوەڕۆکە بەسوودەکانمان بن لە تیک تۆک.',
      descriptionEn: 'Follow short videos and meaningful content on TikTok.',
      icon: Video,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      url: 'https://www.tiktok.com/@friends_of_imam_mahdi313'
    }
  ];
  
  const defaultGroupsEn = [
    {
      id: 'Ansar_Al_Mahdi_Movement_eng',
      type: 'channel',
      titleAr: 'قناة أنصار المهدي (الإنجليزية)',
      titleKu: 'کەناڵی سەرخەرانی مەهدی (ئینگلیزی)',
      titleEn: 'Ansar Al-Mahdi Channel (English)',
      descriptionAr: 'تابع آخر الأخبار والمستجدات والبيانات الرسمية باللغة الإنجليزية.',
      descriptionKu: 'دوایین هەواڵ و بڵاوکراوە فەرمییەکان بە زمانی ئینگلیزی لێرە ببینە.',
      descriptionEn: 'Follow the latest news, updates, and official statements in English.',
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'AnsarAlMahdiMovement',
      type: 'group',
      titleAr: 'مجموعة أنصار المهدي (الإنجليزية)',
      titleKu: 'گروپی سەرخەرانی مەهدی (ئینگلیزی)',
      titleEn: 'Ansar Al-Mahdi Group Chat (English)',
      descriptionAr: 'انضم إلى مجموعة النقاش باللغة الإنجليزية.',
      descriptionKu: 'بەشداربە لە گروپی گفتوگۆ بە زمانی ئینگلیزی.',
      descriptionEn: 'Join the discussion group in English.',
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    }
  ];
  
  const defaultGroupsKu = [
    {
      id: 'sarxharaneemammahde313',
      type: 'channel',
      titleAr: 'قناة أنصار المهدي الكردية',
      titleKu: 'کەناڵی سەرخەرانی مەهدی (کوردی)',
      titleEn: 'Ansar Al-Mahdi Kurdish Channel',
      descriptionAr: 'تابع آخر الأخبار والمستجدات والبيانات الرسمية باللغة الكردية.',
      descriptionKu: 'دوایین هەواڵ و بڵاوکراوە فەرمییەکان بە زمانی کوردی لێرە ببینە.',
      descriptionEn: 'Follow the latest news, updates, and official statements in Kurdish.',
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'sarxaranemahde313',
      type: 'channel',
      titleAr: 'قناة أنصار المهدي (الاحتياطية)',
      titleKu: 'کەناڵی سەرخەرانی مەهدی (یەدەگ)',
      titleEn: 'Ansar Al-Mahdi (Backup Channel)',
      descriptionAr: 'القناة الاحتياطية لأنصار المهدي باللغة الكردية.',
      descriptionKu: 'کەناڵی یەدەگی سەرخەرانی مەهدی بە زمانی کوردی.',
      descriptionEn: 'Backup channel for Ansar Al-Mahdi in Kurdish.',
      icon: Send,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      id: 'friends_of_imam_mahdi313',
      platform: 'tiktok',
      titleAr: 'أصدقاء الإمام المهدي (تيك توك)',
      titleKu: 'هاوڕێیانی ئیمام مەهدی (تیک تۆک)',
      titleEn: 'Friends of Imam Mahdi (TikTok)',
      descriptionAr: 'تابعوا مقاطع الفيديو القصيرة والمحتوى الهادف على تيك توك.',
      descriptionKu: 'بینەری کورتە ڤیدیۆ و ناوەڕۆکە بەسوودەکانمان بن لە تیک تۆک.',
      descriptionEn: 'Follow short videos and meaningful content on TikTok.',
      icon: Video,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      url: 'https://www.tiktok.com/@friends_of_imam_mahdi313'
    },
    {
      id: 'facebook_group',
      platform: 'facebook',
      titleAr: 'مجموعة فيسبوك أنصار المهدي',
      titleKu: 'گروپی فەیسبووکی سەرخەرانی مەهدی',
      titleEn: 'Ansar Al-Mahdi Facebook Group',
      descriptionAr: 'انضم إلى مجتمعنا على فيسبوك للنقاش والتفاعل.',
      descriptionKu: 'ببەرە ئەندام لە کۆمەڵگاکەمان لە فەیسبووک بۆ گفتوگۆ و کارلێک.',
      descriptionEn: 'Join our Facebook community for discussion and interaction.',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
      borderColor: 'border-blue-600/20',
      url: 'https://www.facebook.com/share/1Gp5x6WeNg/'
    }
  ];

  useEffect(() => {
    const q = query(collection(db, 'AnsarGroups'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setCustomGroups(groupsData);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'Settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setHiddenGroups(docSnap.data().hiddenAnsarGroups || []);
      }
    });
    return unsubscribe;
  }, []);

  const baseGroups = language === 'ar' ? defaultGroupsAr : language === 'en' ? defaultGroupsEn : defaultGroupsKu;
  
  const allGroups = [
    ...baseGroups.filter(g => !hiddenGroups.includes(g.id)),
    ...customGroups.filter(g => g.language === 'all' || g.language === language)
  ];

  const displayGroups = allGroups.map(g => ({
    ...g,
    icon: g.platform === 'tiktok' ? Video : g.platform === 'facebook' ? Facebook : (g.platform === 'video_telegram' || g.platform === 'youtube') ? Youtube : (g.icon || MessageCircle),
    color: g.color || 'text-blue-500',
    bgColor: g.bgColor || 'bg-blue-500/10',
    borderColor: g.borderColor || 'border-blue-500/20'
  }));

  const fetchPosts = async (groupId: string) => {
    const group = displayGroups.find(g => g.id === groupId);
    setLoadingPosts(true);
    setPosts([]);
    
    if (group?.platform === 'tiktok' || group?.platform === 'facebook' || group?.platform === 'youtube') {
      try {
        if (group?.platform === 'facebook' || group?.platform === 'youtube') {
          setLoadingPosts(false);
          return;
        }
        const url = `https://www.tiktok.com/@${groupId}`;
        let html = '';
        
        const tiktokProxies = [
          `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
          `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];

        for (const proxy of tiktokProxies) {
          try {
            const response = await fetch(proxy);
            if (!response.ok) continue;
            const data = proxy.includes('allorigins') ? (await response.json()).contents : await response.text();
            if (data && data.includes('webapp.user-detail')) {
              html = data;
              break;
            }
          } catch (e) {
            console.warn("TikTok proxy failed");
          }
        }

        const tiktokPosts: TelegramPost[] = [];
        
        // Try to extract data from TikTok's JSON hydration state
        try {
          const jsonDataMatch = html.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/) || 
                               html.match(/<script id="__UNIVERSAL_DATA_FOR_REAHT_HYDRATION__" type="application\/json">(.*?)<\/script>/);
          
          if (jsonDataMatch) {
            const jsonData = JSON.parse(jsonDataMatch[1]);
            // TikTok structure varies, try common paths
            const itemList = jsonData?.ItemModule || jsonData?.defaultScope?.webapp?.userVideo?.itemModule || {};
            const items = Object.values(itemList);
            
            items.forEach((item: any) => {
              if (item.id && (item.video || item.cover)) {
                tiktokPosts.push({
                  id: item.id,
                  postId: item.id,
                  img: item.video?.cover || item.cover || '',
                  text: item.desc || '',
                  cleanText: item.desc || (language === 'ar' ? 'فيديو تيك توك' : 'ڤیدیۆیەکی تیک تۆک'),
                  date: item.createTime ? new Date(item.createTime * 1000).toLocaleDateString() : '',
                  url: `https://www.tiktok.com/@${groupId}/video/${item.id}`,
                  isTikTok: true
                });
              }
            });
          }
        } catch (e) {
          console.warn("JSON parsing failed, falling back to regex");
        }

        // Fallback to regex if JSON parsing didn't yield results
        if (tiktokPosts.length === 0) {
          const videoIds: string[] = [];
          const regex = /"id":"(\d{18,20})"/g;
          let match;
          while ((match = regex.exec(html)) !== null) {
            if (!videoIds.includes(match[1])) {
              videoIds.push(match[1]);
            }
          }

          videoIds.slice(0, 12).forEach(id => {
            tiktokPosts.push({
              id: id,
              postId: id,
              img: `https://www.tiktok.com/api/img/?itemId=${id}&location=0`, // Attempt to get thumbnail
              text: '',
              cleanText: language === 'ar' ? 'فيديو تيك توك' : 'ڤیدیۆیەکی تیک تۆک',
              date: '',
              url: `https://www.tiktok.com/@${groupId}/video/${id}`,
              isTikTok: true
            });
          });
        }

        if (tiktokPosts.length > 0) {
          setPosts(tiktokPosts);
          setPlayingPostId(tiktokPosts[0].id);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("TikTok fetch error:", error);
      } finally {
        setLoadingPosts(false);
      }
      return;
    }

    try {
      // Try with /s/ first (standard for public channels)
      const url = `https://t.me/s/${groupId}`;
      let htmlText = '';
      
      const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      ];

      for (let i = 0; i < proxies.length; i++) {
        try {
          const response = await fetch(proxies[i]);
          if (!response.ok) continue;
          
          if (proxies[i].includes('allorigins')) {
            const data = await response.json();
            htmlText = data.contents;
          } else {
            htmlText = await response.text();
          }

          if (htmlText && htmlText.includes('tgme_widget_message')) {
            break;
          }
        } catch (e) {
          console.warn(`Proxy ${i + 1} failed`);
        }
      }

      // If still no luck, try without /s/ as a fallback
      if (!htmlText || !htmlText.includes('tgme_widget_message')) {
        const fallbackUrl = `https://t.me/${groupId}`;
        try {
          const fbRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(fallbackUrl)}`);
          if (fbRes.ok) htmlText = await fbRes.text();
        } catch (e) {
          console.warn("Fallback fetch failed");
        }
      }

      if (!htmlText || htmlText.length < 200) {
        throw new Error("Empty response");
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      let postElements = Array.from(doc.querySelectorAll('.tgme_widget_message'));
      
      // If no standard messages, look for any content that might be a message
      if (postElements.length === 0) {
        postElements = Array.from(doc.querySelectorAll('.tgme_channel_history .tgme_widget_message, .js-widget_message'));
      }

      if (postElements.length === 0) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }

      const rawPosts: TelegramPost[] = [];
      const seenPostIds = new Set<string>();

      postElements.forEach((el) => {
        const postId = el.getAttribute('data-post');
        if (postId && seenPostIds.has(postId)) return;
        if (postId) seenPostIds.add(postId);

        const textEl = el.querySelector('.tgme_widget_message_text, .js-message_text');
        const cleanText = textEl ? (textEl as HTMLElement).innerText.trim() : '';
        const mediaWraps = Array.from(el.querySelectorAll('.tgme_widget_message_photo_wrap, .tgme_widget_message_photo, video, .tgme_widget_message_video_player, .js-message_photo'));
        
        const dateEl = el.querySelector('.time, .js-message_date');
        const linkEl = el.querySelector('.tgme_widget_message_date, .js-message_date_link');

        const mediaUrls = new Set<string>();
        mediaWraps.forEach(mediaEl => {
          if (mediaEl.tagName === 'VIDEO') {
            const src = mediaEl.getAttribute('src') || mediaEl.getAttribute('data-src') || mediaEl.getAttribute('poster');
            if (src) mediaUrls.add(src);
          } else {
            const videoPlayer = el.querySelector('.tgme_widget_message_video_player');
            if (videoPlayer) {
                const video = videoPlayer.querySelector('video');
                const poster = videoPlayer.getAttribute('style')?.match(/background-image:url\(['"]?(.*?)['"]?\)/);
                if (video) {
                    const src = video.getAttribute('src') || video.getAttribute('data-src');
                    if (src) mediaUrls.add(src);
                    const sources = video.querySelectorAll('source');
                    sources.forEach(s => {
                        const sSrc = s.getAttribute('src');
                        if (sSrc) mediaUrls.add(sSrc);
                    });
                } else if (poster) {
                    mediaUrls.add(poster[1]);
                }
            }
            
            const style = mediaEl.getAttribute('style');
            if (style) {
              const match = style.match(/url\(['"]?(.*?)['"]?\)/);
              if (match) mediaUrls.add(match[1]);
            }
          }
        });

        if (cleanText || mediaUrls.size > 0) {
          rawPosts.push({
            id: Math.random().toString(36).substr(2, 9),
            postId: postId,
            img: Array.from(mediaUrls).join(','),
            text: textEl ? textEl.innerHTML : '',
            cleanText: cleanText,
            date: dateEl ? (dateEl as HTMLElement).innerText : '',
            url: linkEl ? linkEl.getAttribute('href') : null,
          });
        }
      });

      const finalGroupedPosts: TelegramPost[] = [];
      for (let i = 0; i < rawPosts.length; i++) {
        const current = rawPosts[i];
        if (i < rawPosts.length - 1) {
            const next = rawPosts[i+1];
            if (current.cleanText && !current.img && next.img && !next.cleanText) {
                current.img = next.img;
                finalGroupedPosts.push(current);
                i++;
                continue;
            } else if (current.img && !current.cleanText && next.cleanText && !next.img) {
                next.img = current.img;
                finalGroupedPosts.push(next);
                i++;
                continue;
            }
        }
        finalGroupedPosts.push(current);
      }

      const result = finalGroupedPosts.reverse().slice(0, 20);
      setPosts(result);
      if (result.length > 0) {
        setPlayingPostId(result[0].id);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (viewingGroup) {
      fetchPosts(viewingGroup);
    }
  }, [viewingGroup]);

  if (viewingGroup) {
    const group = displayGroups.find(g => g.id === viewingGroup);
    const featuredPost = posts.find(p => p.id === playingPostId) || posts[0];
    const otherPosts = posts.filter(p => p.id !== featuredPost?.id);

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col h-screen"
        id="ansargroups-container"
      >
        <div className={`p-4 flex items-center gap-3 border-b sticky top-0 z-10 ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'}`}>
          <button onClick={() => setViewingGroup(null)} className={`p-2 rounded-full transition-colors ${theme === 'night' ? 'text-gold hover:bg-gold/10' : 'text-olive hover:bg-olive/10'}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h3 className={`font-bold text-sm truncate ${theme === 'night' ? 'text-white' : 'text-slate-800'}`}>
              {language === 'ar' ? group?.titleAr : language === 'en' ? group?.titleEn : group?.titleKu}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={group?.platform === 'video_telegram' ? group.url : `https://t.me/${viewingGroup}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1f6feb] text-white rounded-full text-xs font-bold shadow-lg hover:bg-blue-600 transition-colors"
            >
              <Send className="w-3 h-3" />
              {language === 'ar' ? 'انضمام' : language === 'en' ? 'Join' : 'بەشداربە'}
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
          {(group?.platform === 'video_telegram' || group?.platform === 'youtube') && group.videoUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-stone-200">
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={group.videoUrl}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Featured Video"
                />
              </div>
              <div className="p-4 bg-white text-center">
                <a 
                  href={group.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 text-white font-bold rounded-full shadow hover:bg-blue-600 transition-all"
                >
                  {group.platform === 'youtube' ? <Youtube className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {group.platform === 'youtube' 
                    ? (language === 'ar' ? 'فتح في يوتيوب' : language === 'en' ? 'Open in YouTube' : 'لە یوتیوب بیکەرەوە')
                    : (language === 'ar' ? 'الانضمام إلى القناة' : language === 'en' ? 'Join Channel' : 'بەشداریکردن لە کەناڵ')}
                </a>
              </div>
            </div>
          )}
          {group?.platform === 'facebook' ? (
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 min-h-[500px] rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-50 relative">
                <iframe 
                  src={group.url} 
                  className="w-full h-full border-0"
                  title="Facebook Preview"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 p-6 text-center pointer-events-none">
                  <Facebook className="w-12 h-12 text-blue-600 mb-4 opacity-20" />
                  <p className="text-xs text-slate-400 max-w-[200px]">
                    {language === 'ar' 
                      ? 'بسبب سياسة خصوصية فيسبوك، قد لا يظهر المحتوى هنا مباشرة. يرجى استخدام الزر أدناه.' 
                      : 'بەهۆی سیاسەتی تایبەتمەندی فەیسبووک، ڕەنگە ناوەڕۆکەکە لێرە ڕاستەوخۆ دیار نەبێت. تکایە دوگمەکەی خوارەوە بەکاربهێنە.'}
                  </p>
                </div>
              </div>
              <div className="p-6 text-center space-y-4">
                <a 
                  href={group.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Facebook className="w-5 h-5" />
                  {language === 'ar' ? 'فتح في فيسبوك' : language === 'en' ? 'Open in Facebook' : 'لە فەیسبووک بیکەرەوە'}
                </a>
              </div>
            </div>
          ) : group?.platform === 'tiktok' ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : posts.length > 0 ? (
            <>
              {/* Featured Post (Large) */}
              {featuredPost && (
                <FeaturedPostView key={featuredPost.id} post={featuredPost} theme={theme} language={language} />
              )}

              {/* Other Posts Grid */}
              <div className="grid grid-cols-2 gap-3">
                {otherPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`block rounded-2xl overflow-hidden border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} cursor-pointer transition-transform hover:scale-[1.02] shadow-sm`}
                    onClick={() => {
                      setPlayingPostId(post.id);
                      document.getElementById('ansargroups-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                      {post.isTikTok ? (
                        <div className="w-full h-full flex items-center justify-center bg-stone-900">
                          <Video className="w-8 h-8 text-pink-500 opacity-50" />
                        </div>
                      ) : post.img ? (
                        <img 
                          src={post.img.split(',')[0]} 
                          alt="Post"
                          className="w-full h-full object-cover opacity-80"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="p-2 text-center">
                          <p className="text-white text-[8px] font-bold line-clamp-2 opacity-60">
                            {post.cleanText}
                          </p>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-8 h-8 bg-gold/80 rounded-full flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className={`font-bold text-[11px] mb-1 line-clamp-2 leading-snug ${theme === 'night' ? 'text-white' : 'text-black'}`}>
                        {post.cleanText || (language === 'ar' ? 'منشور' : 'بڵاوکراوە')}
                      </h3>
                      <p className="text-[9px] text-slate-500">{post.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 min-h-[500px] rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-50">
                <iframe 
                  src={`https://t.me/s/${viewingGroup}?embed=1`} 
                  className="w-full h-full border-0"
                  title="Telegram Preview"
                />
              </div>
              <div className="p-6 text-center space-y-4">
                <p className="text-sm text-slate-500">
                  {language === 'ar' 
                    ? 'إذا لم يظهر المحتوى أعلاه، يمكنك الانضمام مباشرة:' 
                    : language === 'en'
                    ? 'If the content above does not appear, you can join directly:'
                    : 'ئەگەر ناوەڕۆک لە سەرەوە دیار نەبوو، دەتوانیت ڕاستەوخۆ بەشدار بیت:'}
                </p>
                <a 
                  href={`https://t.me/${viewingGroup}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-black font-bold rounded-full shadow-lg hover:bg-gold/80 transition-all active:scale-95"
                >
                  <Send className="w-5 h-5" />
                  {language === 'ar' ? 'فتح في تليجرام' : language === 'en' ? 'Open in Telegram' : 'لە تێلیگرام بیکەرەوە'}
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-gold">
                {language === 'ar' ? 'مجموعات أنصار المهدي' : language === 'en' ? 'Ansar Al-Mahdi Groups' : 'کۆمەڵەکانی سەرخەرانی مەهدی'}
              </h2>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setIsAddingGroup(!isAddingGroup)}
            className="p-2 bg-gold/10 text-gold rounded-full hover:bg-gold/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {currentUser?.role === 'admin' && isAddingGroup && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border ${theme === 'night' ? 'bg-[#151b23] border-[#1f242d]' : 'bg-stone-50 border-stone-200'} space-y-4`}
        >
          <h3 className={`font-bold ${theme === 'night' ? 'text-white' : 'text-black'}`}>Add New Group</h3>
          
          <select
            value={newGroup.platform}
            onChange={(e) => setNewGroup({...newGroup, platform: e.target.value})}
            className={`w-full p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
          >
            <option value="telegram">Telegram Channel</option>
            <option value="video_telegram">Video + Telegram Link</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
          </select>

          <select
            value={newGroup.language}
            onChange={(e) => setNewGroup({...newGroup, language: e.target.value})}
            className={`w-full p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
          >
            <option value="all">All Languages</option>
            <option value="ar">Arabic Only</option>
            <option value="ku">Kurdish Only</option>
            <option value="en">English Only</option>
          </select>

          <input
            type="text"
            placeholder="ID or Link (e.g., channel_username or https://t.me/...)"
            value={newGroup.id}
            onChange={(e) => setNewGroup({...newGroup, id: e.target.value})}
            className={`w-full p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
          />

          <input
            type="text"
            placeholder="Title (Arabic)"
            value={newGroup.titleAr}
            onChange={(e) => setNewGroup({...newGroup, titleAr: e.target.value})}
            className={`w-full p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
          />
          <input
            type="text"
            placeholder="Title (Kurdish)"
            value={newGroup.titleKu}
            onChange={(e) => setNewGroup({...newGroup, titleKu: e.target.value})}
            className={`w-full p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
          />
          <input
            type="text"
            placeholder="Title (English)"
            value={newGroup.titleEn}
            onChange={(e) => setNewGroup({...newGroup, titleEn: e.target.value})}
            className={`w-full p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
          />

          {(newGroup.platform === 'tiktok' || newGroup.platform === 'facebook' || newGroup.platform === 'video_telegram' || newGroup.platform === 'youtube') && (
            <input
              type="text"
              placeholder={newGroup.platform === 'youtube' ? "YouTube URL (Channel or Video)" : "URL (e.g., https://t.me/... or https://facebook.com/...)"}
              value={newGroup.url}
              onChange={(e) => setNewGroup({...newGroup, url: e.target.value})}
              className={`w-full p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
            />
          )}

          {newGroup.platform === 'video_telegram' && (
            <input
              type="text"
              placeholder="YouTube Embed URL (e.g., https://www.youtube.com/embed/...)"
              value={newGroup.videoUrl}
              onChange={(e) => setNewGroup({...newGroup, videoUrl: e.target.value})}
              className={`w-full p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
            />
          )}

          <button
            onClick={async () => {
              if (!newGroup.id || !newGroup.titleAr) return;
              try {
                const groupToSave = { 
                  ...newGroup,
                  id: newGroup.platform === 'youtube' ? `yt-${Math.random().toString(36).substr(2, 5)}` : getTelegramId(newGroup.id)
                };
                if (groupToSave.platform === 'video_telegram' && groupToSave.videoUrl) {
                  groupToSave.videoUrl = getYouTubeEmbedUrl(groupToSave.videoUrl);
                }
                if (groupToSave.platform === 'youtube' && groupToSave.url) {
                  groupToSave.videoUrl = getYouTubeEmbedUrl(groupToSave.url);
                }
                await addDoc(collection(db, 'AnsarGroups'), groupToSave);
                setNewGroup({ id: '', platform: 'telegram', titleAr: '', titleKu: '', titleEn: '', descriptionAr: '', descriptionKu: '', descriptionEn: '', url: '', videoUrl: '', language: 'all' });
                setIsAddingGroup(false);
              } catch (error) {
                console.error("Error adding group:", error);
              }
            }}
            className="w-full p-3 bg-gold text-black font-bold rounded-xl hover:bg-gold/80 transition-colors"
          >
            Save Group
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {displayGroups.map((group) => (
          <motion.div 
            key={group.id} 
            className={`p-6 rounded-3xl border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} shadow-lg`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => setViewingGroup(group.id)}>
                <div className={`p-4 rounded-2xl ${group.bgColor || 'bg-blue-500/10'} ${group.color || 'text-blue-500'}`}>
                  {group.icon ? React.createElement(group.icon, { className: "w-8 h-8" }) : <MessageCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${theme === 'night' ? 'text-white' : 'text-slate-800'}`}>
                    {language === 'ar' ? group.titleAr : language === 'en' ? group.titleEn : group.titleKu}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'ar' ? group.descriptionAr : language === 'en' ? group.descriptionEn : group.descriptionKu}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewingGroup(group.id)}
                  className="flex flex-col items-center gap-1 p-2 bg-gold/10 text-gold rounded-xl hover:bg-gold/20 transition-colors"
                >
                  {group.platform === 'tiktok' ? <Video className="w-5 h-5" /> : group.platform === 'facebook' ? <Facebook className="w-5 h-5" /> : (group.platform === 'video_telegram' || group.platform === 'youtube') ? <Youtube className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  <span className="text-[10px] font-bold">
                    {group.platform === 'telegram' 
                      ? (language === 'ar' ? 'عرض' : language === 'en' ? 'View' : 'بینین')
                      : (language === 'ar' ? 'انضمام' : language === 'en' ? 'Join' : 'بەشداربە')}
                  </span>
                </button>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this group?')) {
                        if (group.docId) {
                          await deleteDoc(doc(db, 'AnsarGroups', group.docId));
                        } else {
                          await updateDoc(doc(db, 'Settings', 'main'), {
                            hiddenAnsarGroups: arrayUnion(group.id)
                          });
                        }
                      }
                    }}
                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const FeaturedPostView = ({ post, theme, language }: { post: TelegramPost, theme: string, language: 'ar' | 'ku' | 'en' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewText = post.cleanText || '';

  return (
    <div className={`block rounded-2xl overflow-hidden border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} shadow-xl mb-2`}>
      {/* Media Area */}
      <div className="relative w-full bg-black flex items-center justify-center overflow-hidden" style={{ height: post.isTikTok ? '500px' : '171.812px' }}>
        {post.isTikTok ? (
          <iframe 
            src={`https://www.tiktok.com/embed/v2/${post.postId}`} 
            className="w-full h-full border-0"
            allowFullScreen
            title="TikTok Video"
          />
        ) : post.img ? (
          post.img.split(',')[0].includes('.mp4') || post.img.split(',')[0].includes('video') ? (
            <video src={post.img.split(',')[0]} className="w-full h-full object-cover" controls />
          ) : (
            <img src={post.img.split(',')[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Post" style={{ height: '171.812px' }} />
          )
        ) : (
          <div className="p-8 text-center">
            <p className="text-white text-xl font-bold opacity-80">
              {previewText}
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 transition-all duration-300" style={{ minHeight: isExpanded ? 'auto' : '100px', height: isExpanded ? 'auto' : '100px', backgroundColor: '#000000' }}>
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm leading-relaxed line-clamp-2 text-stone-300">
                {previewText}
              </p>
              {previewText.length > 50 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="text-gold text-xs font-bold mt-2 flex items-center gap-1"
                >
                  {language === 'ar' ? 'إقرأ المزيد...' : language === 'en' ? 'Read more...' : 'زیاتر ببینە...'}
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pb-4"
            >
              {/* Show all media when expanded */}
              {post.img && !post.isTikTok && post.img.split(',').slice(1).map((mediaUrl, index) => (
                mediaUrl.includes('.mp4') || mediaUrl.includes('video') ? (
                  <video key={index} src={mediaUrl} className="w-full rounded-xl mb-3" controls />
                ) : (
                  <img key={index} src={mediaUrl} className="w-full rounded-xl mb-3" referrerPolicy="no-referrer" alt="Post" />
                )
              ))}
              <div 
                className="text-sm leading-relaxed text-stone-200" 
                dangerouslySetInnerHTML={{ __html: post.text || post.cleanText || '' }} 
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="text-gold text-xs font-bold mt-4"
              >
                {language === 'ar' ? 'إغلاق' : language === 'en' ? 'Close' : 'داخستن'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-stone-800/5 flex justify-between">
          <span>{post.date}</span>
          {post.isTikTok ? <Video className="w-3 h-3 opacity-30" /> : <MessageCircle className="w-3 h-3 opacity-30" />}
        </div>
      </div>
    </div>
  );
};
