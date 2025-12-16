import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedPattern } from "../types";

const getApiKey = (): string => {
  // Vite injects these via `vite.config.ts` `define` (and in some environments they may be undefined).
  const key = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!key) {
    throw new Error(
      "Missing GEMINI_API_KEY. Create a `.env.local` file with `GEMINI_API_KEY=...` (see `.env.example`)."
    );
  }
  return key;
};

let ai: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI => {
  if (ai) return ai;
  ai = new GoogleGenAI({ apiKey: getApiKey() });
  return ai;
};

const patternSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative name for the pattern" },
    points: { 
      type: Type.ARRAY,
      description: "A dense ordered list of X,Y coordinates (0-100) forming the continuous cut path.",
      items: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER }
        },
        required: ["x", "y"]
      }
    },
    description: { type: Type.STRING, description: "Short description of the shape and usage." },
    difficulty: { type: Type.STRING, description: "Estimated difficulty: Easy, Medium, or Hard" },
    estimatedCutTime: { type: Type.STRING, description: "Estimated time to cut with hot wire, e.g., '5 mins'" },
  },
  required: ["name", "points", "description", "difficulty", "estimatedCutTime"],
};

export const generatePattern = async (prompt: string): Promise<GeneratedPattern> => {
  // Procedural fallbacks for a few common shapes to guarantee quality.
  // This avoids “blob/oval” failures from the LLM for well-defined silhouettes.
  const procedural = tryProceduralPattern(prompt);
  if (procedural) return procedural;

  const buildContents = (userPrompt: string, extra: string) => `You are an expert CNC Hot Wire Foam Cutter path generator.
      
      User Request: Create a cut path for: "${userPrompt}".

      CRITICAL GEOMETRIC RULES:
      1. COORDINATE SYSTEM: Use Standard Cartesian Coordinates. (0,0) is BOTTOM-LEFT. (100,100) is TOP-RIGHT.
         - Ensure the shape is upright in this coordinate system.
      2. SINGLE CONTINUOUS POLYLINE: The output must be a single ordered array of coordinates. The wire CANNOT lift.
      2b. CLOSED OUTLINE: This is an exterior silhouette. The path MUST return to the start (the last point should equal the first point).
      3. HANDLING TEXT / MULTIPLE SHAPES:
         - If the input is text (e.g., "HELLO") or disjoint shapes, you MUST connect them.
         - Strategy: Draw the first letter, then exit at the bottom-right, draw a connecting line along the bottom (baseline) to the start of the next letter.
         - Do not cross through the middle of the shape if possible.
      4. INTERNAL HOLES (The "Hidden Seam"):
         - To cut a hole (e.g., inside 'A', 'O', 'B'), use the "Bridge" method.
         - Cut from the outer perimeter -> Enter at a vertex -> Cut the hole -> Exit at the same vertex -> Resume outer perimeter.
      5. DENSITY: Use MANY points so curves look smooth. Target 250-500 points for silhouettes (more for complex shapes). Avoid long straight segments.
      6. SILHOUETTE QUALITY: Prefer organic, rounded contours (no jagged polygon look). Include characteristic features relevant to the prompt (e.g. head/snout/ears/legs/tail for an animal silhouette).
      7. AVOID DEGENERATE OUTPUT: Do NOT output a simple polygon. The outline must have many distinct curves and features.

      ALGORITHM EXAMPLE (Letter 'O'):
      Start at outside bottom-left -> Trace outside to bottom-middle -> Cut IN to inner bottom-middle -> Trace inner circle -> Cut OUT to outer bottom-middle -> Finish tracing outside.

      Fit the shape coordinates roughly within 0-100 range.
      Return the response in the specified JSON schema.
      
      ${extra}
      `;

  const generateOnce = async (userPrompt: string, extra: string, model: string) => {
    const response = await getAiClient().models.generateContent({
      model,
      contents: buildContents(userPrompt, extra),
      config: {
        responseMimeType: "application/json",
        responseSchema: patternSchema,
        // Keep this fairly deterministic because we're requiring strict JSON.
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 2048,
        systemInstruction:
          "You are a specialized G-code generator. Output coordinates where Y=0 is the floor/bottom. Always connect disjoint letters with a baseline segment.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    try {
      const parsed = safeParseJsonFromModel(text) as GeneratedPattern;
      return postProcessPattern(parsed);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON response:", { text });
      const preview = text.length > 300 ? `${text.slice(0, 300)}…` : text;
      const msg = (parseErr as any)?.message ? ` (${(parseErr as any).message})` : '';
      throw new Error(`AI returned invalid JSON. First 300 chars: ${preview}${msg}`);
    }
  };

  try {
    // Prefer higher quality for shape generation; fall back if model isn't available for this key.
    const preferredModels = ["gemini-3-pro-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];

    const extraAttempt1 = "";
    const extraAttempt2 =
      "QUALITY FEEDBACK: The last result was too geometric / polygon-like. Regenerate with a much more dog-like outline (head/snout, ears, chest, belly, 4 legs, tail). Avoid any straight edge longer than ~8 units. Ensure many smooth arcs and direction changes across the outline.";

    let best: GeneratedPattern | null = null;
    let lastErr: unknown = null;

    for (const model of preferredModels) {
      try {
        // Attempt 1
        const p1 = await generateOnce(prompt, extraAttempt1, model);
        best = best ?? p1;
        if (isPatternQualityAcceptable(p1.points)) return p1;

        // Attempt 2 with stronger constraints
        const p2 = await generateOnce(prompt, extraAttempt2, model);
        best = p2;
        if (isPatternQualityAcceptable(p2.points)) return p2;

        // If both are poor, try the next model (don't hard-fail on one model)
      } catch (err) {
        // Model not available / auth errors / transient errors: try next model
        console.warn(`Pattern generation attempt failed for model "${model}"`, err);
        lastErr = err;
      }
    }

    if (best) return best;

    const lastMsg =
      (lastErr as any)?.message ||
      (typeof lastErr === 'string' ? lastErr : '') ||
      'Unknown error';
    throw new Error(`All models failed. Last error: ${lastMsg}`);
  } catch (error) {
    console.error("Pattern generation failed:", error);
    throw error;
  }
};

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const samePoint = (a: { x: number; y: number }, b: { x: number; y: number }, eps = 1e-6) =>
  Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;

/**
 * Chaikin smoothing for a CLOSED polyline. Each iteration doubles points and rounds corners.
 * This is a geometry-only post-process; it cannot add semantic detail, but it reduces the "polygon" look.
 */
const chaikinSmoothClosed = (points: { x: number; y: number }[], iterations: number) => {
  let pts = points;
  for (let it = 0; it < iterations; it++) {
    const out: { x: number; y: number }[] = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % n];
      // Q = 0.75*p0 + 0.25*p1, R = 0.25*p0 + 0.75*p1
      out.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      out.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    pts = out;
  }
  return pts;
};

const postProcessPattern = (pattern: GeneratedPattern): GeneratedPattern => {
  const raw = Array.isArray(pattern?.points) ? pattern.points : [];

  // Filter/clean + clamp to [0,100]
  const cleaned = raw
    .filter((p) => p && isFiniteNumber((p as any).x) && isFiniteNumber((p as any).y))
    .map((p) => ({ x: clamp((p as any).x, 0, 100), y: clamp((p as any).y, 0, 100) }));

  // Remove consecutive duplicates
  const deduped: { x: number; y: number }[] = [];
  for (const p of cleaned) {
    if (deduped.length === 0 || !samePoint(deduped[deduped.length - 1], p)) deduped.push(p);
  }

  if (deduped.length < 4) return pattern;

  /**
   * Heuristic: Some model outputs come back in SVG screen coordinates (Y grows downward),
   * which makes letters look upside down in our Cartesian convention.
   *
   * For text/multi-letter prompts we request a "baseline segment" along the bottom (y≈0).
   * If we instead see lots of points hugging y≈100 and few near y≈0, we likely need to flip Y.
   */
  const countNear = (arr: { x: number; y: number }[], pred: (p: { x: number; y: number }) => boolean) => {
    let c = 0;
    for (const p of arr) if (pred(p)) c++;
    return c;
  };
  const bottomCount = countNear(deduped, (p) => p.y <= 5);
  const topCount = countNear(deduped, (p) => p.y >= 95);
  const shouldFlipY = topCount >= 25 && topCount > bottomCount * 2;

  const oriented = shouldFlipY ? deduped.map((p) => ({ x: p.x, y: 100 - p.y })) : deduped;

  // Ensure closed (without duplicating the last point for processing)
  const closedNoDup = samePoint(oriented[0], oriented[oriented.length - 1]) ? oriented.slice(0, -1) : oriented;

  // Smoothing: only when the model gives too few points (don't wash out detail on high-res paths)
  const iterations = closedNoDup.length < 120 ? 3 : closedNoDup.length < 220 ? 2 : 0;
  const smoothed = iterations > 0 ? chaikinSmoothClosed(closedNoDup, iterations) : closedNoDup;

  // Re-close by duplicating start point at the end (useful for G-code + SVG closing)
  const finalPoints = [...smoothed, { ...smoothed[0] }];

  return {
    ...pattern,
    points: finalPoints,
  };
};

// --- Procedural shapes (deterministic) ---
const tryProceduralPattern = (prompt: string): GeneratedPattern | null => {
  const p = (prompt || '').toLowerCase();
  if (!p.includes('heart')) return null;

  // Parametric heart curve (classic)
  // x(t) = 16 sin^3(t)
  // y(t) = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
  // Produces a clean heart with two lobes and a bottom point.
  const n = 600; // within 400–800 target
  const raw: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      1 * Math.cos(4 * t);
    raw.push({ x, y });
  }

  // Normalize into 0..100 with a little padding.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of raw) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  const pad = 6; // keep away from edges
  const scaleX = (100 - pad * 2) / (maxX - minX || 1);
  const scaleY = (100 - pad * 2) / (maxY - minY || 1);
  const scale = Math.min(scaleX, scaleY);

  const points = raw.map(({ x, y }) => ({
    x: clamp((x - minX) * scale + pad, 0, 100),
    y: clamp((y - minY) * scale + pad, 0, 100),
  }));

  // Close the loop
  points.push({ ...points[0] });

  return {
    name: 'Heart Silhouette',
    points,
    description: 'A smooth heart silhouette with two rounded lobes and a pointed bottom, suitable for a continuous hot-wire cut.',
    difficulty: 'Easy',
    estimatedCutTime: '3 mins',
  };
};

// --- Robust JSON parsing for model output ---
const stripCodeFences = (s: string) =>
  s
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

const extractFirstJsonObject = (s: string) => {
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
};

// Remove common trailing commas: `{ "a": 1, }` or `[1,2,]`
const removeTrailingCommas = (s: string) => s.replace(/,\s*([}\]])/g, '$1');

