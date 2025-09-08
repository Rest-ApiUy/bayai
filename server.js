
import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";


dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;


app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));


// Serve static frontend
const __dirname = process.cwd();
app.use(express.static(path.join(__dirname, "public")));


// Health check
app.get("/api/health", (req, res) => {
res.json({ ok: true, time: new Date().toISOString() });
});


// Unified chat endpoint
app.post("/api/chat", async (req, res) => {
try {
const { provider = "openai", messages = [], maxTokens = 512, temperature = 0.7 } = req.body || {};


if (!Array.isArray(messages) || messages.length === 0) {
return res.status(400).json({ error: "messages[] required: [{ role, content }]" });
}


const text = await routeToProvider({ provider, messages, maxTokens, temperature });
return res.json({ provider, reply: text });
} catch (err) {
console.error(err);
res.status(500).json({ error: err?.message || "Server error" });
}
});


app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));


// ---- Provider Router ----
async function routeToProvider({ provider, messages, maxTokens, temperature }) {
switch (provider) {
case "openai":
return chatOpenAI({ messages, maxTokens, temperature });
case "anthropic":
return chatAnthropic({ messages, maxTokens, temperature });
case "gemini":
return chatGemini({ messages, maxTokens, temperature });
default:
throw new Error(`Unsupported provider: ${provider}`);
}
}


// ---- OpenAI (Chat Completions) ----
async function chatOpenAI({ messages, maxTokens, temperature }) {
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("Missing OPENAI_API_KEY");


const resp = await fetch("https://api.openai.com/v1/chat/completions", {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${apiKey}`,
},
body: JSON.stringify({
model: "gpt-4o-mini",
messages,
max_tokens: maxTokens,
temperature,
}),
});


if (!resp.ok) {
const errText = await resp.text();
throw new Error(`OpenAI error: ${resp.status} ${errText}`);
}


}
