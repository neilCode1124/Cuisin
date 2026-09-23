import { describe, expect, it } from "vitest";

import { parseDishAnalysis } from "./dish-analysis";

const validDish = {
  chineseName: "麻婆豆腐",
  region: "四川",
  frenchStyleName: "川味慢煨豆腐，佐花椒暖香",
  confidence: 0.91,
};

describe("parseDishAnalysis", () => {
  it("parses fenced model JSON", () => {
    const result = parseDishAnalysis(`\`\`\`json
${JSON.stringify({
  status: "identified",
  dish: validDish,
})}
\`\`\``);

    expect(result.status).toBe("identified");
    if (result.status !== "not_food") {
      expect(result.dish.frenchStyleName).toContain("豆腐");
    }
  });

  it("parses JSON surrounded by model commentary", () => {
    const result = parseDishAnalysis(
      `Here is the result: ${JSON.stringify({
        status: "uncertain",
        dish: { ...validDish, confidence: 0.63 },
      })}`,
    );

    expect(result.status).toBe("uncertain");
  });

  it("accepts a non-food result without a dish", () => {
    const result = parseDishAnalysis(
      JSON.stringify({
        status: "not_food",
        dish: null,
        message: "图片中看不到可辨认的菜品。",
      }),
    );

    expect(result.status).toBe("not_food");
  });

  it("rejects incomplete dish data", () => {
    expect(() =>
      parseDishAnalysis(
        JSON.stringify({
          status: "identified",
          dish: { chineseName: "宫保鸡丁" },
        }),
      ),
    ).toThrow();
  });
});
