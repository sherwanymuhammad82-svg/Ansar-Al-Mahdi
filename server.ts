import express, { Request, Response } from 'express';
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import cors from "cors";
import path from "path";
import fs from "fs";
import fetch from 'node-fetch';
import JSZip from 'jszip';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = path.resolve(__dirname, 'firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } else {
    console.warn("firebase-service-account.json not found. Firebase Admin SDK not initialized.");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- ADMIN AUTH ---
  app.post("/api/auth/admin-token", async (req, res) => {
    try {
      const { name, code } = req.body;
      
      // Hardcoded check matching App.tsx
      if (name === 'احمد' && code === '7313') {
        const uid = 'admin-ahmed';
        
        if (admin.apps.length > 0) {
          const customToken = await admin.auth().createCustomToken(uid, {
            role: 'admin',
            displayName: 'احمد'
          });
          return res.json({ token: customToken });
        } else {
          // Fallback if admin not initialized
          return res.json({ token: "fallback-token-admin-not-init" });
        }
      } else {
        return res.status(401).json({ error: "ناو یان کۆد هەڵەیە" });
      }
    } catch (error) {
      console.error("Error creating admin token:", error);
      res.status(500).json({ error: "Failed to create admin token" });
    }
  });

  // --- ADMIN POSTS ---
  app.post("/api/admin/posts", async (req, res) => {
    try {
      const { postData } = req.body;
      const db = admin.firestore();
      
      // Add server timestamp on the server side
      const finalPostData = {
        ...postData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('admin_posts').add(finalPostData);
      res.json({ id: docRef.id, ...finalPostData });
    } catch (error) {
      console.error("Error creating admin post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.get("/api/admin/posts", async (req, res) => {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('admin_posts').orderBy('createdAt', 'desc').get();
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // --- GITHUB BOOKS FETCHING ---
  const BOOKS_DIR = path.join(process.cwd(), 'extracted_books');
  if (!fs.existsSync(BOOKS_DIR)) {
      fs.mkdirSync(BOOKS_DIR);
  }
  app.use('/books', express.static(BOOKS_DIR));
  
  // Specific 404 for missing books to prevent SPA fallback
  app.get('/books/*', (req, res) => {
    res.status(404).json({ error: "Book not found locally" });
  });

  app.get('/api/fetch-github-books', async (req: Request, res: Response) => {
      const zipUrl = "https://github.com/sherwanymuhammad82-svg/-/releases/download/4/specific_books_collection.zip";

      try {
          console.log("🚀 دەست دەکرێت بە دابەزاندنی فایلە زیپەکە لە گیتھابەوە...");
          
          const response = await fetch(zipUrl);
          console.log("Response status:", response.status);
          if (!response.ok) {
              throw new Error(`شکستی هێنا لە پەیوەندیکردن بە گیتھاب: ${response.statusText}`);
          }

          const buffer = await response.arrayBuffer();
          console.log("Buffer size:", buffer.byteLength);
          
          // خوێندنەوەی فایلی زیپەکە لە ڕێگەی JSZip
          const zip = await JSZip.loadAsync(buffer);
          console.log("Zip loaded successfully");
          
          console.log("📦 زیپەکە کرایەوە، خەریکە فایلە جەیسۆنەکان جیا دەکرێنەوە...");

          // پشکنین بۆ هەموو فایلەکانی ناو زیپەکە
          const fileNames = Object.keys(zip.files);
          console.log("Files in zip:", fileNames);
          for (const filename of fileNames) {
              const file = zip.files[filename];
              
              // دڵنیابوونەوە لەوەی فایلەکە جەیسۆنە نەک فۆڵدەر
              if (!file.dir && filename.endsWith('.json')) {
                  const content = await file.async('string');
                  
                  // تەنها ناوی فایلەکە دەردەهێنین (بە بێ ناوی فۆڵدەرەکانی ناوەوە)
                  let baseName = path.basename(filename);
                  // گۆڕینی بۆشایی بۆ هێڵەبەر بۆ ئەوەی لەگەڵ URL بگونجێت
                  baseName = baseName.replace(/\s+/g, '_');
                  const filePath = path.join(BOOKS_DIR, baseName);
                  
                  // سەیڤکردنی فایلی جەیسۆنەکە لە ناو سێرڤەردا
                  fs.writeFileSync(filePath, content);
                  console.log(`✅ فایلی ${baseName} سەیڤ کرا.`);
              }
          }

          res.json({ 
              success: true, 
              message: "هەموو کتێبەکان بە سەرکەوتوویی دابەزین و لە زیپ دەرهێنران!" 
          });

      } catch (error: any) {
          console.error("❌ هەڵەیەک ڕوویدا:", error);
          res.status(500).json({ 
              success: false, 
              error: error.message 
          });
      }
  });

  app.get('/api/fetch-hanafi-books', async (req: Request, res: Response) => {
      const zipUrl = "https://github.com/sherwanymuhammad82-svg/Fqh/archive/refs/heads/main.zip";

      try {
          console.log("🚀 دەست دەکرێت بە دابەزاندنی فقهی حنفی لە گیتھابەوە...");
          
          const response = await fetch(zipUrl);
          if (!response.ok) {
              throw new Error(`شکستی هێنا لە پەیوەندیکردن بە گیتھاب: ${response.statusText}`);
          }

          const buffer = await response.arrayBuffer();
          const zip = await JSZip.loadAsync(buffer);
          
          console.log("📦 زیپەکە کرایەوە، خەریکە فایلە جەیسۆنەکان جیا دەکرێنەوە...");

          const fileNames = Object.keys(zip.files);
          for (const filename of fileNames) {
              const file = zip.files[filename];
              
              if (!file.dir && filename.endsWith('.json')) {
                  const content = await file.async('string');
                  let baseName = path.basename(filename);
                  baseName = baseName.replace(/\s+/g, '_');
                  const filePath = path.join(BOOKS_DIR, baseName);
                  
                  fs.writeFileSync(filePath, content);
                  console.log(`✅ فایلی ${baseName} سەیڤ کرا.`);
              }
          }

          res.json({ 
              success: true, 
              message: "هەموو کتێبەکانی فقهی حنفی بە سەرکەوتوویی دابەزین!" 
          });

      } catch (error: any) {
          console.error("❌ هەڵەیەک ڕوویدا:", error);
          res.status(500).json({ 
              success: false, 
              error: error.message 
          });
      }
  });

  const ensureHanafiBooksFetched = async () => {
    if (!fs.existsSync(BOOKS_DIR)) {
      fs.mkdirSync(BOOKS_DIR, { recursive: true });
    }
    
    const files = fs.readdirSync(BOOKS_DIR).filter(f => f.toLowerCase().endsWith('.json'));
    if (files.length === 0) {
      console.log("🚀 Auto-fetching Hanafi books from GitHub...");
      const zipUrl = "https://github.com/sherwanymuhammad82-svg/Fqh/archive/refs/heads/main.zip";
      try {
        const response = await fetch(zipUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const zip = await JSZip.loadAsync(buffer);
          const fileNames = Object.keys(zip.files);
          
          let count = 0;
          for (const filename of fileNames) {
            const file = zip.files[filename];
            if (!file.dir && filename.toLowerCase().endsWith('.json')) {
              const content = await file.async('string');
              let baseName = path.basename(filename);
              baseName = baseName.replace(/\s+/g, '_');
              fs.writeFileSync(path.join(BOOKS_DIR, baseName), content);
              count++;
            }
          }
          console.log(`✅ Auto-fetch complete. Extracted ${count} books.`);
        } else {
          console.error(`❌ Failed to download zip from GitHub: ${response.statusText}`);
        }
      } catch (err) {
        console.error("❌ Auto-fetch failed:", err);
      }
    }
  };

  app.get('/api/books/list', async (req, res) => {
    try {
      const { category } = req.query;
      
      if (category === 'fiqh_hanafi') {
        await ensureHanafiBooksFetched();
      }

      if (!fs.existsSync(BOOKS_DIR)) {
        return res.json({ success: true, books: [] });
      }

      const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.json'));
      const books = files.map(file => {
        const filePath = path.join(BOOKS_DIR, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const bookId = file.replace('.json', '');
        return {
          id: bookId,
          title_ar: content.title || content.name || bookId.replace(/_/g, ' '),
          title_ku: content.title_ku || "",
          description_ar: content.description || "",
          description_ku: content.description_ku || "",
          category: category || content.category || 'general',
          filename: file,
          source: 'server'
        };
      });

      res.json({ success: true, books });
    } catch (error: any) {
      console.error("Error listing books:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/books/content/:id", async (req, res) => {
    try {
      const bookId = req.params.id;
      const safeId = path.basename(bookId);
      
      // If it's a hanafi book, ensure they are fetched
      if (safeId.toLowerCase().includes('hanafi') || !fs.existsSync(path.join(BOOKS_DIR, `${safeId}.json`))) {
        await ensureHanafiBooksFetched();
      }

      // Try both directories
      const paths = [
        path.join(BOOKS_DIR, `${safeId}.json`),
        path.join(process.cwd(), 'books_content', `${safeId}.json`)
      ];
      
      let found = false;
      for (const filePath of paths) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          res.json(JSON.parse(content));
          found = true;
          break;
        }
      }

      if (!found) {
        res.status(404).json({ error: "Book not found" });
      }
    } catch (error) {
      console.error("Error fetching book content:", error);
      res.status(500).json({ error: "Failed to fetch book content" });
    }
  });

  // --- TARIKH BOOKS API ---
  app.get("/api/tarikh-books/:id", (req, res) => {
    try {
      const bookId = req.params.id;
      // Sanitize ID to prevent path traversal
      const safeId = path.basename(bookId);
      const filePath = path.join(process.cwd(), 'books_content', `${safeId}.json`);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(content));
      } else {
        res.status(404).json({ error: "Book not found" });
      }
    } catch (error) {
      console.error("Error fetching tarikh book:", error);
      res.status(500).json({ error: "Failed to fetch book content" });
    }
  });

  // --- BOOK MIGRATION TO FIRESTORE ---
  app.get("/api/debug/categories", async (req, res) => {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('Books').get();
      const categories = new Set();
      snapshot.forEach(doc => {
        categories.add(doc.data().category);
      });
      res.json({ categories: Array.from(categories) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/migrate-books-to-firestore", async (req, res) => {
    try {
      const { passcode, category: targetCategory } = req.body;
      if (passcode !== "7313") return res.status(403).json({ error: "Unauthorized" });

      if (!fs.existsSync(BOOKS_DIR)) {
        return res.status(400).json({ error: "No extracted books found. Please fetch from GitHub first." });
      }

      const db = admin.firestore();
      const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.json'));
      let count = 0;

      for (const file of files) {
        const filePath = path.join(BOOKS_DIR, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const bookId = file.replace('.json', '');
        const title = content.title || content.name || bookId.replace(/_/g, ' ');
        
        // 1. Save Metadata to 'Books'
        await db.collection('Books').doc(bookId).set({
          id: bookId,
          title_ar: title,
          title_ku: content.title_ku || "",
          description_ar: content.description || "",
          description_ku: content.description_ku || "",
          category: targetCategory || content.category || 'general',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 2. Save Content to 'book_contents'
        // Split content if it's too large for a single Firestore doc (1MB limit)
        const text = content.content || content.text || "";
        const parts = [];
        const CHUNK_SIZE = 500000; // ~500KB per doc to be safe
        
        if (text.length > CHUNK_SIZE) {
          for (let i = 0; i < text.length; i += CHUNK_SIZE) {
            parts.push(text.substring(i, i + CHUNK_SIZE));
          }
        } else {
          parts.push(text);
        }

        for (let i = 0; i < parts.length; i++) {
          await db.collection('book_contents').doc(`${bookId}_part_${i + 1}`).set({
            book_id: bookId,
            text: parts[i],
            part: i + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }

        count++;
      }

      res.json({ success: true, count, message: `${count} books migrated to Firestore.` });
    } catch (error: any) {
      console.error("Migration error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- AUTHENTICATION ---
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      
      const db = admin.firestore();
      // Check if user exists
      const usersRef = db.collection('Users');
      const snapshot = await usersRef.where('name', '==', name).limit(1).get();
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        return res.json({ id: userDoc.id, ...userDoc.data() });
      } else {
        // Create new user
        const newUser = { name, createdAt: admin.firestore.FieldValue.serverTimestamp() };
        const docRef = await usersRef.add(newUser);
        return res.json({ id: docRef.id, ...newUser });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/users/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.json([]);
      const db = admin.firestore();
      const snapshot = await db.collection('Users').get();
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.name && u.name.toLowerCase().includes((q as string).toLowerCase()));
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // --- ADMIN SETTINGS ---
  app.get("/api/settings", async (req, res) => {
    try {
      if (admin.apps.length === 0) {
        return res.json({ backgroundImage: "", primaryColor: "amber", appIcon: "" });
      }
      const db = admin.firestore();
      const doc = await db.collection('Settings').doc('main').get();
      if (doc.exists) {
        res.json(doc.data());
      } else {
        res.json({ backgroundImage: "", primaryColor: "amber", appIcon: "" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { passcode, settings } = req.body;
      if (passcode !== "7313") return res.status(403).json({ error: "Invalid passcode" });
      
      if (admin.apps.length === 0) {
        return res.status(503).json({ error: "Firebase Admin not initialized" });
      }
      const db = admin.firestore();
      await db.collection('Settings').doc('main').set(settings, { merge: true });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // --- COMMUNITY POSTS ---
  app.get("/api/posts", async (req, res) => {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('Posts').orderBy('createdAt', 'desc').limit(50).get();
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const { userId, userName, content, mediaUrl, mediaType } = req.body;
      const db = admin.firestore();
      const newPost = {
        userId,
        userName,
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        likes: [],
        comments: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('Posts').add(newPost);
      res.json({ id: docRef.id, ...newPost });
    } catch (error) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { passcode } = req.body;
      if (passcode !== "7313") return res.status(403).json({ error: "Unauthorized" });
      const db = admin.firestore();
      await db.collection('Posts').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      const db = admin.firestore();
      const postRef = db.collection('Posts').doc(req.params.id);
      const doc = await postRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Post not found" });
      
      const likes = doc.data()?.likes || [];
      if (likes.includes(userId)) {
        await postRef.update({ likes: admin.firestore.FieldValue.arrayRemove(userId) });
      } else {
        await postRef.update({ likes: admin.firestore.FieldValue.arrayUnion(userId) });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  app.post("/api/posts/:id/comment", async (req, res) => {
    try {
      const { userId, userName, content } = req.body;
      const db = admin.firestore();
      const postRef = db.collection('Posts').doc(req.params.id);
      const newComment = {
        id: Date.now().toString(),
        userId,
        userName,
        content,
        createdAt: new Date().toISOString()
      };
      await postRef.update({ comments: admin.firestore.FieldValue.arrayUnion(newComment) });
      res.json(newComment);
    } catch (error) {
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // --- CHAT SYSTEM ---
  app.get("/api/chats", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId required" });
      const db = admin.firestore();
      const snapshot = await db.collection('Chats').where('participants', 'array-contains', userId).get();
      const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  app.post("/api/chats", async (req, res) => {
    try {
      const { participants, isGroup, name, participantNames } = req.body;
      const db = admin.firestore();
      
      // If not group, check if chat already exists
      if (!isGroup && participants.length === 2) {
        const snapshot = await db.collection('Chats')
          .where('participants', 'array-contains', participants[0])
          .get();
        
        const existingChat = snapshot.docs.find(doc => {
          const data = doc.data();
          return !data.isGroup && data.participants.includes(participants[1]);
        });
        
        if (existingChat) {
          return res.json({ id: existingChat.id, ...existingChat.data() });
        }
      }

      const newChat = {
        participants,
        participantNames: participantNames || {},
        isGroup: isGroup || false,
        name: name || null,
        lastMessage: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('Chats').add(newChat);
      res.json({ id: docRef.id, ...newChat });
    } catch (error) {
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  app.get("/api/chats/:id/messages", async (req, res) => {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('Chats').doc(req.params.id).collection('Messages').orderBy('createdAt', 'asc').get();
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chats/:id/messages", async (req, res) => {
    try {
      const { userId, userName, content } = req.body;
      const db = admin.firestore();
      const chatRef = db.collection('Chats').doc(req.params.id);
      
      const newMessage = {
        userId,
        userName,
        content,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const msgRef = await chatRef.collection('Messages').add(newMessage);
      
      // Update last message in chat
      await chatRef.update({
        lastMessage: content,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ id: msgRef.id, ...newMessage });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // --- EXISTING ROUTES ---
  app.get("/api/quran", async (req, res) => {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('Quran').orderBy('surah_number').get();
      const surahs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(surahs);
    } catch (error) {
      console.error("Error fetching Quran:", error);
      res.status(500).json({ error: "Failed to fetch Quran" });
    }
  });

  app.get("/api/quran/:surahId/ayahs", async (req, res) => {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('Quran').doc(req.params.surahId).collection('Ayahs').orderBy('numberInSurah').get();
      const ayahs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(ayahs);
    } catch (error) {
      console.error("Error fetching Ayahs:", error);
      res.status(500).json({ error: "Failed to fetch Ayahs" });
    }
  });

  app.get("/api/books", async (req, res) => {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('Books').get();
      const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(books);
    } catch (error) {
      console.error("Error fetching Books:", error);
      res.status(500).json({ error: "Failed to fetch Books" });
    }
  });

  app.get("/api/hadiths", async (req, res) => {
    try {
      const db = admin.firestore();
      const sourceQuery = req.query.source as string;
      let query: admin.firestore.Query = db.collection('Hadiths');
      
      if (sourceQuery) {
        let mappedSource = sourceQuery;
        if (sourceQuery.includes('البخاري') || sourceQuery.includes('بوخاری')) mappedSource = 'Bukhari';
        else if (sourceQuery.includes('مسلم') || sourceQuery.includes('موسلیم')) mappedSource = 'Muslim';
        else if (sourceQuery.includes('الترمذي') || sourceQuery.includes('ترمذی')) mappedSource = 'Tirmidhi';
        else if (sourceQuery.includes('ابن ماجه') || sourceQuery.includes('ئیبن ماجە')) mappedSource = 'Ibn Majah';
        else if (sourceQuery.includes('أبي داود') || sourceQuery.includes('ئەبو داود')) mappedSource = 'Abu Dawud';
        else if (sourceQuery.includes('النسائي') || sourceQuery.includes('نەسائی')) mappedSource = 'Nasai';
        else if (sourceQuery.includes('أحمد') || sourceQuery.includes('ئەحمەد')) mappedSource = 'Ahmad';

        const snapshot = await db.collection('Hadiths').limit(500).get();
        const allHadiths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const filteredHadiths = allHadiths.filter(h => {
          const s = (h as any).source || '';
          return s.toLowerCase().includes(mappedSource.toLowerCase());
        });
        
        return res.json(filteredHadiths);
      }
      
      const snapshot = await query.limit(100).get();
      const hadiths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(hadiths);
    } catch (error) {
      console.error("Error fetching Hadiths:", error);
      res.status(500).json({ error: "Failed to fetch Hadiths" });
    }
  });

  app.get("/api/admin/posts", async (req, res) => {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('admin_posts').orderBy('createdAt', 'desc').get();
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      res.status(500).json({ error: "Failed to fetch admin posts" });
    }
  });

  app.post("/api/admin/posts", async (req, res) => {
    try {
      const { postData } = req.body;
      const db = admin.firestore();
      
      const newPost = {
        ...postData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('admin_posts').add(newPost);
      res.json({ id: docRef.id, ...newPost });
    } catch (error) {
      console.error("Error creating admin post:", error);
      res.status(500).json({ error: "Failed to create admin post" });
    }
  });

  app.get("/api/proxy-book", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ error: "URL is required" });
      
      const response = await fetch(url as string);
      if (!response.ok) throw new Error(`Failed to fetch from ${url} (Status: ${response.status})`);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        res.json(data);
      } else if (contentType && (contentType.includes('application/zip') || contentType.includes('application/octet-stream') || contentType.includes('application/x-zip-compressed'))) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (contentType) res.setHeader('Content-Type', contentType);
        res.send(buffer);
      }
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      
      if (error.code === 'EHOSTUNREACH' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          error: "سێرڤەری کتێبەکان لە ئێستادا بەردەست نییە. تکایە دواتر هەوڵ بدەرەوە.",
          code: error.code 
        });
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
