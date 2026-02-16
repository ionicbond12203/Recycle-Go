import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, LlamaContext } from 'llama.rn';
import { Platform } from 'react-native';
import { APP_KNOWLEDGE } from './knowledgeBase';

const MODEL_FILENAME = 'Qwen3-0.6B-Q8_0.gguf';
// Android bundles assets at this URI scheme
const ANDROID_ASSET_URI = `asset:/LLM/${MODEL_FILENAME}`;

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

let context: LlamaContext | null = null;
let isLoading = false;
let loadError: string | null = null;

// ChatML Tags for Qwen
const IM_START = '<' + '|im_start|' + '>';
const IM_END = '<' + '|im_end|' + '>';

// Common LLM stop tokens
const STOP_WORDS = [
    IM_END,
    '<' + '/s' + '>',
    '<' + '|end_of_text|' + '>',
    '<' + '|eot_id|' + '>',
    '<' + '|end|' + '>',
    '<' + '|EOT|' + '>',
    '<' + '|END_OF_TURN_TOKEN|' + '>',
    '<' + '|end_of_turn|' + '>',
    '<' + '|endoftext|' + '>',
];

// Cleaned up prompt to remove redundancy with APP_KNOWLEDGE
const SYSTEM_PROMPT = `CORE INSTRUCTIONS:
- Answer ONLY based on the Knowledge Base.
- If asking about 'Where' or 'How' to recycle, refer to the !SCAN! feature (Section 2).
- There are no physical centers; we collect from the user's location.
- Use the EXACT SAME language as the user (English/Malay/Chinese).
- Keep responses under 3 sentences + emojis ♻️.
- CONTACT REQUESTS: If asked how to contact the developer or IONIC, provide the email (ionicb83@gmail.com) and GitHub (github.com/ionicbond12203/Recycle-Go). End the message with [CONTACT_ACTION].

KNOWLEDGE BASE:
${APP_KNOWLEDGE}`;

/**
 * Helper to get the model path, ensuring documentDirectory is ready.
 */
function getModelPaths() {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) throw new Error('FileSystem.documentDirectory is not available');
    const modelDir = docDir + 'LLM/';
    const modelPath = modelDir + 'Qwen3-0.6B-Q8_0.gguf';
    return { modelDir, modelPath };
}

/**
 * Format conversation history into ChatML string for Qwen.
 */
function formatChatML(prompt: string, history: ChatMessage[]): string {
    let formatted = `${IM_START}system\n${SYSTEM_PROMPT}${IM_END}\n`;

    for (const msg of history) {
        const role = msg.sender === 'user' ? 'user' : 'assistant';
        formatted += `${IM_START}${role}\n${msg.text}${IM_END}\n`;
    }

    formatted += `${IM_START}user\n${prompt}${IM_END}\n${IM_START}assistant\n`;
    return formatted;
}

/**
 * Initialize the LLama context (singleton).
 */
export async function ensureModelLoaded(): Promise<LlamaContext> {
    if (context) return context;
    if (loadError) throw new Error(loadError);
    if (isLoading) {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (context) { clearInterval(interval); resolve(context); }
                if (loadError) { clearInterval(interval); reject(new Error(loadError)); }
            }, 200);
        });
    }

    isLoading = true;
    try {
        const { modelDir, modelPath } = getModelPaths();

        // 1. Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(modelDir);
        if (!dirInfo.exists) {
            console.log('[LocalLLM] Creating model directory:', modelDir);
            await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
        }

        // 2. Check if model exists in storage
        const modelInfo = await FileSystem.getInfoAsync(modelPath);
        if (!modelInfo.exists) {
            console.log('[LocalLLM] Model missing from storage. Copying from bundled assets...');

            if (Platform.OS === 'android') {
                // Copy directly from Android's asset:/ URI
                await FileSystem.copyAsync({
                    from: ANDROID_ASSET_URI,
                    to: modelPath
                });
                console.log('[LocalLLM] Model copied from assets successfully.');
            } else {
                throw new Error('Model file not found. Only Android asset copying is supported.');
            }
        }

        console.log('[LocalLLM] Initializing llama with model:', modelPath);

        context = await initLlama({
            model: modelPath,
            use_mlock: true,
            n_ctx: 2048,
            n_gpu_layers: 99,
        });

        console.log('[LocalLLM] Model loaded successfully!');
        return context;
    } catch (error: any) {
        loadError = `Failed to load model: ${error.message}`;
        console.error('[LocalLLM]', loadError);
        throw error;
    } finally {
        isLoading = false;
    }
}

/**
 * Send a chat message with ChatML string formatting for peak performance.
 */
export async function askLocalLLM(
    prompt: string,
    history: ChatMessage[] = [],
    onToken: (token: string) => void
): Promise<string> {
    const ctx = await ensureModelLoaded();

    // Fix: llama.rn completion takes string prompt, not objects array
    const chatMLPrompt = formatChatML(prompt, history);

    const OPEN_THINK = '<' + 'think' + '>';
    const CLOSE_THINK = '<' + '/think' + '>';

    const result = await ctx.completion(
        {
            prompt: chatMLPrompt,
            n_predict: 256,
            stop: STOP_WORDS,
            temperature: 0.5,
        },
        (() => {
            let insideThink = false;
            let buffer = '';
            return (data: { token: string }) => {
                buffer += data.token;
                if (buffer.includes(OPEN_THINK)) {
                    insideThink = true;
                    buffer = '';
                    return;
                }
                if (insideThink && buffer.includes(CLOSE_THINK)) {
                    insideThink = false;
                    const afterThink = buffer.split(CLOSE_THINK).pop() || '';
                    buffer = '';
                    if (afterThink.trim()) onToken(afterThink);
                    return;
                }
                if (insideThink) {
                    if (buffer.length > 20) buffer = buffer.slice(-20);
                    return;
                }
                buffer = '';
                onToken(data.token);
            };
        })(),
    );

    console.log('[LocalLLM] Timings:', result.timings);

    // Clean final response by stripping anything between <think> tags
    const cleanText = result.text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
    return cleanText;
}

export async function releaseModel(): Promise<void> {
    if (context) {
        await context.release();
        context = null;
        loadError = null;
    }
}
