import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import mammoth from "mammoth";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const upload = multer({ storage: multer.memoryStorage() });

  app.use(express.json());

  // API Route: Parse CV File
  app.post("/api/parse-cv", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let text = "";
      const buffer = req.file.buffer;
      const mimetype = req.file.mimetype;

      if (mimetype === "application/pdf") {
        const data = await pdf(buffer);
        text = data.text;
      } else if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimetype === "application/msword"
      ) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      res.json({ text });
    } catch (error) {
      console.error("Error parsing CV:", error);
      res.status(500).json({ error: "Failed to parse CV" });
    }
  });

  // API Route: Fetch Job Description from URL
  app.post("/api/fetch-jd", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      const $ = cheerio.load(response.data);

      // Try to find the main content. This is heuristic-based.
      // Many job boards use specific selectors, but a general approach is to get text from common containers.
      // We'll remove scripts, styles, and nav elements first.
      $("script, style, nav, footer, header, noscript").remove();
      
      // Get text from body or a main container if it exists
      const text = $("body").text().replace(/\s+/g, " ").trim();
      
      // We'll send the raw-ish text and let Gemini extract the JD part.
      res.json({ text: text.substring(0, 10000) }); // Limit text size
    } catch (error) {
      console.error("Error fetching JD:", error);
      res.status(500).json({ error: "Failed to fetch job description" });
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
