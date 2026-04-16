// Gemini Multimodal Live API Client (WebSocket)
// Model: gemini-live-2.5-flash-native-audio
// Protocol: Gemini Live WebSocket

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const LIVE_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.MultimodalLive?key=${API_KEY}`;

export interface LiveResponse {
    action?: string;
    material?: string;
    responseMsg?: string;
    error?: string;
}

/**
 * Gemini Live Client
 * Manages the WebSocket connection for real-time multimodal interaction.
 */
export class GeminiLiveClient {
    private ws: WebSocket | null = null;
    private onResponse: (resp: LiveResponse) => void;
    private isConnected = false;

    constructor(onResponse: (resp: LiveResponse) => void) {
        this.onResponse = onResponse;
    }

    async connect() {
        if (this.isConnected) return;

        return new Promise((resolve, reject) => {
            console.log("🔗 Connecting to Gemini Live WebSocket...");
            this.ws = new WebSocket(LIVE_URL);

            this.ws.onopen = () => {
                console.log("✅ Gemini Live Connected");
                this.isConnected = true;
                this.sendSetup();
                resolve(true);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = (e) => {
                console.error("❌ WebSocket Error:", e);
                reject(e);
            };

            this.ws.onclose = () => {
                console.log("🔌 WebSocket Closed");
                this.isConnected = false;
            };
        });
    }

    private sendSetup() {
        const setupMessage = {
            setup: {
                model: "models/gemini-2.0-flash-exp", // Standard dev model ID that supports Live
                generation_config: {
                    response_mime_type: "application/json",
                },
                system_instruction: {
                  parts: [{
                    text: `You are a voice command parser for the Recycle-Go app.
Listen to the user's audio and extract intent.
Map intent to exactly ONE action:
- [ACTION_SCAN] (camera/scan)
- [ACTION_OPEN_CART] (cart/checkout)
- [ACTION_VIEW_PROFILE] (profile/points)
- [ACTION_TRACK_DRIVER] (tracker/map)
- schedulePickup (pickup request)
- chat (general question)

Output JSON:
{
  "action": "[TAG]",
  "material": "...",
  "responseMsg": "Friendly response with emojis 🌿"
}`
                  }]
                }
            }
        };
        this.ws?.send(JSON.stringify(setupMessage));
    }

    sendAudio(base64Pcm: string) {
        if (!this.isConnected) {
            console.error("Not connected to Gemini Live");
            return;
        }

        const message = {
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: "audio/pcm;rate=16000",
                        data: base64Pcm
                    }
                ]
            }
        };
        this.ws?.send(JSON.stringify(message));
    }

    private handleMessage(data: string) {
        try {
            const parsed = JSON.parse(data);
            
            // The Live API returns messages in segments
            // Look for model_turn with parts[0].text
            if (parsed.serverContent?.modelTurn?.parts?.[0]?.text) {
                const text = parsed.serverContent.modelTurn.parts[0].text;
                try {
                    const json = JSON.parse(text);
                    this.onResponse(json);
                } catch {
                    // If it's not valid JSON, it might be a partial or just text
                    this.onResponse({ responseMsg: text });
                }
            }
            
            if (parsed.serverContent?.turnComplete) {
                // Done
            }
        } catch (e) {
            console.error("Failed to parse Live message:", e);
        }
    }

    close() {
        this.ws?.close();
        this.ws = null;
    }
}
