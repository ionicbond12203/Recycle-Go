import { APP_KNOWLEDGE } from "./knowledgeBase";
// Reload trigger

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const TAVILY_KEY = process.env.EXPO_PUBLIC_TAVILY_API_KEY || "";

// Reuse for general translation/extraction
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

export async function askGemini(prompt: string, history: ChatMessage[] = []): Promise<string> {
    if (!API_KEY) {
        console.error("Missing API Key");
        return "⚠️ I need a brain! Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.";
    }

    // Using Raw REST API to avoid SDK polyfill issues in React Native
    // Model: gemini-flash-latest (Standard Free Tier)
    const url = GEMINI_URL;

    // Build history context
    const historyContext = history.map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');

    const payload = {
        contents: [{
            parts: [{
                text: `${APP_KNOWLEDGE}
        
        INSTRUCTIONS:
        1. Answer based on the Manual above, but you are also capable of normal conversation related to the app and its features.
        2. Respond in the same language the user uses or prefers (Detect from history if necessary).
        3. KEEP IT SHORT (2-3 sentences max).
        4. Use emojis 🌿💎.
        5. If the user asks about languages, inform them we support English, Mandarin, and Malay.
        6. STRICT GUARDRAIL: If the question is completely irrelevant to recycling, environmental impact, or this App, politely redirect them back to the topic.
        
        CONVERSATION HISTORY:
        ${historyContext}
        
        User Question: ${prompt}`
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return `Error: ${data.error?.message || "Unknown error"}`;
        }

        // Extract text from response
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "🤔 I'm not sure what to say.";

    } catch (error) {
        console.error("Network Error:", error);
        return "Sorry, I'm having trouble connecting. 📡";
    }
}

// Streaming endpoint for token-by-token responses
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${API_KEY}`;

/**
 * Stream a response from Gemini token-by-token using XHR (React Native compatible).
 * Uses XMLHttpRequest readyState 3 (LOADING) for incremental reading since
 * React Native's fetch() does not support ReadableStream on response.body.
 *
 * @param onChunk Called with each text delta as it arrives.
 * @param modelVersion Optional override for the model to use (for fallback handling)
 * @returns The full accumulated response text.
 */
export function askGeminiStream(
    prompt: string,
    history: ChatMessage[] = [],
    onChunk: (chunk: string) => void,
    modelVersion: string = "gemini-flash-latest"
): Promise<string> {
    if (!API_KEY) {
        const fallback = "⚠️ I need a brain! Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.";
        onChunk(fallback);
        return Promise.resolve(fallback);
    }

    const historyContext = history.map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    const dynamicUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:streamGenerateContent?alt=sse&key=${API_KEY}`;

    const payload = {
        contents: [{
            parts: [{
                text: `${APP_KNOWLEDGE}
        
        INSTRUCTIONS:
        1. Answer based on the Manual above, but you are also capable of normal conversation related to the app and its features.
        2. Respond in the same language the user uses or prefers (Detect from history if necessary).
        3. KEEP IT SHORT (2-3 sentences max).
        4. Use emojis 🌿💎.
        5. If the user asks about languages, inform them we support English, Mandarin, and Malay.
        6. STRICT GUARDRAIL: If the question is completely irrelevant to recycling, environmental impact, or this App, politely redirect them back to the topic.
        
        CONVERSATION HISTORY:
        ${historyContext}
        
        User Question: ${prompt}`
            }]
        }]
    };

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let lastIndex = 0;
        let accumulated = "";

        xhr.open("POST", dynamicUrl);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = () => {
            // readyState 3 = LOADING (partial data available)
            if (xhr.readyState === 3 || xhr.readyState === 4) {
                const newData = xhr.responseText.substring(lastIndex);
                lastIndex = xhr.responseText.length;

                // Parse SSE lines from the new chunk
                // We need to handle incomplete chunks where the JSON might be cut off
                const lines = newData.split("\n");
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data: ")) continue;

                    const jsonStr = trimmed.slice(6);
                    if (jsonStr === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(jsonStr);
                        const textDelta = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (textDelta) {
                            accumulated += textDelta;
                            onChunk(textDelta);
                        }
                    } catch (e) {
                        // Partial or malformed JSON line snippet, skip until we get the whole piece
                        // Reset lastIndex back so we read this part again when more data arrives
                        lastIndex -= line.length + 1;
                    }
                }
            }

            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(accumulated || "🤔 I'm not sure what to say.");
                } else if (xhr.status === 429) {
                    // If we hit rate limit using the primary model, try the secondary model if we haven't already
                    if (modelVersion === "gemini-flash-latest") {
                        console.warn("gemini-flash-latest rate limited, trying fallback...");

                        // We reset the stream internally by calling this very function again
                        // but with the older model
                        // Note: accumulated context up to now isn't passed down, but that's fine as
                        // the error triggers before any SSE data is sent.
                        askGeminiStream(prompt, history, onChunk, "gemini-flash-lite-latest")
                            .then(resolve)
                            .catch(reject);
                    } else {
                        // both failed, reject upward to EcoBot.tsx so LocalLLM handles it
                        reject(new Error("RATE_LIMIT"));
                    }
                } else {
                    console.error("Gemini Stream XHR Error:", xhr.status, xhr.responseText.substring(0, 500));
                    // Fall back to non-streaming if unexpected server error
                    askGemini(prompt, history)
                        .then((reply) => { onChunk(reply); resolve(reply); })
                        .catch(() => {
                            const msg = "Sorry, I'm having trouble connecting. 📡";
                            onChunk(msg);
                            resolve(msg);
                        });
                }
            }
        };

        xhr.onerror = () => {
            console.error("XHR stream network error");
            // Fall back to non-streaming
            askGemini(prompt, history)
                .then((reply) => { onChunk(reply); resolve(reply); })
                .catch(() => {
                    const msg = "Sorry, I'm having trouble connecting. 📡";
                    onChunk(msg);
                    resolve(msg);
                });
        };

        xhr.send(JSON.stringify(payload));
    });
}

