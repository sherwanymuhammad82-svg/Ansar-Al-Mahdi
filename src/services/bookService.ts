
import { GoogleGenAI } from '@google/genai';
import JSZip from 'jszip';
import { db } from '../firebase';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import tarikhMetadata from '../data/tarikh_books_metadata.json';
import { MEKTABEY_BZOTNAWA } from '../data/mektabey_bzotnawa';

export interface Book {
  id: string;
  title?: { [key: string]: string };
  description?: { [key: string]: string };
  title_ar?: string;
  title_ku?: string;
  title_en?: string;
  description_ar?: string;
  description_ku?: string;
  description_en?: string;
  category?: string;
  language?: string;
  isDownloaded?: boolean;
  contentUrl?: string; // URL to fetch content from (External IP or Drive ID)
  imageUrl?: string;
}

export interface BookContent {
  id: string;
  book_id?: string;
  text: string;
  part?: number;
  contentUrl?: string;
}

const API_BASE_URL = 'http://45.13.132.12';

export const bookService = {
  // Fetch list of books from API and Firestore
  async fetchBooks(category?: string): Promise<Book[]> {
    try {
      let books: Book[] = [];
      
      // 1. Fetch from Firestore 'Books' collection
      try {
        const booksRef = collection(db, 'Books');
        const q = query(booksRef);
        const snapshot = await getDocs(q);
        const firestoreBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Book[];
        
        console.log(`Fetched ${firestoreBooks.length} books from Firestore`);
        
        if (firestoreBooks.length > 0) {
          books = firestoreBooks;
          if (category) {
            books = books.filter(b => b.category === category);
            console.log(`Filtered to ${books.length} books for category: ${category}`);
          }
        }
      } catch (e) {
        console.error("Error fetching from Firestore Books:", e);
      }

      // 2. Fallback/Merge with local metadata if Firestore is empty or for specific categories
      if (books.length === 0) {
        console.log(`Firestore empty or filtered to 0, using fallback for category: ${category}`);
        if (category === 'tarikh') {
          books = tarikhMetadata as Book[];
        } else if (category === 'general' || category === 'mektabey_bzotnawa') {
          try {
            const response = await fetch('https://raw.githubusercontent.com/sherwanymuhammad82-svg/my-book-api/refs/heads/main/my_library.json');
            if (response.ok) {
              const data = await response.json();
              books = data.map((item: any, index: number) => {
                const bookId = `mektabey_${index}`;
                const content = Array.isArray(item.content) ? item.content : [item.content];
                const bookContent = content.map((text: string, i: number) => ({ id: `${bookId}_${i}`, text, part: i + 1 }));
                
                // Store content in memory/local storage for fetchBookContent to use
                try {
                  localStorage.setItem(`book_content_${bookId}`, JSON.stringify(bookContent));
                } catch (e) {
                  console.warn('Could not save book content to localStorage', e);
                }
                
                return {
                  id: bookId,
                  title_ar: typeof item.title === 'string' ? item.title : (item.title?.ar || ''),
                  description_ar: content[0]?.substring(0, 200) + '...' || '',
                  category: 'mektabey_bzotnawa',
                  language: 'ar',
                  contentUrl: 'local_only' // Special flag
                };
              });
            } else {
              books = MEKTABEY_BZOTNAWA as Book[];
            }
          } catch (e) {
            books = MEKTABEY_BZOTNAWA as Book[];
          }
        } else {
          const url = category ? `${API_BASE_URL}/books.json?category=${category}` : `${API_BASE_URL}/books.json`;
          const proxyUrl = `/api/proxy-book?url=${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            books = await response.json();
          } else {
            // Try direct fetch as fallback
            const directResponse = await fetch(url);
            if (directResponse.ok) {
              books = await directResponse.json();
            } else {
              // Fallback if API fails
              if (category === 'tarikh') books = tarikhMetadata as Book[];
              else if (category === 'general' || category === 'mektabey_bzotnawa') books = MEKTABEY_BZOTNAWA as Book[];
            }
          }
        }
      }
      
      // Check which books are already downloaded
      const downloadedIds = this.getDownloadedBookIds();
      let processedBooks = books.map((book: any) => {
        let contentUrl = book.contentUrl;
        if (!contentUrl) {
          if (book.source === 'server') {
            contentUrl = `/api/books/content/${encodeURIComponent(book.id)}`;
          } else {
            contentUrl = `${API_BASE_URL}/books/${encodeURIComponent(book.id)}.json`;
          }
        }
        
        return {
          ...book,
          contentUrl,
          isDownloaded: downloadedIds.includes(book.id)
        } as Book;
      });

      // Auto-translate if needed (limit to a few to avoid long waits)
      return processedBooks;
    } catch (error) {
      console.error('Error fetching books:', error);
      // Fallback to local metadata if offline or API fails
      if (category === 'tarikh') return tarikhMetadata as Book[];
      return this.getLocalBooks(category);
    }
  },

  // Fetch book content from remote URL, local storage, or Firestore
  async fetchBookContent(bookId: string, contentUrl?: string): Promise<BookContent[]> {
    try {
      // 1. Check local storage first
      const localContent = localStorage.getItem(`book_content_${bookId}`);
      if (localContent) {
        return JSON.parse(localContent);
      }

      // 2. Check Firestore 'book_contents' collection
      try {
        const contentsRef = collection(db, 'book_contents');
        const q = query(contentsRef, where('book_id', '==', bookId), orderBy('part', 'asc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BookContent[];
        }
      } catch (e) {
        console.warn("Error fetching from Firestore book_contents:", e);
      }

      // 3. Try Server API as fallback
      try {
        const response = await fetch(`/api/books/content/${bookId}`);
        if (response.ok) {
          const content = await response.json();
          // Wrap in array if it's a single object (BookContent[])
          const result = Array.isArray(content) ? content : [content];
          
          // Save to local storage for offline use
          localStorage.setItem(`book_content_${bookId}`, JSON.stringify(result));
          
          return result;
        }
      } catch (e) {
        console.warn("Failed to fetch book content from server fallback:", e);
      }

      if (!contentUrl) {
        // If no contentUrl and not in Firestore/Local, we can't do much
        return [];
      }

      // Fetch from external IP or Google Drive
      // Use server-side proxy to avoid mixed content issues (HTTP on HTTPS)
      // Skip proxy for relative server URLs
      let response;
      if (contentUrl.startsWith('/')) {
        response = await fetch(contentUrl);
      } else {
        const proxyUrl = `/api/proxy-book?url=${encodeURIComponent(contentUrl)}`;
        response = await fetch(proxyUrl);
      }
      if (!response.ok) {
        // Fallback 1: Try local server extracted books
        const localFilename = bookId.replace(/\s+/g, '_') + '.json';
        const localFallbackUrl = `/books/${localFilename}`;
        try {
          const localResponse = await fetch(localFallbackUrl);
          if (localResponse.ok) {
            const contentType = localResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await localResponse.json();
              return Array.isArray(data) ? data : [data];
            }
          }
        } catch (e) {
          console.warn('Local fallback failed:', e);
        }

        // Fallback 2: Try direct fetch if proxy fails (might fail due to mixed content)
        try {
          const directResponse = await fetch(contentUrl);
          if (directResponse.ok) {
            const contentType = directResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await directResponse.json();
              return Array.isArray(data) ? data : [data];
            }
          }
        } catch (e) {
          console.warn('Direct fetch failed:', e);
        }

        throw new Error('Failed to fetch book content from remote source');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          return Array.isArray(data) ? data : [data];
        } catch (e) {
          throw new Error('Response was not valid JSON');
        }
      } else if (contentType && (
        contentType.includes('application/pdf') || 
        contentType.includes('application/msword') || 
        contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
        contentType.includes('application/octet-stream')
      )) {
        // It's likely a binary document
        return [{ id: 'document', text: 'BINARY_DOCUMENT', contentUrl: contentUrl }];
      } else {
        const text = await response.text();
        try {
          // Try to parse text as JSON just in case
          const data = JSON.parse(text);
          return Array.isArray(data) ? data : [data];
        } catch (e) {
          // If it's not JSON, but we have a contentUrl, it might be a document
          if (contentUrl) {
            return [{ id: 'document', text: 'BINARY_DOCUMENT', contentUrl: contentUrl }];
          }
          throw new Error('Response was not valid JSON');
        }
      }
    } catch (error) {
      console.error('Error fetching book content:', error);
      if (error instanceof Error && error.message === 'Response was not valid JSON') {
        throw error;
      }
      return [];
    }
  },

  // Download book and save to local storage
  async downloadBook(book: Book): Promise<boolean> {
    try {
      const content = await this.fetchBookContent(book.id, book.contentUrl);
      if (content.length === 0) return false;

      localStorage.setItem(`book_metadata_${book.id}`, JSON.stringify(book));
      localStorage.setItem(`book_content_${book.id}`, JSON.stringify(content));
      
      const downloadedIds = this.getDownloadedBookIds();
      if (!downloadedIds.includes(book.id)) {
        downloadedIds.push(book.id);
        localStorage.setItem('downloaded_book_ids', JSON.stringify(downloadedIds));
      }
      return true;
    } catch (error) {
      console.error('Error downloading book:', error);
      return false;
    }
  },

  // Get list of downloaded book IDs
  getDownloadedBookIds(): string[] {
    const ids = localStorage.getItem('downloaded_book_ids');
    return ids ? JSON.parse(ids) : [];
  },

  // Get downloaded books from local storage
  getLocalBooks(category?: string): Book[] {
    const ids = this.getDownloadedBookIds();
    const books: Book[] = [];
    ids.forEach(id => {
      const metadata = localStorage.getItem(`book_metadata_${id}`);
      if (metadata) {
        const book = JSON.parse(metadata);
        if (!category || book.category === category) {
          books.push({ 
            ...book, 
            contentUrl: book.contentUrl || `${API_BASE_URL}/books/${encodeURIComponent(book.id)}.json`,
            isDownloaded: true 
          });
        }
      }
    });
    return books;
  },

  // Delete downloaded book
  deleteLocalBook(bookId: string) {
    localStorage.removeItem(`book_metadata_${bookId}`);
    localStorage.removeItem(`book_content_${bookId}`);
    const ids = this.getDownloadedBookIds().filter(id => id !== bookId);
    localStorage.setItem('downloaded_book_ids', JSON.stringify(ids));
  },

  // Smart translation using Gemini
  async translateMetadata(books: Book[], targetLang: string): Promise<Book[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Determine which fields to check based on targetLang
    const titleField = `title_${targetLang}`;
    const descField = `description_${targetLang}`;
    
    // If targetLang is 'ar', we don't need to translate since source is Arabic
    if (targetLang === 'ar') return books;

    const booksToTranslate = books.filter(b => !(b as any)[titleField] || !(b as any)[descField]);
    
    if (booksToTranslate.length === 0) return books;

    try {
      const langMap: Record<string, string> = {
        'ku': 'Kurdish (Sorani)',
        'en': 'English',
        'fr': 'French',
        'es': 'Spanish',
        'in': 'Indonesian',
        'ps': 'Pashto',
        'fa': 'Persian',
        'tr': 'Turkish'
      };
      
      const targetLangName = langMap[targetLang] || targetLang;
      
      const prompt = `Translate the following book titles and descriptions from Arabic to ${targetLangName}. Return ONLY a JSON array of objects with 'id', '${titleField}', and '${descField}'.\n\n${JSON.stringify(booksToTranslate.map(b => ({ id: b.id, title: b.title_ar || b.title?.ar, description: b.description_ar || b.description?.ar })))}`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const translations = JSON.parse(response.text || '[]');
      return books.map(b => {
        const t = translations.find((item: any) => item.id === b.id);
        return t ? { ...b, [titleField]: t[titleField], [descField]: t[descField] } : b;
      });
    } catch (e) {
      console.error("Metadata translation error:", e);
      return books;
    }
  }
};
