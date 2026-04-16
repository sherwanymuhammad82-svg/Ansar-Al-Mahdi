import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { safeFetchText } from '../utils/fetchUtils';

interface TelegramPost {
  img: string;
  text: string;
  date: string;
  url: string | null;
  hasVideo: any;
  hasAudio: any;
}

export const TelegramFeed = ({ theme }: { theme: 'night' | 'white' | 'cream' }) => {
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTelegramPosts() {
      try {
        const htmlText = await safeFetchText('https://api.codetabs.com/v1/proxy?quest=https://t.me/s/abudawd7');
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const postElements = Array.from(doc.querySelectorAll('.tgme_widget_message'));
        
        let groupedPosts: TelegramPost[] = [];

        for (let i = 0; i < postElements.length; i++) {
          const el = postElements[i];
          const imgWrap = el.querySelector('.tgme_widget_message_photo_wrap, .tgme_widget_message_photo');
          
          let imgUrl = '';
          if (imgWrap) {
            const style = imgWrap.getAttribute('style');
            if (style) {
              const styleMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
              if (styleMatch) imgUrl = styleMatch[1];
            }
          }

          if (imgUrl) {
            let collectedTexts = [];
            for (let j = i - 1; j >= 0; j--) {
              const prevEl = postElements[j];
              const prevTextEl = prevEl.querySelector('.tgme_widget_message_text');
              const prevImgWrap = prevEl.querySelector('.tgme_widget_message_photo_wrap, .tgme_widget_message_photo');
              
              if (prevImgWrap) break;

              if (prevTextEl) {
                const textContent = prevTextEl.innerHTML;
                collectedTexts.unshift(textContent);
                if (textContent.includes('بەناوی خوای بەخشندە و میهرەبان') || textContent.includes('بسم الله')) {
                  break;
                }
              }
            }

            let finalPostText = collectedTexts.join('<br><br>');
            if (!finalPostText) finalPostText = 'ئەم فەتوایە دەقی لەگەڵدا نییە.';

            const dateEl = el.querySelector('.time');
            const linkEl = el.querySelector('.tgme_widget_message_date');
            const postUrl = linkEl ? linkEl.getAttribute('href') : null;
            const hasVideo = el.querySelector('.tgme_widget_message_video_thumb, .tgme_widget_message_video');
            const hasAudio = el.querySelector('.tgme_widget_message_audio, .tgme_widget_message_voice');

            groupedPosts.push({
              img: imgUrl,
              text: finalPostText,
              date: dateEl ? (dateEl as HTMLElement).innerText : '',
              url: postUrl,
              hasVideo: hasVideo,
              hasAudio: hasAudio
            });
          }
        }
        setPosts(groupedPosts.reverse());
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
    fetchTelegramPosts();
  }, []);

  if (loading) return <div className="text-center text-slate-400 p-4">خەریکە پۆستەکان بە لۆژیکێکی زیرەک کۆدەکرێنەوە...</div>;

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <TelegramPostCard key={index} post={post} theme={theme} />
      ))}
    </div>
  );
};

const TelegramPostCard = ({ post, theme }: { post: TelegramPost, theme: string, key?: any }) => {
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

  return (
    <div 
      className={`p-4 rounded-2xl border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} cursor-pointer transition-all hover:bg-[#12161f]`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <img src={post.img} className="w-full rounded-lg mb-2 max-h-40 object-cover" referrerPolicy="no-referrer" />
      <div className="text-sm text-slate-400 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: post.text }} />
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#1f242d]">
          {(post.hasVideo || post.hasAudio) && (
            <button 
              className="w-full bg-[#1f6feb] text-white text-xs font-bold p-2 rounded-lg mb-4"
              onClick={(e) => { e.stopPropagation(); loadMedia(); }}
            >
              {loadingMedia ? 'خەریکە باردەکرێت...' : (post.hasVideo ? '🎬 کارپێکردنی ڤیدیۆ' : '🎵 کارپێکردنی دەنگ')}
            </button>
          )}
          {mediaUrl && (
            post.hasVideo ? <video src={mediaUrl} controls className="w-full rounded-lg mb-4 bg-black" /> : <audio src={mediaUrl} controls className="w-full rounded-lg mb-4 bg-black" />
          )}
          <div className="text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.text }} />
        </div>
      )}
      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3">
        <span>{post.date}</span>
        <span className="text-[#58a6ff] flex items-center gap-1">
          {isOpen ? 'داخستن ⬆' : 'بینینی نووسین ⬇'}
        </span>
      </div>
    </div>
  );
};