// Using Tavily Search API for real-time web results
export async function getDailyTip(language: 'en' | 'zh' | 'ms' = 'en'): Promise<{ tip: string; url: string }> {
    if (!TAVILY_KEY) {
        console.warn("Missing Tavily Key, using fallback");
        return { tip: "Recycling saves energy!", url: "https://www.google.com/search?q=recycling+tips" };
    }

    // Configuration based on language
    const langConfig = {
        en: {
            queries: [
                "recycling news Malaysia",
                "plastic recycling initiatives Malaysia",
                "waste management updates Malaysia",
                "sustainability tips for Malaysians",
                "e-waste recycling centers Malaysia"
            ],
            domains: ["thestar.com.my", "nst.com.my", "malaysiakini.com", "resource-recycling.com", "waste360.com"]
        },
        zh: {
            queries: [
                "Malaysia recycling UEC environmental education",
                "Malaysia green economy policy recycling",
                "Malaysia waste sorting success stories",
                "Malaysia environmental protection economic issues",
                "Malaysia circular economy info"
            ],
            domains: ["sinchew.com.my", "orientaldaily.com.my", "chinapress.com.my", "enanyang.my", "bernama.com", "berita.rtm.gov.my"]
        },
        ms: {
            queries: [
                "berita kitar semula malaysia",
                "inisiatif sisa sifar malaysia",
                "pengurusan sampah lestari malaysia",
                "tips alam sekitar malaysia",
                "kitar semula sisa elektronik malaysia"
            ],
            domains: ["bharian.com.my", "hmetro.com.my", "utusan.com.my", "kosmo.com.my"]
        }
    };

    const config = langConfig[language] || langConfig.en;
    const randomQuery = config.queries[Math.floor(Math.random() * config.queries.length)];
    const trustedDomains = config.domains;

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: TAVILY_KEY,
                query: randomQuery,
                search_depth: "basic",
                max_results: 1,
                include_domains: trustedDomains
            })
        });

        const data = await response.json();
        const result = data.results?.[0];

        if (result) {
            // Use Gemini to EXTRACT the tip and TRANSLATE in one go
            // This filters out "Newsletter", "Weekly" noise and ensures proper language
            const langMap: Record<string, string> = { en: 'English', zh: 'Simplified Chinese', ms: 'Malay' };
            const targetLangName = langMap[language] || 'English';

            const extractionPayload = {
                contents: [{
                    parts: [{
                        text: `You are a strict data extraction tool.
                        
                        TASK: 
                        1. Detect the language of the provided TEXT below.
                        2. If the TEXT language DOES NOT MATCH "${targetLangName}", return EXACTLY the word: "FALLBACK".
                        3. If it MATCHES, extract a concise recycling tip or news fact strictly from that TEXT.
                        
                        RULES:
                        - DO NOT use outside knowledge.
                        - DO NOT translate the information if the source language is different. 
                        - The output MUST be in ${targetLangName}.
                        - FILTER OUT all noise: newsletter signups, website UI, ads.
                        - Keep it concise (2-3 sentences max).
                        - Ground all numbers and facts in the provided text.

                        TEXT TO ANALYZE AND EXTRACT FROM:
                        ${result.content.substring(0, 1500)}`
                    }]
                }]
            };

            try {
                const geminiResp = await fetch(GEMINI_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(extractionPayload)
                });
                const geminiData = await geminiResp.json();
                const extractedTip = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

                if (extractedTip && !extractedTip.includes("FALLBACK")) {
                    return {
                        tip: extractedTip,
                        url: result.url
                    };
                }
            } catch (err) {
                console.error("Gemini Extraction Error:", err);
            }

            // Fallback if Gemini fails but we have search text (though it might be noisy)
            return {
                tip: result.content.substring(0, 120) + "...",
                url: result.url
            };
        }

        const defaultTips: Record<string, string> = {
            en: "Reduce, Reuse, Recycle! Every item counts in building a sustainable Malaysia. 🌿",
            zh: "Reduce, Reuse, Recycle! Every item counts in building a sustainable Malaysia. 🌿",
            ms: "Kurangkan, Guna Semula, Kitar Semula! Setiap item penting dalam membina Malaysia yang lestari. 🌿"
        };
        return { tip: defaultTips[language] || defaultTips.en, url: "https://www.google.com/search?q=recycling+malaysia" };
    } catch (e) {
        console.error("Tavily Error:", e);
        const fallbackTips: Record<string, string> = {
            en: "Keep our planet clean! 🌍",
            zh: "Keep our planet clean! 🌍",
            ms: "Jaga kebersihan bumi kita! 🌍"
        };
        return { tip: fallbackTips[language] || fallbackTips.en, url: "https://www.google.com/search?q=recycling+tips" };
    }
}

