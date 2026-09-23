import { z } from "zod";

const shortText = (max = 160) => z.string().trim().min(1).max(max);

export const DishSchema = z
  .object({
    chineseName: shortText(40),
    region: shortText(40),
    frenchStyleName: shortText(100),
    confidence: z.number().min(0).max(1),
  })
  .strict();

const optionalMessage = z.string().trim().max(180).optional();

export const DishAnalysisSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("identified"),
      dish: DishSchema,
      message: optionalMessage,
    })
    .strict(),
  z
    .object({
      status: z.literal("uncertain"),
      dish: DishSchema,
      message: optionalMessage,
    })
    .strict(),
  z
    .object({
      status: z.literal("not_food"),
      dish: z.null(),
      message: shortText(180),
    })
    .strict(),
]);

export type Dish = z.infer<typeof DishSchema>;
export type DishAnalysis = z.infer<typeof DishAnalysisSchema>;

export type AnalyzeResponse =
  | {
      ok: true;
      analysis: DishAnalysis;
      model: string;
    }
  | {
      ok: false;
      code:
        | "CONFIG_MISSING"
        | "INVALID_IMAGE"
        | "IMAGE_TOO_LARGE"
        | "MODEL_OUTPUT_INVALID"
        | "RATE_LIMITED"
        | "UPSTREAM_ERROR";
      message: string;
      retryable: boolean;
    };

export function parseDishAnalysis(value: string): DishAnalysis {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("The model returned an empty response.");
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? extractJsonObject(trimmed);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new Error("The model response was not valid JSON.");
  }

  return DishAnalysisSchema.parse(parsed);
}

function extractJsonObject(value: string): string {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model response did not contain a JSON object.");
  }
  return value.slice(start, end + 1);
}
