import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const fetchMock = vi.fn();
let requestSequence = 0;

const validImage = `data:image/jpeg;base64,${Buffer.from(
  "a simple synthetic image payload",
).toString("base64")}`;

const validModelResult = {
  status: "identified",
  dish: {
    chineseName: "回锅肉",
    region: "四川",
    frenchStyleName: "川味双煨猪肉，佐青葱与锅香",
    confidence: 0.92,
  },
};

function requestFor(image: string, ip = `198.51.100.${++requestSequence}`) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: JSON.stringify({ image }),
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": ip,
    },
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    process.env.DEEPSEEK_API_KEY = "test-key";
    process.env.DEEPSEEK_MODEL = "test-model";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_MODEL;
  });

  it("returns a validated naming result from DeepSeek", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validModelResult) } }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const response = await POST(requestFor(validImage));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      model: "test-model",
      analysis: { status: "identified" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      }),
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.thinking).toEqual({ type: "disabled" });
  });

  it("rejects a non-image data URL before calling DeepSeek", async () => {
    const response = await POST(
      requestFor(
        `data:text/plain;base64,${Buffer.from("not an image").toString("base64")}`,
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, code: "INVALID_IMAGE" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports missing server configuration without calling DeepSeek", async () => {
    delete process.env.DEEPSEEK_API_KEY;

    const response = await POST(requestFor(validImage));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, code: "CONFIG_MISSING" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps an unauthorized DeepSeek response to a configuration error", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "invalid key" } }), {
        status: 401,
      }),
    );

    const response = await POST(requestFor(validImage));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, code: "CONFIG_MISSING" });
  });

  it("rate limits the seventh request from the same client before calling DeepSeek", async () => {
    fetchMock.mockImplementation(
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [
                { message: { content: JSON.stringify(validModelResult) } },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );

    const responses = [];
    for (let attempt = 0; attempt < 7; attempt += 1) {
      responses.push(await POST(requestFor(validImage, "203.0.113.42")));
    }
    const body = await responses[6].json();

    expect(responses.slice(0, 6).every((response) => response.status === 200)).toBe(
      true,
    );
    expect(responses[6].status).toBe(429);
    expect(responses[6].headers.get("Retry-After")).toBe("60");
    expect(body).toMatchObject({ ok: false, code: "RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
