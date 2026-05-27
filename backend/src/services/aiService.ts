import OpenAI from "openai";
import { IQuestionTypeConfig, IGeneratedPaper, ISection, IQuestion } from "../models/Assignment";
import { v4 as uuidv4 } from "uuid";
import { callFreeAIJson, hasGroqKey } from "./freeAI";

function getOpenAIKey(): string {
  return process.env.OPENAI_API_KEY || "";
}

function hasOpenAIKey(): boolean {
  const k = getOpenAIKey();
  return k.length > 0 && k !== "your_openai_api_key_here" && k.startsWith("sk-");
}

interface GenerateParams {
  assignmentId: string;
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  timeAllowed: number;
  questionTypes: IQuestionTypeConfig[];
  additionalInstructions: string;
  uploadedFileContent?: string;
}

// ── Extract readable text from uploaded file (base64 or plain text) ───────
function extractTextFromFile(content: string): string {
  if (!content) return "";

  // If it's a data URL, extract the base64 part
  if (content.startsWith("data:")) {
    const [header, base64] = content.split(",");
    const mimeType = header.match(/data:([^;]+)/)?.[1] || "";

    // Plain text files
    if (mimeType === "text/plain") {
      try {
        return Buffer.from(base64, "base64").toString("utf-8").slice(0, 8000);
      } catch { return ""; }
    }

    // For PDFs and images — extract base64 text as best effort
    // (real PDF parsing would need pdf-parse, but we can use the raw text)
    if (mimeType === "application/pdf") {
      try {
        const raw = Buffer.from(base64, "base64").toString("latin1");
        // Extract readable ASCII text from PDF binary
        const readable = raw
          .replace(/[^\x20-\x7E\n\r\t]/g, " ")
          .replace(/\s{3,}/g, "\n")
          .replace(/BT\s*\//g, "\n")
          .split("\n")
          .filter((line) => line.trim().length > 3 && /[a-zA-Z]{2,}/.test(line))
          .join("\n")
          .slice(0, 8000);
        return readable;
      } catch { return ""; }
    }

    return "";
  }

  // Plain string content
  return content.slice(0, 8000);
}

// ── Build a rich, PDF-aware prompt ────────────────────────────────────────
function buildPrompt(p: GenerateParams): string {
  const totalMarks = p.questionTypes.reduce((s, qt) => s + qt.count * qt.marksPerQuestion, 0);
  const pdfText = p.uploadedFileContent ? extractTextFromFile(p.uploadedFileContent) : "";
  const hasPDF = pdfText.trim().length > 50;

  const sectionSpecs = p.questionTypes.map((qt, i) => {
    const letter = String.fromCharCode(65 + i);
    const diffSplit = qt.type === "Multiple Choice Questions" || qt.type === "True/False"
      ? "easy: 40%, medium: 40%, hard: 20%"
      : "easy: 25%, medium: 50%, hard: 25%";

    const typeInstructions: Record<string, string> = {
      "Multiple Choice Questions": "Each question MUST have exactly 4 distinct options (A, B, C, D). Options must be plausible — no obviously wrong answers.",
      "True/False": 'Each question MUST have exactly 2 options: ["True", "False"]. Write clear factual statements.',
      "Short Questions": "Each answer should require 2-4 sentences. Ask for definitions, explanations, or brief descriptions.",
      "Long Questions": "Each answer should require a paragraph or more. Ask for detailed explanations, comparisons, or analysis.",
      "Numerical Problems": "Include actual numbers, formulas, and units. Show what needs to be calculated.",
      "Diagram/Graph-Based Questions": "Ask students to draw, label, or interpret diagrams/graphs related to the topic.",
    };

    return `SECTION ${letter}: ${qt.type}
  Questions: ${qt.count} | Marks each: ${qt.marksPerQuestion} | Section total: ${qt.count * qt.marksPerQuestion}M
  Difficulty split: ${diffSplit}
  Instructions: ${typeInstructions[qt.type] || "Write clear, complete questions."}`;
  }).join("\n\n");

  const pdfSection = hasPDF ? `
═══════════════════════════════════════════════════════
UPLOADED DOCUMENT CONTENT (PRIMARY SOURCE — USE THIS):
═══════════════════════════════════════════════════════
${pdfText}
═══════════════════════════════════════════════════════
CRITICAL: All questions MUST be directly based on the above document content.
Extract specific facts, concepts, names, dates, formulas, and examples from it.
Do NOT generate generic questions — every question must reference something from the document.
` : "";

  return `You are an expert educational assessment creator for Indian schools (CBSE/ICSE curriculum).

${pdfSection}
ASSIGNMENT DETAILS:
- Title: ${p.title}
- Subject: ${p.subject}
- Class/Grade: ${p.className}
- School: ${p.schoolName}
- Duration: ${p.timeAllowed} minutes
- Total Marks: ${totalMarks}
- Additional Instructions: ${p.additionalInstructions || "None"}

SECTION REQUIREMENTS:
${sectionSpecs}

${hasPDF ? "IMPORTANT: Since a document was uploaded, ALL questions must be based on its specific content — use actual facts, terms, and concepts from the document." : `Generate curriculum-appropriate questions for ${p.subject}, ${p.className}.`}

OUTPUT FORMAT — Return ONLY valid JSON, no markdown, no extra text:
{
  "title": "string",
  "generalInstructions": ["string", "string", "string", "string"],
  "sections": [
    {
      "title": "Section A",
      "instruction": "string describing what to do and marks per question",
      "questionType": "exact type string",
      "questions": [
        {
          "text": "complete question text",
          "difficulty": "easy|medium|hard",
          "marks": number,
          "options": ["opt1","opt2","opt3","opt4"]
        }
      ]
    }
  ]
}

QUALITY CHECKLIST:
✓ Every question is complete and self-contained
✓ MCQ has exactly 4 plausible options
✓ True/False has exactly 2 options
✓ Difficulty is exactly: easy, medium, or hard
✓ Marks match the spec
✓ No answers or answer keys included
✓ Questions are varied — no repetition
${hasPDF ? "✓ Every question references specific content from the uploaded document" : ""}`;
}

// ── Main generation function ──────────────────────────────────────────────
export async function generateQuestionPaper(params: GenerateParams): Promise<IGeneratedPaper> {
  let rawResponse = "";

  // ── Path 1: OpenAI ──
  if (hasOpenAIKey()) {
    try {
      const client = new OpenAI({ apiKey: getOpenAIKey() });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert educational assessment creator. Always respond with valid JSON only. Never include markdown code fences or any text outside the JSON object.",
          },
          { role: "user", content: buildPrompt(params) },
        ],
        temperature: 0.6,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      });
      rawResponse = completion.choices[0]?.message?.content?.trim() || "";
      console.log(`🤖 [OpenAI] Generated ${rawResponse.length} chars`);
    } catch (err) {
      const msg = (err as Error).message || "";
      console.error("OpenAI error:", msg);
      if (msg.includes("quota") || msg.includes("429")) {
        console.log("OpenAI quota exceeded, trying Groq...");
      }
      rawResponse = "";
    }
  }

  // ── Path 2: Groq (free) ──
  if (!rawResponse && hasGroqKey()) {
    try {
      console.log("🦙 [Groq] Generating question paper...");
      rawResponse = await callFreeAIJson(
        "You are an expert educational assessment creator. Always respond with valid JSON only. No markdown, no extra text outside the JSON.",
        buildPrompt(params),
        4000
      );
      console.log(`🦙 [Groq] Generated ${rawResponse.length} chars`);
    } catch (err) {
      console.error("Groq error:", (err as Error).message);
      rawResponse = "";
    }
  }

  // ── Path 3: Smart local fallback (uses PDF content if available) ──
  if (!rawResponse) {
    console.log("📝 [Local] Generating structured fallback paper...");
    rawResponse = generateSmartFallback(params);
  }

  // ── Parse ──
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    console.error("JSON parse failed, using smart fallback");
    parsed = JSON.parse(generateSmartFallback(params));
  }

  return structurePaper(parsed, params);
}

