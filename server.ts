import express from "express";
import path from "path";
import axios from "axios";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Real Estate Open Data Endpoint proxy
  app.get("/api/real-estate/ntpc", async (req, res) => {
    try {
      const dataPath = path.join(process.cwd(), 'src/data/ntpc-real-estate.json');
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(fileContent);
        return res.json({ status: "ok", source: "內政部實價登錄 (真實資料)", data });
      }
      res.status(500).json({ error: "Real data not found. Please run update-data.ts" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to load real data." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // ES Modules compatibility for __dirname
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
