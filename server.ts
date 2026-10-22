import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: AI Music Coach & Vocal Riyaz Guide
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { prompt, vocalKey, detectedNotes, language = 'bn' } = req.body;

    const systemInstruction = `You are an expert Indian Classical, Folk, and Modern Bengali Music Maestro & Vocal Coach (সঙ্গীত ওস্তাদ এবং ভোকাল কোচ).
The user is practicing singing in an interactive music studio with Harmonium, Guitar, and Keyboard auto-accompaniment.
Your goal is to guide the singer in Bengali (or English if requested), giving encouraging, musically precise advice on:
1. Pitch accuracy & Riyaz advice (সা-রে-গা-মা স্বরসাধনা, সুরের শুদ্ধতা).
2. Harmonium Swarlipi (স্বরলিপি) and finger movement suggestions.
3. Guitar chord progressions matching their root scale (${vocalKey || 'C'}).
4. Raag recommendations (e.g., Yaman, Bilawal, Bhairav, Kafi, Bhairavi) and Taal/Rhythm (Dadra, Keharwa, Roopak).
Keep your feedback practical, inspiring, well-formatted with clear headings and bullet points.`;

    const contents = `User question/performance: ${prompt || 'How can I improve my vocal riyaz with harmonium and guitar?'}.
Current Key: ${vocalKey || 'C Major'}.
Recently sung notes: ${Array.isArray(detectedNotes) ? detectedNotes.join(', ') : 'None'}.
Language: ${language === 'bn' ? 'Bengali' : 'English'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      feedback: response.text,
    });
  } catch (error: any) {
    console.error('Error calling Gemini Coach:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate vocal coaching feedback',
    });
  }
});

// Endpoint: Song Swarlipi & Chord Analyzer
app.post('/api/ai/song-helper', async (req, res) => {
  try {
    const { songName, artist, rootKey = 'C' } = req.body;

    const prompt = `Provide the musical structure for the song "${songName}" ${artist ? 'by ' + artist : ''}.
Selected root key for singing: ${rootKey}.
Output the response in JSON with the following structure:
- title: song title
- raagOrScale: suggested Raag or Western scale
- taalOrBeat: suggested Taal (e.g., Keharwa 8 Matra, Dadra 6 Matra, 4/4 Pop) and suggested BPM
- harmoniumNotations: Array of objects with line, swaralipi (e.g. "সা রে গা মা | পা - ধা নি | র্সা"), and westernNotes (e.g. "C D E F | G - A B | C5")
- guitarChords: Array of chords for verses and chorus (e.g. ["C", "Am", "F", "G"])
- tipForSinger: A short practical singing tip in Bengali.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let result = {};
    try {
      result = JSON.parse(response.text || '{}');
    } catch {
      result = { raw: response.text };
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating song helper:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze song',
    });
  }
});

// Setup Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
