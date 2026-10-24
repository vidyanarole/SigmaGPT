import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MAX_HISTORY = 20;

// Configurable AI provider helper (supports Groq, OpenAI, and OpenRouter)
const getProviderConfig = () => {
  const provider = (process.env.AI_PROVIDER || "groq").trim().toLowerCase();

  if (provider === "groq") {
    return {
      name: "Groq",
      endpoint: process.env.AI_API_URL || "https://api.groq.com/openai/v1/chat/completions",
      model: process.env.AI_MODEL || "qwen/qwen3.8-27b",
      apiKey: (process.env.GROQ_API_KEY || "").trim(),
      envKeyName: "GROQ_API_KEY",
      placeholderPrefix: "your_groq_api_key",
      docsUrl: "https://console.groq.com/keys",
    };
  }

  if (provider === "openrouter") {
    return {
      name: "OpenRouter",
      endpoint: process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions",
      model: process.env.AI_MODEL || "meta-llama/llama-3.2-3b-instruct:free",
      apiKey: (process.env.OPENROUTER_API_KEY || "").trim(),
      envKeyName: "OPENROUTER_API_KEY",
      placeholderPrefix: "your_openrouter_api_key",
      docsUrl: "https://openrouter.ai/keys",
    };
  }

  // Default: OpenAI
  return {
    name: "OpenAI",
    endpoint: process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions",
    model: process.env.AI_MODEL || "gpt-4o-mini",
    apiKey: (process.env.OPENAI_API_KEY || "").trim(),
    envKeyName: "OPENAI_API_KEY",
    placeholderPrefix: "your_openai_api_key",
    docsUrl: "https://platform.openai.com/api-keys",
  };
};

const getOpenAIAPIResponse = async (input) => {
  const config = getProviderConfig();
  const apiKey = config.apiKey;

  const isMissingOrPlaceholder = !apiKey ||
    apiKey.includes("your_") ||
    apiKey.includes("placeholder") ||
    apiKey.includes(config.placeholderPrefix);

  if (isMissingOrPlaceholder) {
    console.error(`❌ ${config.name} API key is missing or using placeholder (${config.envKeyName}) in Backend/.env`);
    return {
      success: false,
      status: 401,
      error: `AI service (${config.name}) is not configured. Please add your ${config.envKeyName} in Backend/.env (obtain free keys at ${config.docsUrl}).`
    };
  }

  let formattedMessages = [];

  if (Array.isArray(input)) {
    formattedMessages = input
      .filter((msg) => msg && (msg.role === "user" || msg.role === "assistant" || msg.role === "system") && typeof msg.content === "string")
      .map((msg) => ({
        role: msg.role,
        content: msg.content.trim()
      }))
      .slice(-MAX_HISTORY);
  } else if (typeof input === "string") {
    formattedMessages = [{ role: "user", content: input.trim() }];
  }

  if (formattedMessages.length === 0) {
    console.error("❌ No valid messages provided to AI API");
    return {
      success: false,
      status: 400,
      error: "No valid messages provided for AI completion."
    };
  }

  try {
    const response = await fetch(
      config.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: formattedMessages,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiMessage = errorData?.error?.message || response.statusText;
      console.error(`❌ ${config.name} API returned status ${response.status}:`, apiMessage);

      let userMessage = `${config.name} request failed.`;
      if (response.status === 401) {
        userMessage = `Invalid ${config.name} API key. Please check your credentials in Backend/.env (${config.docsUrl}).`;
      } else if (response.status === 429) {
        userMessage = `${config.name} quota or rate limit exceeded. Please check your provider account details.`;
      } else if (response.status >= 500) {
        userMessage = `${config.name} service is temporarily unavailable. Please try again shortly.`;
      } else {
        userMessage = `${config.name} API error (${response.status}): ${apiMessage}`;
      }

      return {
        success: false,
        status: response.status === 401 ? 401 : (response.status === 429 ? 429 : 502),
        error: userMessage
      };
    }

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      console.error(`❌ Invalid response structure from ${config.name} API`);
      return {
        success: false,
        status: 502,
        error: `Invalid response format received from ${config.name}.`
      };
    }

    return {
      success: true,
      content: data.choices[0].message.content
    };

  } catch (error) {
    console.error(`❌ ${config.name} request failed:`, error.message || error);
    return {
      success: false,
      status: 503,
      error: `Could not connect to ${config.name} API. Please check your network connection.`
    };
  }
};

export default getOpenAIAPIResponse;
