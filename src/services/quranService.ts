export interface Recitation {
  id: number;
  chapter_id: number;
  audio_url: string;
}

export interface RecitationsResponse {
  chapter_recitations: Recitation[];
}

export const fetchRecitations = async (reciterId: number, chapterNumber: number): Promise<RecitationsResponse> => {
  const response = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${chapterNumber}`);
  if (!response.ok) {
    throw new Error('Failed to fetch recitations');
  }
  return response.json();
};