/**
 * Repairs common "almost JSON" issues the model sometimes emits even when asked for strict JSON:
 * - Missing commas between adjacent objects/arrays (e.g. `}\n{` inside an array)
 * - Missing commas between adjacent string/number tokens across newlines in arrays (rare)
 *
 * This is intentionally conservative and only targets patterns that are very likely formatting mistakes.
 */
const repairMissingCommas = (s: string) => {
  // Insert comma between adjacent objects: `}{` (usually inside arrays)
  let out = s.replace(/}\s*{/g, '},{');

  // Insert comma between adjacent arrays: `][` (rare, but safe)
  out = out.replace(/]\s*\[/g, '],[');

  // Insert comma between end-of-object and start-of-array / vice-versa (rare)
  out = out.replace(/}\s*\[/g, '},[').replace(/]\s*{/g, '],{');

  return out;
};

const safeParseJsonFromModel = (rawText: string): unknown => {
  const t1 = stripCodeFences(rawText);
  const candidates = [t1, extractFirstJsonObject(t1)].filter(Boolean) as string[];

  let lastErr: unknown = null;
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch (e1) {
      lastErr = e1;
      try {
        const pass1 = removeTrailingCommas(c);
        try {
          return JSON.parse(pass1);
        } catch (e2) {
          lastErr = e2;
        }

        const pass2 = repairMissingCommas(pass1);
        try {
          return JSON.parse(pass2);
        } catch (e3) {
          lastErr = e3;
        }
      } catch (e2) {
        lastErr = e2;
      }
    }
  }
  throw lastErr ?? new Error('Unable to parse JSON');
};

