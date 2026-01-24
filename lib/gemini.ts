import { APP_KNOWLEDGE } from "./knowledgeBase";
// Reload trigger

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const TAVILY_KEY = process.env.EXPO_PUBLIC_TAVILY_API_KEY || "";

export async function askGemini(prompt: string): Promise<string> {
    if (!API_KEY) {
        console.error("Missing API Key");
        return "⚠️ I need a brain! Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.";
    }

    // Using Raw REST API to avoid SDK polyfill issues in React Native
    // Model: gemini-flash-latest (Standard Free Tier)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{
            parts: [{
                text: `${APP_KNOWLEDGE}
        
        INSTRUCTIONS:
        1. Answer based ONLY on the Manual above.
        2. KEEP IT SHORT (2-3 sentences max).
        3. Use emojis 🌿💎.
        4. STRICT GUARDRAIL: If the question is not about this App or Recycling, reply: "I can only help with recycling questions! ♻️"
        
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

// Using Tavily Search API for real-time web results
export async function getDailyTip(): Promise<{ tip: string; url: string }> {
    if (!TAVILY_KEY) {
        console.warn("Missing Tavily Key, using fallback");
        return { tip: "Recycling saves energy!", url: "https://www.google.com/search?q=recycling+tips" };
    }

    // Randomize query to get different tips each time
    const queries = [
        "recycling news",
        "plastic recycling",
        "waste management",
        "sustainability tips",
        "recycling industry update",
        "circular economy",
        "advanced recycling",
        "e-waste recycling"
    ];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];

    // Trusted recycling news sources ONLY
    const trustedDomains = [
        "resource-recycling.com",
        "waste360.com",
        "wastedive.com",
        "recyclinginside.com",
        "recyclingtoday.com",
        "plasticstoday.com",
        "circularonline.co.uk"
    ];

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
            // Truncate if too long
            const shortTip = result.content.length > 100
                ? result.content.substring(0, 97) + "..."
                : result.content;
            return {
                tip: shortTip,
                url: result.url
            };
        }

        return { tip: "Reduce, Reuse, Recycle!", url: "https://www.google.com/search?q=recycling" };
    } catch (e) {
        console.error("Tavily Error:", e);
        return { tip: "Keep our planet clean! 🌍", url: "https://www.google.com/search?q=recycling+tips" };
    }
}
