/**
 * AI Service Integration (Practical 13)
 * Provides AI-powered task description and attribute generation
 * with server-side API key management, rate limiting, and graceful degradation.
 */

// In-memory rate limiting store: Map<identifier, timestamp[]>
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

/**
 * Check if a client has exceeded the AI generation rate limit.
 * @param {string} identifier IP address or User ID
 * @returns {{ limited: boolean, retryAfter?: number }}
 */
function checkRateLimit(identifier) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];

  // Filter timestamps within the current sliding window
  const activeTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = activeTimestamps[0];
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000);
    return { limited: true, retryAfter };
  }

  activeTimestamps.push(now);
  rateLimitMap.set(identifier, activeTimestamps);
  return { limited: false };
}

/**
 * Deterministic local fallback generator for graceful degradation.
 * Ensures the application remains fully functional even if external AI APIs fail.
 * @param {string} title Task title
 * @returns {string}
 */
function generateLocalFallback(title) {
  const trimmed = (title || '').trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('fix') || lower.includes('bug') || lower.includes('issue')) {
    return `Investigate root cause, replicate the issue in a local environment, implement fix for "${trimmed}", and verify with unit tests.`;
  }
  if (lower.startsWith('test') || lower.includes('jest') || lower.includes('ci')) {
    return `Write unit and integration test assertions covering edge cases and error paths for "${trimmed}".`;
  }
  if (lower.startsWith('deploy') || lower.includes('docker') || lower.includes('pipeline')) {
    return `Verify container build, configure environment variables, and orchestrate automated deployment steps for "${trimmed}".`;
  }
  return `Review requirements, draft implementation plan, execute deliverables, and verify completion criteria for: ${trimmed}.`;
}

/**
 * Core function to generate an AI-powered task description.
 * Supports Groq, OpenAI, and Gemini API keys transparently.
 *
 * @param {string} title Task title
 * @param {string} [identifier='anonymous'] Client IP or User ID for rate limiting
 * @returns {Promise<{ description: string, fallback: boolean, source: string, disclaimer: string, message?: string }>}
 */
async function generateDescription(title, identifier = 'anonymous') {
  const DISCLAIMER = 'Notice: AI-generated suggestions should be reviewed and verified by the user before saving.';

  if (!title || typeof title !== 'string' || !title.trim()) {
    return {
      description: '',
      fallback: true,
      source: 'none',
      disclaimer: DISCLAIMER,
      message: 'Task title is required to generate description.'
    };
  }

  const cleanTitle = title.trim();

  // 1. Enforce Rate Limiting (Supplementary Problem)
  const rateLimitStatus = checkRateLimit(identifier);
  if (rateLimitStatus.limited) {
    console.warn(`[AI Rate Limit] Client "${identifier}" exceeded rate limit. Using fallback.`);
    return {
      description: generateLocalFallback(cleanTitle),
      fallback: true,
      source: 'local_fallback_rate_limited',
      disclaimer: DISCLAIMER,
      message: `Rate limit reached. Please wait ${rateLimitStatus.retryAfter}s before making new AI requests.`
    };
  }

  // 2. Resolve server-side API Key (never exposed to frontend)
  const apiKey = (
    process.env.AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    console.warn('[AI Service] No external AI API key configured in .env. Using graceful fallback.');
    return {
      description: generateLocalFallback(cleanTitle),
      fallback: true,
      source: 'local_fallback',
      disclaimer: DISCLAIMER,
      message: 'AI API key not configured. Generated local fallback description.'
    };
  }

  // 3. Call External AI Service with Timeout Controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    let generatedText = '';

    if (apiKey.startsWith('gsk_')) {
      // Groq Cloud (OpenAI-compatible)
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent task management assistant. Generate a concise, practical 1-2 sentence description for a task based on its title. Do not wrap in quotes or add preamble.'
            },
            {
              role: 'user',
              content: `Task Title: ${cleanTitle}`
            }
          ]
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Groq API responded with HTTP ${res.status}: ${errorBody}`);
      }

      const data = await res.json();
      generatedText = data.choices?.[0]?.message?.content?.trim() || '';
    } else if (apiKey.startsWith('AIzaSy')) {
      // Google Gemini API
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `Generate a concise 1-2 sentence actionable task description for: "${cleanTitle}". Output only the description.` }]
            }
          ]
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Gemini API responded with HTTP ${res.status}: ${errorBody}`);
      }

      const data = await res.json();
      generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } else {
      // Standard OpenAI API
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent task management assistant. Generate a concise, practical 1-2 sentence description for a task based on its title. Do not wrap in quotes or add preamble.'
            },
            {
              role: 'user',
              content: `Task Title: ${cleanTitle}`
            }
          ]
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`OpenAI API responded with HTTP ${res.status}: ${errorBody}`);
      }

      const data = await res.json();
      generatedText = data.choices?.[0]?.message?.content?.trim() || '';
    }

    clearTimeout(timeoutId);

    if (!generatedText) {
      throw new Error('AI provider returned empty response content.');
    }

    return {
      description: generatedText,
      fallback: false,
      source: 'ai_generated',
      disclaimer: DISCLAIMER
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[AI Service Error]:', err.name === 'AbortError' ? 'Request timed out after 8s' : err.message);

    // Graceful Degradation: return deterministic fallback without crashing the app
    return {
      description: generateLocalFallback(cleanTitle),
      fallback: true,
      source: 'local_fallback',
      disclaimer: DISCLAIMER,
      message: `AI service unavailable (${err.name === 'AbortError' ? 'Timeout' : 'Network/Key error'}). Fallback suggestion provided.`
    };
  }
}

module.exports = {
  generateDescription,
  generateLocalFallback,
  checkRateLimit
};

