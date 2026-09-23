"use client";

import { useRef, useState } from "react";

import type { AnalyzeResponse, DishAnalysis } from "@/lib/dish-analysis";
import { prepareImage, type PreparedImage } from "@/lib/image";

type Phase = "empty" | "preparing" | "analyzing" | "result" | "error";

type ErrorState = {
  code: string;
  message: string;
  retryable: boolean;
};

export function CuisinExperience() {
  const [phase, setPhase] = useState<Phase>("empty");
  const [prepared, setPrepared] = useState<PreparedImage | null>(null);
  const [analysis, setAnalysis] = useState<DishAnalysis | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = phase === "preparing" || phase === "analyzing";
  const hasImage = prepared !== null;

  async function chooseFile(file?: File) {
    if (!file || busy) {
      return;
    }

    setPhase("preparing");
    setPrepared(null);
    setAnalysis(null);
    setError(null);

    let nextPrepared: PreparedImage;
    try {
      nextPrepared = await prepareImage(file);
    } catch (caught) {
      setError({
        code: "LOCAL_IMAGE_INVALID",
        message:
          caught instanceof Error ? caught.message : "无法读取这张图片。",
        retryable: false,
      });
      setPhase("error");
      return;
    }

    setPrepared(nextPrepared);
    await analyzeImage(nextPrepared);
  }

  async function analyzeImage(image: PreparedImage) {
    setPhase("analyzing");
    setAnalysis(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image.dataUrl }),
      });
      const data = (await response.json()) as AnalyzeResponse;

      if (!data.ok) {
        setError({
          code: data.code,
          message: data.message,
          retryable: data.retryable,
        });
        setPhase("error");
        return;
      }

      setAnalysis(data.analysis);
      setPhase("result");
    } catch {
      setError({
        code: "NETWORK_ERROR",
        message: "网络连接中断，请稍后重试。",
        retryable: true,
      });
      setPhase("error");
    }
  }

  function replaceImage() {
    if (!busy && inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  return (
    <main className="site-shell" id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Cuisin 首页">
          <span className="brand-monogram" aria-hidden="true">
            C
          </span>
          <strong className="brand-name">Cuisin</strong>
        </a>
      </header>

      <section
        className={`workspace ${dragActive ? "is-dragging" : ""}`}
        aria-label="中国菜图片识别"
        onDragEnter={(event) => {
          event.preventDefault();
          if (!busy) setDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void chooseFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          className="visually-hidden"
          id="dish-image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={(event) => void chooseFile(event.target.files?.[0])}
        />

        {!hasImage ? (
          <div className="upload-stage">
            <button
              className="upload-zone"
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <span className="upload-icon" aria-hidden="true">
                <UploadIcon />
              </span>
              <strong>
                {phase === "preparing" ? "正在读取图片…" : "上传菜品照片"}
              </strong>
              <small>点击选择，或拖入图片</small>
              <span className="upload-formats">JPG · PNG · WebP</span>
            </button>

            {error && (
              <ErrorPanel
                error={error}
                onRetry={() => undefined}
                onReplace={replaceImage}
                showRetry={false}
              />
            )}
          </div>
        ) : (
          <div className="result-layout">
            <div className="photo-panel">
              <img src={prepared.dataUrl} alt="待识别的中国菜照片" />
              {busy && (
                <div className="photo-overlay" aria-live="polite">
                  <span className="loading-mark" aria-hidden="true" />
                  <span>{phase === "preparing" ? "正在处理…" : "正在识别…"}</span>
                </div>
              )}
            </div>

            <div className="result-panel" aria-live="polite">
              {analysis ? (
                <ResultPanel analysis={analysis} onReplace={replaceImage} />
              ) : error ? (
                <ErrorPanel
                  error={error}
                  onRetry={() => void analyzeImage(prepared)}
                  onReplace={replaceImage}
                  showRetry={error.retryable}
                />
              ) : (
                <div className="waiting-panel">
                  <span className="result-label">请稍候</span>
                  <h2>正在识别菜品</h2>
                  <p>通常只需要几秒。</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <footer className="site-footer">
        <span className="footer-brand">Cuisin</span>
        <p className="footer-notes">
          <span>图片仅用于本次识别</span>
          <span className="footer-separator" aria-hidden="true">
            ·
          </span>
          <span>AI 结果仅供参考</span>
        </p>
      </footer>
    </main>
  );
}

function ResultPanel({
  analysis,
  onReplace,
}: {
  analysis: DishAnalysis;
  onReplace: () => void;
}) {
  if (analysis.status === "not_food") {
    return (
      <div className="text-panel">
        <span className="result-label">未能识别</span>
        <h2>这张照片里没有找到菜品。</h2>
        <p>{analysis.message ?? "请换一张能看清菜品的照片。"}</p>
        <button className="button button-quiet" type="button" onClick={onReplace}>
          换一张
        </button>
      </div>
    );
  }

  const { dish } = analysis;
  const isUncertain = analysis.status === "uncertain";

  return (
    <div className="text-panel">
      <div className="name-group">
        <span className="result-label">
          {isUncertain ? "AI 推断的菜名" : "识别菜名"}
        </span>
        <h2>{dish.chineseName}</h2>
        <p className="region">{dish.region}</p>
      </div>

      <span className="result-rule" aria-hidden="true" />

      <div className="name-group is-french-name">
        <span className="result-label">法式中文名</span>
        <p className="french-name">{dish.frenchStyleName}</p>
      </div>

      <button className="button button-quiet" type="button" onClick={onReplace}>
        换一张
      </button>
    </div>
  );
}

function ErrorPanel({
  error,
  onRetry,
  onReplace,
  showRetry,
}: {
  error: ErrorState;
  onRetry: () => void;
  onReplace: () => void;
  showRetry: boolean;
}) {
  return (
    <div className="text-panel error-panel" role="alert">
      <span className="result-label">识别失败</span>
      <p>{error.message}</p>
      <div className="panel-actions">
        {showRetry && (
          <button className="button button-primary" type="button" onClick={onRetry}>
            重试
          </button>
        )}
        <button className="button button-quiet" type="button" onClick={onReplace}>
          换一张
        </button>
      </div>
      {error.code === "CONFIG_MISSING" && (
        <code>DEEPSEEK_API_KEY</code>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 32V10m0 0-8 8m8-8 8 8M10 30v5a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3v-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