// ── Smart local fallback — extracts content from PDF if available ─────────
function generateSmartFallback(params: GenerateParams): string {
  const pdfText = params.uploadedFileContent
    ? extractTextFromFile(params.uploadedFileContent)
    : "";

  // Extract key terms/sentences from PDF for question generation
  const pdfLines = pdfText
    .split(/[\n.!?]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && /[a-zA-Z]{3,}/.test(l))
    .slice(0, 40);

  const hasPDF = pdfLines.length > 3;

  const sections = params.questionTypes.map((qt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const questions = Array.from({ length: qt.count }, (_, i) => {
      const diff: "easy" | "medium" | "hard" = i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard";
      const text = hasPDF
        ? buildQuestionFromPDF(pdfLines, qt.type, params.subject, i, diff)
        : buildGenericQuestion(params.subject, qt.type, i + 1, diff);

      return {
        text,
        difficulty: diff,
        marks: qt.marksPerQuestion,
        options: qt.type === "Multiple Choice Questions"
          ? buildMCQOptions(pdfLines, params.subject, i)
          : qt.type === "True/False" ? ["True", "False"] : undefined,
      };
    });

    return {
      title: `Section ${letter}`,
      instruction: buildInstruction(qt),
      questionType: qt.type,
      questions,
    };
  });

  return JSON.stringify({
    title: params.title,
    generalInstructions: [
      "Read all questions carefully before answering.",
      "All questions are compulsory unless stated otherwise.",
      "Write neatly and legibly.",
      "Marks are indicated against each question.",
    ],
    sections,
  });
}

