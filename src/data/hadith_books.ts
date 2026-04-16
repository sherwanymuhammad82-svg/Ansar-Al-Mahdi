
export interface HadithBook {
  id: string;
  title_ar: string;
  title_ku: string;
  description_ar: string;
  description_ku: string;
  isNewApi?: boolean;
  isLocal?: boolean;
}

// All books removed from code. Now fetched via API.
export const HADITH_BOOKS: HadithBook[] = [];
