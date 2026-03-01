import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function tailorCV(cvText: string, jobDescription: string) {
  const prompt = `
    You are an expert career coach and professional CV writer. 
    Your task is to rewrite the provided CV to perfectly align with the given job description.
    
    CRITICAL REQUIREMENTS:
    1. **Natural Language**: The tone must be professional yet natural. Avoid "AI-sounding" buzzword stuffing.
    2. **AI Checker Resilience**: Write in a way that passes AI detection by using varied sentence structures, active voice, and specific context from the candidate's experience.
    3. **Relevance**: Highlight skills and experiences from the CV that are most relevant to the job description.
    4. **Formatting**: Return the output in clean Markdown format.
    5. **Integrity**: Do NOT invent fake experiences. Only rephrase and emphasize existing information from the CV to match the JD's requirements.
    6. **Structure**: Keep a standard CV structure (Contact, Summary, Experience, Skills, Education).

    CANDIDATE CV:
    ${cvText}

    JOB DESCRIPTION:
    ${jobDescription}

    Please provide the tailored CV in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to tailor CV with AI.");
  }
}

export async function extractJD(rawText: string) {
  const prompt = `
    The following text was scraped from a job posting URL. 
    Please extract ONLY the job description part, including:
    - Job Title
    - Company (if available)
    - Responsibilities
    - Requirements/Qualifications
    - Skills needed

    Ignore navigation menus, footers, and unrelated content.
    
    RAW TEXT:
    ${rawText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return rawText; // Fallback to raw text if extraction fails
  }
}
