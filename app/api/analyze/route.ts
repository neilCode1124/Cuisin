import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseDishAnalysis,
  type AnalyzeResponse,
} from "@/lib/dish-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEEPSEEK_CHAT_COMPLETIONS_URL =
  "https://api.deepseek.com/chat/completions";
const MAX_BODY_CHARS = 3_200_000;
const MAX_IMAGE_BYTES = 2_000_000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;
const DATA_URL_PATTERN =
  /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitEntries = new Map<string, RateLimitEntry>();

const requestSchema = z
  .object({
    image: z.string().min(32).max(MAX_BODY_CHARS),
  })
  .strict();

const deepSeekPrompt = `
你是中国地方菜识别专家，也是一位中文菜单命名编辑。

请完成两件事：
1. 判断照片里最可能是什么中国菜。
2. 为这道菜写一个带有法式高级餐厅气质的中文名字。

命名规则：
- 名字只能使用中文和常见中文标点，不得出现法语、拼音或英文。
- 通过词序、技法和食材搭配营造法式高级餐厅的菜单感，不要生硬添加“法式”。
- 不要解释命名过程，不要输出风味笔记、推荐语或额外文案。
- 不确认时不要编造菜品、产地或食材，将 status 设为 "uncertain"，confidence 不高于 0.69。
- 照片中没有食物时，将 status 设为 "not_food"，dish 设为 null，message 用一句简短中文说明。
- 只返回一个 JSON 对象，不要 Markdown 代码块、注释或额外文字。

严格返回以下结构：
{
  "status": "identified" | "uncertain" | "not_food",
  "message": "可选，仅用于无法识别时的简短中文说明",
  "dish": null | {
    "chineseName": "最可能的中国菜名",
    "region": "地区或菜系",
    "frenchStyleName": "全中文的法式感菜名",
    "confidence": 0.0
  }
}
`.trim();

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(clientIdentifier(request));
  if (!rateLimit.allowed) {
    return jsonError(
      "RATE_LIMITED",
      "操作太频繁，请稍后再试。",
      true,
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_CHARS) {
    return jsonError(
      "IMAGE_TOO_LARGE",
      "图片数据过大，请换一张尺寸更小的图片。",
      false,
      413,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_IMAGE", "请求格式不正确。", false, 400);
  }

  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return jsonError(
      "INVALID_IMAGE",
      "请先选择一张 JPG、PNG、WebP 或 GIF 图片。",
      false,
      400,
    );
  }

  const match = parsedBody.data.image.match(DATA_URL_PATTERN);
  if (!match) {
    return jsonError(
      "INVALID_IMAGE",
      "图片格式不受支持，请改用 JPG、PNG、WebP 或 GIF。",
      false,
      400,
    );
  }

  const mimeType = match[1];
  const base64 = match[2];
  if (Buffer.byteLength(base64, "base64") > MAX_IMAGE_BYTES) {
    return jsonError(
      "IMAGE_TOO_LARGE",
      "图片压缩后仍然过大，请选择尺寸更小的图片。",
      false,
      413,
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return jsonError(
      "CONFIG_MISSING",
      "服务端尚未配置 DEEPSEEK_API_KEY。",
      false,
      503,
    );
  }

  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-flash";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  try {
    const upstream = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: deepSeekPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        thinking: {
          type: "disabled",
        },
      }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!upstream.ok) {
      console.error("DeepSeek analysis request failed", {
        status: upstream.status,
      });

      if (upstream.status === 401 || upstream.status === 403) {
        return jsonError(
          "CONFIG_MISSING",
          "DeepSeek 配置不可用，请检查 API Key 和模型权限。",
          false,
          503,
        );
      }

      return jsonError(
        "UPSTREAM_ERROR",
        upstream.status === 429
          ? "DeepSeek 请求过于频繁，请稍后重试。"
          : "DeepSeek 暂时没有回应，请稍后重试。",
        true,
        502,
      );
    }

    const payload = (await upstream.json()) as DeepSeekChatResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return jsonError(
        "MODEL_OUTPUT_INVALID",
        "DeepSeek 已返回结果，但内容为空，请重试一次。",
        true,
        502,
      );
    }

    const analysis = parseDishAnalysis(content);
    return NextResponse.json<AnalyzeResponse>({
      ok: true,
      analysis,
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(
        "MODEL_OUTPUT_INVALID",
        "DeepSeek 已返回结果，但格式不完整，请重试一次。",
        true,
        502,
      );
    }

    console.error("DeepSeek analysis request errored");
    return jsonError(
      "UPSTREAM_ERROR",
      "DeepSeek 暂时无法连接，请稍后重试。",
      true,
      502,
    );
  }
}

function jsonError(
  code: Extract<AnalyzeResponse, { ok: false }>["code"],
  message: string,
  retryable: boolean,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json<AnalyzeResponse>(
    { ok: false, code, message, retryable },
    { status, headers },
  );
}

function clientIdentifier(request: Request) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip");

  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

function consumeRateLimit(
  identifier: string,
  now = Date.now(),
):
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number } {
  const current = rateLimitEntries.get(identifier);

  if (!current || current.resetAt <= now) {
    rateLimitEntries.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}