function buildInstruction(qt: IQuestionTypeConfig): string {
  const map: Record<string, string> = {
    "Multiple Choice Questions": `Choose the correct option. Each question carries ${qt.marksPerQuestion} mark(s).`,
    "True/False": `State whether the following statements are True or False. Each carries ${qt.marksPerQuestion} mark(s).`,
    "Short Questions": `Answer the following in 2-3 sentences. Each question carries ${qt.marksPerQuestion} mark(s).`,
    "Long Questions": `Answer the following in detail. Each question carries ${qt.marksPerQuestion} mark(s).`,
    "Numerical Problems": `Solve the following problems showing all steps. Each carries ${qt.marksPerQuestion} mark(s).`,
    "Diagram/Graph-Based Questions": `Draw and label the required diagrams. Each carries ${qt.marksPerQuestion} mark(s).`,
  };
  return map[qt.type] || `Attempt all questions. Each carries ${qt.marksPerQuestion} mark(s).`;
}

function buildQuestionFromPDF(
  lines: string[],
  type: string,
  subject: string,
  idx: number,
  diff: string
): string {
  const line = lines[idx % lines.length] || "";
  const words = line.split(" ").filter((w) => w.length > 3);
  const keyTerm = words[Math.floor(words.length / 2)] || subject;

  const starters: Record<string, string[]> = {
    "Multiple Choice Questions": [
      `According to the text, which of the following best describes "${keyTerm}"?`,
      `Based on the document, what is the significance of "${keyTerm}"?`,
      `The text mentions "${keyTerm}". Which statement about it is correct?`,
      `Which of the following is stated in the document about "${keyTerm}"?`,
    ],
    "Short Questions": [
      `Based on the document, explain the concept of "${keyTerm}" in your own words.`,
      `What does the text say about "${keyTerm}"? Explain briefly.`,
      `Define "${keyTerm}" as described in the document.`,
      `According to the text, what is the importance of "${keyTerm}"?`,
    ],
    "Long Questions": [
      `The document discusses "${keyTerm}". Explain this concept in detail with examples from the text.`,
      `Describe the role of "${keyTerm}" as mentioned in the document. How does it relate to ${subject}?`,
      `Write a detailed note on "${keyTerm}" based on the information provided in the document.`,
    ],
    "True/False": [
      `The document states that "${line.slice(0, 80)}..."`,
      `According to the text, "${keyTerm}" is a fundamental concept in ${subject}.`,
      `The information in the document suggests that "${keyTerm}" has practical applications.`,
    ],
    "Numerical Problems": [
      `Using the data from the document, calculate the value related to "${keyTerm}". Show all steps.`,
      `The document provides information about "${keyTerm}". Solve the related numerical problem.`,
    ],
    "Diagram/Graph-Based Questions": [
      `Draw and label a diagram representing "${keyTerm}" as described in the document.`,
      `Based on the document, sketch and explain the structure/process of "${keyTerm}".`,
    ],
  };

  const list = starters[type] || starters["Short Questions"];
  return list[idx % list.length];
}

