import React, { useEffect, useState } from 'react';
import { ChevronRight, Send, Loader2, Play, Video, MessageCircle, Settings, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

interface TelegramPost {
  id: string;
  postId: string | null;
  img: string;
  text: string;
  cleanText?: string;
  date: string;
  url: string | null;
}

export const WorldNewsFeed = ({ theme, language, onBack }: { theme: 'night' | 'white' | 'cream', language: 'ar' | 'ku' | 'en', onBack: () => void }) => {
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);
  const { currentUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [customChannelId, setCustomChannelId] = useState('');
  const [appSettings, setAppSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'Settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setAppSettings(docSnap.data());
      }
    });
    return unsubscribe;
  }, []);

  const defaultChannelId = language === 'ar' ? 'News313Islam' : language === 'en' ? 'ANSARALMHDY313' : 'news7313';
  const channelId = appSettings?.[`worldNewsChannel_${language}`] || defaultChannelId;

  const saveChannelId = async () => {
    if (!customChannelId) return;
    try {
      await updateDoc(doc(db, 'Settings', 'main'), {
        [`worldNewsChannel_${language}`]: customChannelId.replace('@', '').replace('https://t.me/', '')
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving channel ID:", error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = `https://t.me/s/${channelId}`;
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

      if (!htmlText || htmlText.length < 200) {
        throw new Error("Empty response");
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      let postElements = Array.from(doc.querySelectorAll('.tgme_widget_message'));
      
      if (postElements.length === 0) {
        postElements = Array.from(doc.querySelectorAll('.tgme_channel_history .tgme_widget_message, .js-widget_message'));
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [language, channelId]);

  const featuredPost = posts.find(p => p.id === playingPostId) || posts[0];
  const otherPosts = posts.filter(p => p.id !== featuredPost?.id);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-screen bg-black"
    >
      <div className={`p-4 flex items-center gap-3 border-b sticky top-0 z-10 ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'}`}>
        <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme === 'night' ? 'text-gold hover:bg-gold/10' : 'text-olive hover:bg-olive/10'}`}>
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h3 className={`font-bold text-sm truncate ${theme === 'night' ? 'text-white' : 'text-slate-800'}`}>
            {language === 'ar' ? 'أخبار العالم' : language === 'en' ? 'World News' : 'هەواڵەکانی جیهان'}
          </h3>
        </div>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => { setIsEditing(!isEditing); setCustomChannelId(channelId); }}
            className={`p-2 rounded-full transition-colors ${theme === 'night' ? 'text-gold hover:bg-gold/10' : 'text-olive hover:bg-olive/10'}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
        <a 
          href={`https://t.me/${channelId}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1f6feb] text-white rounded-full text-xs font-bold shadow-lg hover:bg-blue-600 transition-colors"
        >
          <Send className="w-3 h-3" />
          {language === 'ar' ? 'انضمام' : language === 'en' ? 'Join' : 'بەشداربە'}
        </a>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {isEditing && currentUser?.role === 'admin' && (
          <div className={`p-4 rounded-2xl border ${theme === 'night' ? 'bg-[#151b23] border-[#1f242d]' : 'bg-stone-50 border-stone-200'} flex gap-2`}>
            <input
              type="text"
              value={customChannelId}
              onChange={(e) => setCustomChannelId(e.target.value)}
              placeholder="Telegram Channel ID (e.g., News313Islam)"
              className={`flex-1 p-2 rounded-xl border ${theme === 'night' ? 'bg-black border-stone-800 text-white' : 'bg-white border-stone-200 text-black'}`}
            />
            <button
              onClick={saveChannelId}
              className="px-4 py-2 bg-gold text-black font-bold rounded-xl hover:bg-gold/80 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <span className="text-xs text-slate-500">
              {language === 'ar' ? 'جاري تحميل الأخبار...' : language === 'en' ? 'Loading news...' : 'خەریکە هەواڵەکان باردەکرێن...'}
            </span>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className={`p-4 rounded-2xl mb-2 text-center border ${theme === 'night' ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
               <p className="text-xs font-bold text-gold whitespace-pre-line leading-relaxed">
                 {language === 'ar' ? 
                   'قناة #حركة_أنصار_المهدي\n#الجهاز_الإعلامي\n#الاخبار_العالمية' : 
                   language === 'en' ?
                   'Ansar Al-Mahdi Movement Channel\nMedia Department\nWorld News' :
                   'کەناڵی\n#بزووتنەوەی_سەرخەرانی_مەهدی\n#دەزگای_ڕاگەیاندن\n#هەواڵە_جیهانییەکان'
                 }
               </p>
            </div>
            {featuredPost && (
              <FeaturedPostView post={featuredPost} theme={theme} language={language} />
            )}

            <div className="grid grid-cols-2 gap-3">
              {otherPosts.map((post) => (
                <div
                  key={post.id}
                  className={`block rounded-2xl overflow-hidden border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} cursor-pointer transition-transform hover:scale-[1.02] shadow-sm`}
                  onClick={() => {
                    setPlayingPostId(post.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                    {post.img ? (
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
                      {post.cleanText || (language === 'ar' ? 'منشور' : language === 'en' ? 'Post' : 'بڵاوکراوە')}
                    </h3>
                    <p className="text-[9px] text-slate-500">{post.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500">
              {language === 'ar' ? 'لا توجد أخبار حالياً' : language === 'en' ? 'No news available' : 'هیچ هەواڵێک نییە لە ئێستادا'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FeaturedPostView = ({ post, theme, language }: { post: TelegramPost, theme: string, language: 'ar' | 'ku' | 'en' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewText = post.cleanText || '';

  return (
    <div className={`block rounded-2xl overflow-hidden border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} shadow-xl mb-2`}>
      <div className="relative w-full bg-black flex items-center justify-center overflow-hidden" style={{ height: '200px' }}>
        {post.img ? (
          post.img.split(',')[0].includes('.mp4') || post.img.split(',')[0].includes('video') ? (
            <video src={post.img.split(',')[0]} className="w-full h-full object-cover" controls />
          ) : (
            <img src={post.img.split(',')[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Post" />
          )
        ) : (
          <div className="p-8 text-center">
            <p className="text-white text-xl font-bold opacity-80">
              {previewText}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 transition-all duration-300" style={{ backgroundColor: theme === 'night' ? '#0b0e14' : '#ffffff' }}>
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div key="collapsed">
              <p className={`text-sm leading-relaxed line-clamp-3 ${theme === 'night' ? 'text-stone-300' : 'text-stone-700'}`}>
                {previewText}
              </p>
              {previewText.length > 100 && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="text-gold text-xs font-bold mt-2 flex items-center gap-1"
                >
                  {language === 'ar' ? 'إقرأ المزيد...' : language === 'en' ? 'Read more...' : 'زیاتر ببینە...'}
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {post.img && post.img.split(',').slice(1).map((mediaUrl, index) => (
                mediaUrl.includes('.mp4') || mediaUrl.includes('video') ? (
                  <video key={index} src={mediaUrl} className="w-full rounded-xl mb-3" controls />
                ) : (
                  <img key={index} src={mediaUrl} className="w-full rounded-xl mb-3" referrerPolicy="no-referrer" alt="Post" />
                )
              ))}
              <div 
                className={`text-sm leading-relaxed ${theme === 'night' ? 'text-stone-200' : 'text-stone-800'}`} 
                dangerouslySetInnerHTML={{ __html: post.text || post.cleanText || '' }} 
              />
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-gold text-xs font-bold mt-4"
              >
                {language === 'ar' ? 'إغلاق' : language === 'en' ? 'Close' : 'داخستن'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-stone-800/5 flex justify-between">
          <span>{post.date}</span>
          <MessageCircle className="w-3 h-3 opacity-30" />
        </div>
      </div>
    </div>
  );
};