// --- Quality gate to detect "degenerate polygon" outputs and trigger a retry ---
const dist2 = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

const distPointToSegment = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = p.x - a.x;
  const wy = p.y - a.y;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.sqrt(dist2(p, a));
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.sqrt(dist2(p, b));
  const t = c1 / c2;
  const proj = { x: a.x + t * vx, y: a.y + t * vy };
  return Math.sqrt(dist2(p, proj));
};

// RDP polyline simplification (closed path expected without duplicate endpoint)
const simplifyRdp = (pts: { x: number; y: number }[], epsilon: number) => {
  if (pts.length <= 2) return pts;
  let dmax = 0;
  let idx = 0;
  const end = pts.length - 1;
  for (let i = 1; i < end; i++) {
    const d = distPointToSegment(pts[i], pts[0], pts[end]);
    if (d > dmax) {
      idx = i;
      dmax = d;
    }
  }
  if (dmax > epsilon) {
    const rec1 = simplifyRdp(pts.slice(0, idx + 1), epsilon);
    const rec2 = simplifyRdp(pts.slice(idx), epsilon);
    return rec1.slice(0, -1).concat(rec2);
  }
  return [pts[0], pts[end]];
};

const isPatternQualityAcceptable = (pointsWithMaybeDupEnd: { x: number; y: number }[]) => {
  if (!pointsWithMaybeDupEnd || pointsWithMaybeDupEnd.length < 80) return false;

  const pts =
    pointsWithMaybeDupEnd.length > 3 &&
    samePoint(pointsWithMaybeDupEnd[0], pointsWithMaybeDupEnd[pointsWithMaybeDupEnd.length - 1])
      ? pointsWithMaybeDupEnd.slice(0, -1)
      : pointsWithMaybeDupEnd;

  if (pts.length < 80) return false;

  // Detect overly straight / polygonal outlines by simplifying and counting "major corners"
  const simplified = simplifyRdp(pts, 1.5);
  const majorVertices = simplified.length;

  // Also flag if there are very long edges (in normalized 0-100 space)
  let maxSeg = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const seg = Math.sqrt(dist2(a, b));
    if (seg > maxSeg) maxSeg = seg;
  }

  // Heuristics tuned to catch "giant triangle" / "few-sided polygon" failures
  if (majorVertices < 18) return false;
  if (maxSeg > 18) return false;

  return true;
};

export const getChatResponseStream = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
    const chat = getAiClient().chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are 'Volt', a helpful AI assistant for foam cutting enthusiasts. You know about XPS, EPS, EPP foams, hot wire cutters, CNC machines, and manual crafting techniques. Keep answers concise, practical, and safety-focused (remind about fumes).",
        },
        history: history
    });

    return chat.sendMessageStream({ message: newMessage });
};