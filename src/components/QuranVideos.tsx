import React, { useEffect, useState } from 'react';
import { Play, Youtube, Save, Loader2 } from 'lucide-react';
import { safeFetch, safeFetchText } from '../utils/fetchUtils';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface YouTubeVideo {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  published: string;
}

export const QuranVideos = ({ theme, language, appSettings, currentUser }: { theme: 'night' | 'white' | 'cream', language: 'ar' | 'ku' | 'en' | 'in' | 'fr' | 'ps' | 'fa' | 'tr' | 'es' | 'uz' | 'ru', appSettings?: any, currentUser?: any }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [newChannelId, setNewChannelId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchYouTubeVideos() {
      try {
        const defaultChannelId = 'UClEy_npIlGGHFKoet99Bl5w';
        const channelId = language === 'ar' 
          ? (appSettings?.quranYoutubeChannelAr || defaultChannelId) 
          : language === 'en' 
            ? (appSettings?.quranYoutubeChannelEn || defaultChannelId) 
            : language === 'in'
              ? (appSettings?.quranYoutubeChannelIn || defaultChannelId)
              : language === 'fr'
                ? (appSettings?.quranYoutubeChannelFr || defaultChannelId)
                : language === 'ps'
                  ? (appSettings?.quranYoutubeChannelPs || defaultChannelId)
                  : language === 'fa'
                    ? (appSettings?.quranYoutubeChannelFa || defaultChannelId)
                    : language === 'tr'
                      ? (appSettings?.quranYoutubeChannelTr || defaultChannelId)
                      : language === 'es'
                        ? (appSettings?.quranYoutubeChannelEs || defaultChannelId)
                        : language === 'uz'
                          ? (appSettings?.quranYoutubeChannelUz || defaultChannelId)
                        : language === 'ru'
                          ? (appSettings?.quranYoutubeChannelRu || defaultChannelId)
                          : (appSettings?.quranYoutubeChannelKu || defaultChannelId);
        
        setNewChannelId(channelId);

        const parseYouTubeInput = (input: string) => {
          const playlistMatch = input.match(/[?&]list=([^&]+)/);
          if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
          if (input.startsWith('PL') || input.startsWith('UU') || input.startsWith('FL')) return { type: 'playlist', id: input };
          const channelMatch = input.match(/channel\/([^/?]+)/);
          if (channelMatch) return { type: 'channel', id: channelMatch[1] };
          return { type: 'channel', id: input };
        };

        const parsed = parseYouTubeInput(channelId);
        const isPlaylist = parsed.type === 'playlist';
        const targetId = parsed.id;

        const url = isPlaylist 
          ? `https://www.youtube.com/playlist?list=${targetId}`
          : `https://www.youtube.com/channel/${targetId}/videos`;
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
        
        let text = '';
        try {
          text = await safeFetchText(proxyUrl);
        } catch (scrapeError) {
          console.warn('YouTube scraping failed, falling back to RSS:', scrapeError);
        }
        
        if (text) {
          const match = text.match(/var ytInitialData = (.*?);<\/script>/);
          if (match) {
            const data = JSON.parse(match[1]);
            let fetchedVideos: YouTubeVideo[] = [];

            if (isPlaylist) {
              const items = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];
              fetchedVideos = items
                .filter((i: any) => i.playlistVideoRenderer)
                .map((i: any) => {
                  const v = i.playlistVideoRenderer;
                  return {
                    id: v.videoId,
                    title: v.title.runs[0].text,
                    link: `https://www.youtube.com/watch?v=${v.videoId}`,
                    thumbnail: v.thumbnail.thumbnails[v.thumbnail.thumbnails.length - 1].url,
                    published: ''
                  };
                });
            } else {
              const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
              const videosTab = tabs.find((t: any) => t.tabRenderer?.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes('/videos'));
              
              if (videosTab) {
                const items = videosTab.tabRenderer?.content?.richGridRenderer?.contents || [];
                fetchedVideos = items
                  .filter((i: any) => i.richItemRenderer?.content?.videoRenderer)
                  .map((i: any) => {
                    const v = i.richItemRenderer.content.videoRenderer;
                    return {
                      id: v.videoId,
                      title: v.title.runs[0].text,
                      link: `https://www.youtube.com/watch?v=${v.videoId}`,
                      thumbnail: v.thumbnail.thumbnails[v.thumbnail.thumbnails.length - 1].url,
                      published: v.publishedTimeText?.simpleText || ''
                    };
                  });
              }
            }
              
            if (fetchedVideos.length > 0) {
              setVideos(fetchedVideos);
              setPlayingVideoId(fetchedVideos[0].id);
              setLoading(false);
              return;
            }
          }
        }
        
        // Fallback to RSS if scraping fails
        const rssUrl = isPlaylist
          ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${targetId}`
          : `https://www.youtube.com/feeds/videos.xml?channel_id=${targetId}`;
        const rssProxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const rssData: any = await safeFetch(rssProxyUrl);
        
        if (rssData.status === 'ok') {
          const fetchedVideos = rssData.items.map((item: any) => ({
            id: item.guid.split(':')[2],
            title: item.title,
            link: item.link,
            thumbnail: item.thumbnail,
            published: new Date(item.pubDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'ku-IQ', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          }));
          setVideos(fetchedVideos);
          if (fetchedVideos.length > 0) {
            setPlayingVideoId(fetchedVideos[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchYouTubeVideos();
  }, [language, appSettings]);

  const handleUpdateChannel = async () => {
    if (!newChannelId) return;
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'Settings', 'main');
      const fieldName = language === 'ar' ? 'quranYoutubeChannelAr' : 
                        language === 'en' ? 'quranYoutubeChannelEn' : 
                        language === 'in' ? 'quranYoutubeChannelIn' : 
                        language === 'fr' ? 'quranYoutubeChannelFr' : 
                        language === 'ps' ? 'quranYoutubeChannelPs' : 
                        language === 'fa' ? 'quranYoutubeChannelFa' : 
                        language === 'tr' ? 'quranYoutubeChannelTr' : 
                        language === 'es' ? 'quranYoutubeChannelEs' : 
                        language === 'uz' ? 'quranYoutubeChannelUz' :
                        language === 'ru' ? 'quranYoutubeChannelRu' : 'quranYoutubeChannelKu';
      
      await updateDoc(settingsRef, {
        [fieldName]: newChannelId
      });
      alert(language === 'ar' ? 'تم التحديث بنجاح' : language === 'en' ? 'Updated successfully' : 'بە سەرکەوتوویی نوێکرایەوە');
    } catch (error) {
      console.error('Error updating channel:', error);
      alert(language === 'ar' ? 'حدث خطأ' : language === 'en' ? 'An error occurred' : 'هەڵەیەک ڕوویدا');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  const featuredVideo = videos[0];
  const playlistIds = videos.slice(1).map(v => v.id).join(',');

  return (
    <div className="space-y-4 mb-8" id="quranvideos-container">
      <div className="flex flex-col items-center mb-6">
        
        {/* Admin Channel ID Input */}
        {currentUser?.role === 'admin' && (
          <div className={`w-full max-w-md p-4 rounded-2xl border ${theme === 'night' ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'} mb-6`}>
            <div className="flex items-center gap-2 mb-3">
              <Youtube className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'ar' ? 'تعديل معرف القناة (القرآن)' : language === 'en' ? 'Edit Channel ID (Quran)' : 'دەستکاری کۆدی کەناڵ (قورئان)'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChannelId}
                onChange={(e) => setNewChannelId(e.target.value)}
                placeholder="YouTube Channel ID"
                className={`flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold/50`}
              />
              <button
                onClick={handleUpdateChannel}
                disabled={isSaving}
                className="bg-gold hover:bg-gold/80 text-black px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {videos.length === 0 ? (
        <div className="text-center text-slate-400 p-8">
          {language === 'ar' ? 'لا توجد مقاطع فيديو متاحة.' : language === 'en' ? 'No videos available.' : 'هیچ ڤیدیۆیەک بەردەست نییە.'}
        </div>
      ) : (
        <>
          {/* Featured Video Playlist */}
          {featuredVideo && (
            <div className={`block rounded-xl overflow-hidden border ${theme === 'night' ? 'bg-[#0b0e14] border-[#1f242d]' : 'bg-white border-stone-200'} shadow-lg mb-6`}>
              <div className="relative w-full bg-black aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${featuredVideo.id}?autoplay=1&playsinline=1&cc_load_policy=1&hl=${language === 'en' ? 'en' : language === 'ar' ? 'ar' : 'ku'}${playlistIds ? `&playlist=${playlistIds}` : ''}`}
                  title={featuredVideo.title}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