function buildMCQOptions(lines: string[], subject: string, idx: number): string[] {
  // Try to extract 4 distinct terms from PDF lines for plausible options
  const terms = lines
    .flatMap((l) => l.split(/[,;:\s]+/).filter((w) => w.length > 4 && /^[A-Za-z]/.test(w)))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(idx * 4, idx * 4 + 4);

  if (terms.length >= 4) return terms.slice(0, 4);

  return [
    `${subject} concept A`,
    `${subject} concept B`,
    `${subject} concept C`,
    `${subject} concept D`,
  ];
}

function buildGenericQuestion(subject: string, type: string, num: number, diff: string): string {
  const diffLabel = diff === "easy" ? "basic" : diff === "medium" ? "important" : "advanced";
  const templates: Record<string, string[]> = {
    "Multiple Choice Questions": [
      `Which of the following is a ${diffLabel} concept in ${subject}?`,
      `What is the ${diffLabel} principle studied in ${subject}?`,
      `Which statement correctly describes a ${diffLabel} topic in ${subject}?`,
      `In ${subject}, which of the following represents a ${diffLabel} idea?`,
    ],
    "Short Questions": [
      `Define a ${diffLabel} term used in ${subject}.`,
      `Explain a ${diffLabel} concept in ${subject} with an example.`,
      `What is the significance of a ${diffLabel} topic in ${subject}?`,
      `Describe the main features of a ${diffLabel} concept in ${subject}.`,
    ],
    "Long Questions": [
      `Discuss in detail a ${diffLabel} concept in ${subject} with examples and applications.`,
      `Explain the importance and real-world applications of a ${diffLabel} topic in ${subject}.`,
      `Write a detailed note on a ${diffLabel} chapter in ${subject}, covering all key aspects.`,
    ],
    "True/False": [
      `A ${diffLabel} principle of ${subject} applies in all standard conditions.`,
      `The ${diffLabel} concept studied in ${subject} has direct practical applications.`,
      `All ${diffLabel} theories in ${subject} are based on experimental evidence.`,
    ],
    "Numerical Problems": [
      `Solve a ${diffLabel} numerical problem using the standard formula from ${subject}. Show all working.`,
      `Calculate the result for a ${diffLabel} problem involving the key formula from ${subject}.`,
    ],
    "Diagram/Graph-Based Questions": [
      `Draw and label a ${diffLabel} diagram representing a key concept in ${subject}.`,
      `Interpret the given ${diffLabel} graph and answer the questions based on ${subject}.`,
    ],
  };
  const list = templates[type] || templates["Short Questions"];
  return list[(num - 1) % list.length];
}

