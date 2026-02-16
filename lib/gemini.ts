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
 * @returns The full accumulated response text.
 */
export function askGeminiStream(
    prompt: string,
    history: ChatMessage[] = [],
    onChunk: (chunk: string) => void
): Promise<string> {
    if (!API_KEY) {
        const fallback = "⚠️ I need a brain! Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.";
        onChunk(fallback);
        return Promise.resolve(fallback);
    }

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

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let lastIndex = 0;
        let accumulated = "";

        xhr.open("POST", GEMINI_STREAM_URL);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = () => {
            // readyState 3 = LOADING (partial data available)
            if (xhr.readyState === 3 || xhr.readyState === 4) {
                const newData = xhr.responseText.substring(lastIndex);
                lastIndex = xhr.responseText.length;

                if (newData) {
                    // Parse SSE lines from the new chunk
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
                        } catch {
                            // Partial or malformed JSON line, skip
                        }
                    }
                }
            }

            // Done
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(accumulated || "🤔 I'm not sure what to say.");
                } else {
                    console.error("Gemini Stream XHR Error:", xhr.status, xhr.responseText.substring(0, 500));
                    // Fall back to non-streaming
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
                "马来西亚 再循环 统考 环保教育",
                "马来西亚 绿色经济 政策  recycling",
                "马来西亚 垃圾分类 成功案例",
                "马来西亚 环境保护 经济议题",
                "马来西亚 循环经济 资讯"
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
            zh: "减少、再利用、回收！每一件物品都在为建设可持续发展的马来西亚做贡献。🌿",
            ms: "Kurangkan, Guna Semula, Kitar Semula! Setiap item penting dalam membina Malaysia yang lestari. 🌿"
        };
        return { tip: defaultTips[language] || defaultTips.en, url: "https://www.google.com/search?q=recycling+malaysia" };
    } catch (e) {
        console.error("Tavily Error:", e);
        const fallbackTips: Record<string, string> = {
            en: "Keep our planet clean! 🌍",
            zh: "保持我们的地球清洁！🌍",
            ms: "Jaga kebersihan bumi kita! 🌍"
        };
        return { tip: fallbackTips[language] || fallbackTips.en, url: "https://www.google.com/search?q=recycling+tips" };
    }
}
