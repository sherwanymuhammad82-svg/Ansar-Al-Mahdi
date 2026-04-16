import React, { useEffect, useState } from 'react';
import { safeFetchText } from '../utils/fetchUtils';

interface TelegramPost {
  id: string;
  img: string;
  text: string;
  date: string;
  url: string | null;
  hasVideo: boolean;
  hasAudio: boolean;
}

export const TelegramFeedArabic = ({ theme }: { theme: 'night' | 'white' | 'cream' }) => {
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentMaxId, setCurrentMaxId] = useState<number | null>(null);

  const fetchTelegramPosts = async (beforeId: number | null = null) => {
    if (!beforeId) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = 'https://t.me/s/ANSARALMHDY313';
      if (beforeId) {
        url += `?before=${beforeId}`;
      }

      const response = await safeFetchText(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
      const htmlText = response;

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const postElements = Array.from(doc.querySelectorAll('.tgme_widget_message'));

      if (postElements.length === 0) {
        if (!beforeId) {
          setPosts([]);
        }
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const firstPost = postElements[0];
      const firstId = firstPost.getAttribute('data-post');
      let newMaxId = null;
      if (firstId) {
        newMaxId = parseInt(firstId.split('/').pop() || '0') - 1;
        setCurrentMaxId(newMaxId);
      }

      let groupedPosts: TelegramPost[] = [];

      for (let i = 0; i < postElements.length; i++) {
        const el = postElements[i];
        const textEl = el.querySelector('.tgme_widget_message_text');
        const cleanText = textEl ? (textEl as HTMLElement).innerText.trim() : '';

        if (cleanText.startsWith('بسم الله') || cleanText.startsWith('بسم الله الرحمن الرحيم')) {
          let imgUrl = '';

          if (i > 0) {
            const prevEl = postElements[i - 1];
            const prevImgWrap = prevEl.querySelector('.tgme_widget_message_photo_wrap, .tgme_widget_message_photo');

            if (prevImgWrap) {
              const style = prevImgWrap.getAttribute('style');
              if (style) {
                const match = style.match(/url\(['"]?(.*?)['"]?\)/);
                if (match) imgUrl = match[1];
              }
            }
          }

          const dateEl = el.querySelector('.time');
          const linkEl = el.querySelector('.tgme_widget_message_date');
          const hasVideo = el.querySelector('.tgme_widget_message_video_thumb, .tgme_widget_message_video');
          const hasAudio = el.querySelector('.tgme_widget_message_audio, .tgme_widget_message_voice');

          groupedPosts.push({
            id: Math.random().toString(36).substr(2, 9),
            img: imgUrl,
            text: textEl ? textEl.innerHTML : '',
            date: dateEl ? (dateEl as HTMLElement).innerText : '',
            url: linkEl ? linkEl.getAttribute('href') : null,
            hasVideo: !!hasVideo,
            hasAudio: !!hasAudio
          });
        }
      }

      if (!beforeId) {
        setPosts(groupedPosts.reverse());
      } else {
        setPosts(prev => [...prev, ...groupedPosts.reverse()]);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTelegramPosts();
  }, []);

  if (loading) return <div className="text-center text-slate-400 p-4" dir="rtl">جاري جلب المنشورات...</div>;
  if (posts.length === 0) return <div className="text-center text-slate-400 p-4" dir="rtl">لم يتم العثور على أي منشورات.</div>;

  return (
    <div className="space-y-4" dir="rtl">
      {posts.map((post, index) => (
        <TelegramPostCardArabic key={index} post={post} theme={theme} />
      ))}
      {currentMaxId && (
        <button 
          onClick={() => fetchTelegramPosts(currentMaxId)}
          disabled={loadingMore}
          className={`w-full p-3 text-center rounded-lg text-sm font-bold transition-colors ${theme === 'night' ? 'bg-[#1f242d] text-[#58a6ff] border border-[#30363d] hover:bg-[#2a303c]' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'}`}
        >
          {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد من الفتاوى ⬇'}
        </button>
      )}
    </div>
  );
};

const TelegramPostCardArabic = ({ post, theme }: { post: TelegramPost, theme: string, key?: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const loadMedia = async () => {
    if (mediaUrl) return;
    setLoadingMedia(true);
    try {
      const embedUrl = post.url!.replace('t.me/', 't.me/s/') + '?embed=1';
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(embedUrl)}`;
      const pageHtml = await safeFetchText(proxyUrl);
      
      let fileUrl = '';
      if (post.hasVideo) {
        const match = pageHtml.match(/<video[^>]*src="([^"]+)"/i);
        if (match) fileUrl = match[1];
      } else {
        const match = pageHtml.match(/<audio[^>]*src="([^"]+)"/i) || pageHtml.match(/<source[^>]*src="([^"]+)"[^>]*type="audio/i);
        if (match) fileUrl = match[1];
      }
      setMediaUrl(fileUrl || post.url!.replace('t.me/', 't.me/s/'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = post.text;
  const cleanFirstText = tempDiv.innerText.trim();
  const words = cleanFirstText.split(/\s+/);
  const fiveWords = words.slice(0, 5).join(' ');
  const previewText = fiveWords + (words.length > 5 ? '...' : '');

  return (
    <div 
      className={`p-4 rounded-2xl border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} cursor-pointer transition-all hover:bg-[#12161f]`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {post.img && <img src={post.img} className="w-full rounded-lg mb-2 max-h-40 object-cover" referrerPolicy="no-referrer" />}
      
      {!isOpen && (
        <div className="text-sm font-bold text-[#58a6ff] mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
          {previewText}
        </div>
      )}
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#1f242d]">
          {(post.hasVideo || post.hasAudio) && (
            <button 
              className="w-full bg-[#1f6feb] text-white text-xs font-bold p-2 rounded-lg mb-4 flex justify-center items-center"
              onClick={(e) => { e.stopPropagation(); loadMedia(); }}
            >
              {loadingMedia ? 'جاري التحميل...' : (post.hasVideo ? '🎬 تشغيل الفيديو' : '🎵 تشغيل الصوت')}
            </button>
          )}
          {mediaUrl && (
            post.hasVideo ? <video src={mediaUrl} controls className="w-full rounded-lg mb-4 bg-black" /> : <audio src={mediaUrl} controls className="w-full rounded-lg mb-4 bg-black" />
          )}
          <div className="text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.text }} />
        </div>
      )}
      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3">
        <span className="text-[#58a6ff] flex items-center gap-1">
          {isOpen ? 'إغلاق ⬆' : 'اضغط للقراءة ⬇'}
        </span>
        <span>{post.date}</span>
      </div>
    </div>
  );
};