// ── Structure + validate parsed JSON ─────────────────────────────────────
function structurePaper(parsed: Record<string, unknown>, params: GenerateParams): IGeneratedPaper {
  const totalMarks = params.questionTypes.reduce((s, qt) => s + qt.count * qt.marksPerQuestion, 0);
  const rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];

  const sections: ISection[] = params.questionTypes.map((qtSpec, idx) => {
    // Match by index first, then by questionType keyword
    let rawSec = rawSections[idx] as Record<string, unknown> | undefined;
    if (!rawSec || typeof rawSec !== "object") {
      rawSec = rawSections.find((s: unknown) => {
        const sec = s as Record<string, unknown>;
        const qt = String(sec.questionType || sec.title || "").toLowerCase();
        return qt.includes(qtSpec.type.toLowerCase().split(" ")[0]);
      }) as Record<string, unknown> | undefined;
    }
    rawSec = rawSec || {};

    const rawQuestions = Array.isArray(rawSec.questions) ? rawSec.questions : [];

    const questions: IQuestion[] = rawQuestions.slice(0, qtSpec.count).map((q: unknown) => {
      const qObj = q as Record<string, unknown>;
      const text = String(qObj.text || "").trim();
      const rawDiff = String(qObj.difficulty || "medium").toLowerCase();
      const difficulty = (["easy", "medium", "hard"].includes(rawDiff) ? rawDiff : "medium") as "easy" | "medium" | "hard";
      const marks = Number(qObj.marks) || qtSpec.marksPerQuestion;

      let options: string[] | undefined;
      if (qtSpec.type === "Multiple Choice Questions") {
        const rawOpts = Array.isArray(qObj.options) ? (qObj.options as string[]) : [];
        options = rawOpts.length >= 4
          ? rawOpts.slice(0, 4).map(String)
          : ["Option A", "Option B", "Option C", "Option D"];
      } else if (qtSpec.type === "True/False") {
        options = ["True", "False"];
      }

      return { id: uuidv4(), text: text || `Question ${idx + 1} on ${params.subject}`, difficulty, marks, type: qtSpec.type, options };
    });

    // Pad if AI returned fewer questions than requested
    while (questions.length < qtSpec.count) {
      const i = questions.length;
      const diff: "easy" | "medium" | "hard" = i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard";
      const pdfLines = params.uploadedFileContent
        ? extractTextFromFile(params.uploadedFileContent).split(/[\n.!?]/).filter((l) => l.trim().length > 20).slice(0, 40)
        : [];
      const text = pdfLines.length > 3
        ? buildQuestionFromPDF(pdfLines, qtSpec.type, params.subject, i, diff)
        : buildGenericQuestion(params.subject, qtSpec.type, i + 1, diff);

      questions.push({
        id: uuidv4(), text, difficulty: diff, marks: qtSpec.marksPerQuestion, type: qtSpec.type,
        options: qtSpec.type === "Multiple Choice Questions"
          ? buildMCQOptions(pdfLines, params.subject, i)
          : qtSpec.type === "True/False" ? ["True", "False"] : undefined,
      });
    }

    const sectionLetter = String.fromCharCode(65 + idx);
    return {
      id: uuidv4(),
      title: String(rawSec.title || `Section ${sectionLetter}`),
      instruction: String(rawSec.instruction || buildInstruction(qtSpec)),
      questionType: qtSpec.type,
      questions,
      totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    };
  });

  const rawInstructions = Array.isArray(parsed.generalInstructions)
    ? (parsed.generalInstructions as string[]).filter((s) => typeof s === "string" && s.trim().length > 0)
    : [];

  return {
    id: uuidv4(),
    assignmentId: params.assignmentId,
    title: String(parsed.title || params.title),
    schoolName: params.schoolName,
    subject: params.subject,
    className: params.className,
    timeAllowed: params.timeAllowed,
    totalMarks,
    generalInstructions: rawInstructions.length > 0 ? rawInstructions : [
      "Read all questions carefully before answering.",
      "All questions are compulsory unless stated otherwise.",
      "Write neatly and legibly.",
      "Marks are indicated against each question.",
    ],
    sections,
    createdAt: new Date().toISOString(),
  };
}
