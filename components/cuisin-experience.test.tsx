import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CuisinExperience } from "./cuisin-experience";

describe("CuisinExperience", () => {
  it("opens with only the brand and the upload action", () => {
    const markup = renderToStaticMarkup(<CuisinExperience />);

    expect(markup).toContain("Cuisin");
    expect(markup).toContain("上传菜品照片");
    expect(markup).not.toContain("<h1");
    expect(markup).not.toContain("上传一道中国菜");
    expect(markup).not.toContain("上传 · 识别 · 命名");
  });

  it("closes the page with concise privacy and AI guidance", () => {
    const markup = renderToStaticMarkup(<CuisinExperience />);

    expect(markup).toContain("<footer");
    expect(markup).toContain("图片仅用于本次识别");
    expect(markup).toContain("AI 结果仅供参考");
  });
});