export async function askEcoAgent(prompt: string, history: ChatMessage[] = [], userStats?: { points: number, savedCO2: string, recycled: string }): Promise<string> {
    const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
    const contents = history.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const systemText = `You are the Recycle-Go smart assistant. If the user's instructions contain clear business intent (checkout, check stats, rush order, scan), be sure to call the corresponding function, do not be verbose.
The current user's real environmental data is as follows (if the user asks, tell them in a gentle encouraging tone with emojis, do not call any tools to answer directly):
- Eco Points: ${userStats?.points || 0}
- Total CO2 Saved: ${userStats?.savedCO2 || '0kg'}
- Total Recycled Count: ${userStats?.recycled || '0'} times`;

    const payload = {
        systemInstruction: { parts: [{ text: systemText }] },
        contents: contents,
        tools: [{
            functionDeclarations: [
                {
                    name: "schedulePickup",
                    description: "Call when the user explicitly states they have recyclables at home to be collected or want to request a pickup. Must extract the type of material they want to recycle.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            materialType: { type: "STRING", description: "Example: plastic bottles, cardboard boxes, etc." }
                        },
                        required: ["materialType"]
                    }
                },
                {
                    name: "openScanner",
                    description: "Call when the user asks to scan, take an image to identify an item, or determines if it's recyclable. Used to open the camera for the user.",
                    parameters: { type: "OBJECT", properties: {} }
                },
                {
                    name: "openCart",
                    description: "Call when the user asks to enter the cart, view the list, checkout, or go to the dispatch page.",
                    parameters: { type: "OBJECT", properties: {} }
                },
                {
                    name: "viewProfile",
                    description: "Call when the user asks to view their history, navigate to the profile details page, or view account settings.",
                    parameters: { type: "OBJECT", properties: {} }
                },
                {
                    name: "trackDriver",
                    description: "Call when the user asks to track the driver's location, view the map, rush an order, or contact the driver.",
                    parameters: { type: "OBJECT", properties: {} }
                }
            ]
        }]
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        // If API returns an error (e.g., incorrect model name, insufficient quota), display it directly on the screen
        if (!response.ok) {
            console.error("API returned error:", data);
            return `⚠️ API encountered an error: ${data.error?.message || JSON.stringify(data)}`;
        }

        const candidate = data?.candidates?.[0];

        if (candidate?.content?.parts?.[0]?.functionCall) {
            const fnCall = candidate.content.parts[0].functionCall;
            if (fnCall.name === "schedulePickup") {
                const material = fnCall.args.materialType;
                console.log(`\n\n🎯 [AGENT FUNCTION INTERCEPT]: Intercepted business intent! Extracted material type -> ${material}\n\n`);
                return `✅ Got it, I have directly triggered the dispatch interceptor program and called a driver to collect [${material}]!`;
            }
            if (fnCall.name === "openScanner") {
                console.log(`\n\n🎯 [AGENT FUNCTION INTERCEPT]: Intercepted auto-scan intent!\n\n`);
                return `[ACTION_SCAN]✅ No problem, opening the AI scan camera for you! Please point it at your item 📸`;
            }
            if (fnCall.name === "openCart") {
                console.log(`\n\n🎯 [AGENT FUNCTION INTERCEPT]: Intercepted open cart intent!\n\n`);
                return `[ACTION_OPEN_CART]🛒 Taking you to the checkout list page...`;
            }
            if (fnCall.name === "viewProfile") {
                console.log(`\n\n🎯 [AGENT FUNCTION INTERCEPT]: Intercepted view profile intent!\n\n`);
                return `[ACTION_VIEW_PROFILE]📊 Opening your personal eco-stats dashboard...`;
            }
            if (fnCall.name === "trackDriver") {
                console.log(`\n\n🎯 [AGENT FUNCTION INTERCEPT]: Intercepted track driver intent!\n\n`);
                return `[ACTION_TRACK_DRIVER]🚚 Taking you to the real-time map to track the driver's location!`;
            }
        }
        return candidate?.content?.parts?.[0]?.text || "🤔 I'm not sure what to say.";
    } catch (e) {
        console.error("Agent crashed:", e);
        return "Sorry, my smart brain just short-circuited 📡";
    }
}
