// src/lib/llmRouter.js

const PROVIDERS = {
  OLLAMA: "ollama",
  OPENAI: "openai",
  GEMINI: "gemini",
  CLAUDE: "claude",
};

/**
 * 汎用LLM呼び出しラッパー
 * @param {string} provider - LLMプロバイダー
 * @param {string} input - ユーザー入力
 * @param {string} systemPrompt - システムプロンプト
 * @returns {Promise<string>} 応答
 */
export async function fetchLLM(provider, input, systemPrompt = "You are a helpful assistant.") {
  try {
    switch (provider) {
      case "ollama":
        return await fetchOllama(input, systemPrompt);
      case "openai":
        return await fetchOpenAI(input, systemPrompt);
      case "gemini":
        return await fetchGemini(input, systemPrompt);
      case "claude":
        return await fetchClaude(input, systemPrompt);
      default:
        throw new Error(`未対応のプロバイダ: ${provider}`);
    }
  } catch (err) {
    console.error("[fetchLLM error]", err);
    return "(先生が応答できませんでした)";
  }
}

// --- 各プロバイダー処理 ---

async function fetchOllama(input, systemPrompt) {
  const res = await fetch("http://localhost:11434/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma3:latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ],
      stream: false
    })
  });

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "(no response)";
}

async function fetchOpenAI(input, systemPrompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ],
      stream: false
    })
  });

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "(no response)";
}

async function fetchGemini(input, systemPrompt) {
  const fullPrompt = `${systemPrompt}\n\n${input}`;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }]
    })
  });

  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "(no response)";
}

async function fetchClaude(input, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-opus-20240229",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ],
      max_tokens: 1024,
      stream: false
    })
  });

  const json = await res.json();
  return json.content ?? json.choices?.[0]?.message?.content ?? "(no response)";
}
