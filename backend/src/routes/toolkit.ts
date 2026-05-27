import { Router, Request, Response } from "express";
import OpenAI from "openai";
import UserModel from "../models/User";
import { getIsConnected } from "../config/database";
import { callFreeAI, hasGroqKey } from "../services/freeAI";

const router = Router();

const SYS = "You are an expert educational assistant for Indian schools (CBSE/ICSE). Respond clearly using plain text with numbered sections and bullet points. No markdown ** or ## symbols.";

router.post("/generate", async (req: Request, res: Response) => {
  const { prompt, apiKey: clientKey, userEmail, groqKey: clientGroqKey } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  let apiKey = clientKey?.trim() || "";
  if (!apiKey && userEmail && getIsConnected()) {
    try { const u = await UserModel.findOne({ email: userEmail.toLowerCase() }); if (u?.openAiKey) apiKey = u.openAiKey; } catch { /* ignore */ }
  }
  if (!apiKey) apiKey = process.env.OPENAI_API_KEY || "";

  const groqKey = clientGroqKey?.trim() || "";
  if (groqKey && groqKey !== "your_groq_api_key_here") process.env.GROQ_API_KEY = groqKey;

  const hasOpenAI = apiKey && apiKey !== "your_openai_api_key_here" && apiKey.startsWith("sk-");

  if (hasOpenAI) {
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: SYS }, { role: "user", content: prompt }],
        temperature: 0.7, max_tokens: 2500,
      });
      const result = completion.choices[0]?.message?.content?.trim() || "";
      return res.json({ result, provider: "openai", demo: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || "";
      const code = (err as { status?: number }).status || 500;
      if (code === 401 || msg.includes("invalid_api_key")) return res.status(401).json({ error: "Invalid OpenAI key. Go to Settings to update it." });
      if (!(code === 429 || msg.includes("quota"))) return res.status(500).json({ error: `OpenAI error: ${msg}` });
      console.log("OpenAI quota exceeded, trying Groq...");
    }
  }

  if (hasGroqKey()) {
    try {
      const result = await callFreeAI(SYS, prompt, 2500);
      if (result) return res.json({ result, provider: "groq", demo: false, notice: "Generated using Groq (free). Add OpenAI key for GPT-4o quality." });
    } catch (err: unknown) {
      const msg = (err as Error).message || "";
      if (msg !== "NO_FREE_KEY") console.error("Groq toolkit error:", msg);
    }
  }

  // Smart local generation — works without any API key
  const result = buildLocalResponse(prompt);
  return res.json({ result, provider: "local", demo: false, notice: "Generated locally. Add an OpenAI or free Groq key in Settings for AI-quality results." });
});

function extract(prompt: string, key: string): string {
  const m = prompt.match(new RegExp(`${key}[^:]*:\\s*([^\\n]+)`, "i"));
  return m?.[1]?.trim() || "";
}

function buildLocalResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  const subject  = extract(prompt, "Subject")  || "the subject";
  const topic    = extract(prompt, "Topic")    || "the topic";
  const grade    = extract(prompt, "Grade")    || "the class";
  const duration = extract(prompt, "Duration") || "45";
  const marks    = extract(prompt, "Total Marks") || "20";
  const count    = parseInt(prompt.match(/(\d+)[- ]question/i)?.[1] || "5");

  if (lower.includes("lesson plan")) {
    return `LESSON PLAN
Subject: ${subject} | Topic: ${topic} | Grade: ${grade} | Duration: ${duration} minutes

LEARNING OBJECTIVES:
1. Students will define and explain key concepts of ${topic}
2. Students will understand practical applications of ${topic} in ${subject}
3. Students will demonstrate understanding through activities and assessment

MATERIALS NEEDED:
- Textbook (${subject}, ${grade})
- Whiteboard and markers
- Worksheets on ${topic}
- Reference charts/diagrams

LESSON STRUCTURE:

Introduction (5 minutes):
- Ask: "What do you already know about ${topic}?"
- Show a real-world example related to ${topic}
- State the learning objectives

Main Teaching (${Math.max(20, parseInt(duration) - 20)} minutes):
- Explain core concepts of ${topic} step by step
- Use everyday examples to illustrate key points
- Draw diagrams and write key terms on the board
- Ask comprehension questions throughout

Student Practice (10 minutes):
- Pair activity: Students discuss ${topic} with a partner
- Individual worksheet: 3-4 short questions on ${topic}

Wrap-up (5 minutes):
- Recap the 3 most important points about ${topic}
- Preview the next lesson

HOMEWORK:
- Read the textbook section on ${topic}
- Answer 5 questions from the chapter exercise
- Find one real-world example of ${topic}

---
Add your OpenAI or free Groq key in Settings for a fully AI-generated lesson plan.`;
  }

  if (lower.includes("rubric")) {
    const m = parseInt(marks);
    return `GRADING RUBRIC
Assignment: ${topic} | Subject: ${subject} | Grade: ${grade} | Total: ${marks} marks

CRITERIA:

1. CONTENT KNOWLEDGE (${Math.round(m * 0.4)} marks)
   Excellent: Complete, accurate understanding of ${topic}
   Good: Mostly correct with minor gaps
   Satisfactory: Basic understanding, some errors
   Needs Improvement: Limited understanding, major errors

2. EXPLANATION AND CLARITY (${Math.round(m * 0.25)} marks)
   Excellent: Clear, logical, easy to follow
   Good: Mostly clear with minor issues
   Satisfactory: Some clarity but lacks depth
   Needs Improvement: Unclear or missing explanation

3. USE OF EXAMPLES (${Math.round(m * 0.2)} marks)
   Excellent: Specific, relevant examples used effectively
   Good: Good examples, mostly relevant
   Satisfactory: Some examples, not always relevant
   Needs Improvement: No examples or irrelevant ones

4. PRESENTATION (${Math.round(m * 0.15)} marks)
   Excellent: Neat, well-organized, proper structure
   Good: Generally neat, minor issues
   Satisfactory: Somewhat organized
   Needs Improvement: Disorganized, hard to read

---
Add your OpenAI or free Groq key in Settings for a custom AI-generated rubric.`;
  }

  if (lower.includes("quiz") || (lower.includes("question") && !lower.includes("lesson"))) {
    const qs = Array.from({ length: Math.min(count, 10) }, (_, i) => `${i + 1}. Which of the following is an important concept related to ${topic} in ${subject}?
   (A) First key aspect of ${topic}
   (B) Second key aspect of ${topic}
   (C) Third key aspect of ${topic}
   (D) An unrelated concept
   [ANSWER: A]`).join("\n\n");
    return `QUIZ — ${topic} | ${subject} | ${grade}\n\n${qs}\n\n---\nAdd your OpenAI or free Groq key in Settings for real curriculum-specific questions.`;
  }

  if (lower.includes("summary") || lower.includes("summarise") || lower.includes("summarize")) {
    return `TOPIC SUMMARY — ${topic}
Subject: ${subject} | Grade: ${grade}

OVERVIEW:
${topic} is a key concept in ${subject} for ${grade} students. It forms the foundation for understanding more advanced topics in this subject.

KEY CONCEPTS:
1. Definition: ${topic} refers to the core principles and ideas in this area of ${subject}
2. Core Principles: Understanding the structure, function, and application of ${topic}
3. Classification: ${topic} can be categorized by its properties and characteristics
4. Connections: ${topic} links to other concepts in ${subject} and has real-world applications

IMPORTANT FACTS:
- ${topic} is foundational for ${grade} ${subject}
- It has both theoretical and practical significance
- Real-world applications of ${topic} are found in everyday life

KEY TAKEAWAYS:
1. ${topic} is central to ${subject} at the ${grade} level
2. Regular practice strengthens understanding
3. Connecting ${topic} to real examples improves retention

REVISION QUESTIONS:
1. What is the definition of ${topic}?
2. What are the main characteristics of ${topic}?
3. How does ${topic} apply in real life?

---
Add your OpenAI or free Groq key in Settings for a detailed AI-generated summary.`;
  }

  if (lower.includes("feedback")) {
    const perf = extract(prompt, "Performance") || "general performance";
    return `STUDENT FEEDBACK
Subject: ${subject} | Grade: ${grade}

Dear Student,

Thank you for your effort in ${subject}. Here is my feedback on your work.

STRENGTHS:
1. You have shown understanding of the core concepts in ${subject}
2. Your work demonstrates effort and commitment to learning
3. You have made progress in applying the concepts from class

AREAS FOR IMPROVEMENT:
1. Strengthen your understanding of key definitions and formulas
   - Review the textbook sections on topics covered
   - Practice different types of problems regularly

2. Provide more detailed and complete answers
   - Use examples to support your explanations
   - Check your work for accuracy before submitting

NEXT STEPS:
1. Review this feedback and revise your work
2. Practice 5-10 questions daily on challenging topics
3. Ask your teacher for clarification on unclear concepts

Keep up the good work! With consistent effort, you will continue to improve in ${subject}.

---
Add your OpenAI or free Groq key in Settings for personalized AI feedback.`;
  }

  return `EDUCATIONAL CONTENT — ${topic} | ${subject} | ${grade}

KEY POINTS:
1. Understanding the fundamentals of ${topic}
2. Applying ${topic} concepts in ${subject}
3. Connecting ${topic} to real-world scenarios
4. Practicing problems related to ${topic}

STUDY TIPS:
- Read the relevant chapter in your ${subject} textbook
- Make notes on key definitions and formulas
- Practice past exam questions on ${topic}
- Discuss difficult concepts with your teacher

---
Add your OpenAI key (sk-...) or free Groq key (gsk_...) in Settings for AI-generated content.`;
}

export default router;
