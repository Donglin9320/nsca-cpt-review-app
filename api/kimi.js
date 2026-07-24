const MAX_PROMPT_LENGTH = 8000;
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "z-ai/glm-5.2";

function sendJson(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function readPrompt(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  return typeof body.prompt === "string" ? body.prompt.trim() : "";
}

function answerText(messageContent) {
  if (typeof messageContent === "string") return messageContent.trim();
  if (!Array.isArray(messageContent)) return "";
  return messageContent
    .map((item) => (typeof item === "string" ? item : item?.text || ""))
    .join("")
    .trim();
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "只支持 POST 请求。" });
    return;
  }

  const prompt = readPrompt(request.body);
  if (!prompt) {
    sendJson(response, 400, { error: "缺少题目内容。" });
    return;
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    sendJson(response, 413, { error: "题目内容过长，请缩短后再试。" });
    return;
  }

  const accessToken = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    sendJson(response, 401, { error: "请先登录云同步。" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (!supabaseUrl || !supabaseKey || !nvidiaKey) {
    sendJson(response, 503, { error: "AI 服务尚未完成配置。" });
    return;
  }

  let user;
  try {
    const userResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!userResponse.ok) {
      sendJson(response, 401, { error: "登录已失效，请重新登录云同步。" });
      return;
    }
    user = await userResponse.json();
  } catch {
    sendJson(response, 502, { error: "暂时无法验证登录状态。" });
    return;
  }

  if (!user.email) {
    sendJson(response, 401, { error: "登录账号没有有效邮箱，请重新登录。" });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  try {
    const aiResponse = await fetch(NVIDIA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${nvidiaKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        max_tokens: 800,
        seed: 0,
        stream: false,
        temperature: 1,
        top_p: 1,
        messages: [
          {
            role: "system",
            content: [
              "你是 NSCA-CPT 中文复习助手。",
              "只回答用户提供的题目，先解释正确答案，再解释用户误选项为什么不对。",
              "使用自然、直接的中文，避免英文直译和无关延伸。",
              "回答尽量控制在 250 个汉字内；确有必要时可以稍长。",
            ].join(""),
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    const result = await aiResponse.json().catch(() => ({}));
    if (!aiResponse.ok) {
      const upstreamMessage =
        result?.error?.message || result?.detail || result?.message || result?.title || "";
      const isQuotaError = aiResponse.status === 402 || aiResponse.status === 429;
      const accessError =
        aiResponse.status === 401
          ? "NVIDIA API Key 无效，请重新生成并在 Vercel 更新。"
          : "NVIDIA 账号尚无此模型权限，或未完成试用授权。";
      sendJson(response, isQuotaError ? 429 : 502, {
        error: isQuotaError
          ? "NVIDIA 免费接口请求过于频繁，请稍后再试。"
          : aiResponse.status === 401 || aiResponse.status === 403
            ? accessError
            : `NVIDIA 请求失败（${aiResponse.status}）${upstreamMessage ? `：${upstreamMessage}` : "。"}`,
      });
      return;
    }

    const answer = answerText(result?.choices?.[0]?.message?.content);
    if (!answer) {
      sendJson(response, 502, { error: "GLM-5.2 没有返回可显示的回答。" });
      return;
    }
    sendJson(response, 200, { answer });
  } catch (error) {
    sendJson(response, 504, {
      error:
        error?.name === "AbortError" ? "GLM-5.2 响应超时，请稍后再试。" : "暂时无法连接 GLM-5.2。",
    });
  } finally {
    clearTimeout(timeout);
  }
};

module.exports._test = { answerText, readPrompt };
