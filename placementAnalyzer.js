import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  console.warn("⚠️ GOOGLE_API_KEY not set");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
        responseMimeType: "application/json"
    }
});

function extractJson(text) {
  // Remove markdown code fences if present
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

// ---------------- CORE ANALYSIS FUNCTION ----------------
export async function analyzeStudent({ skills, projects, targetRole, hoursPerWeek }) {
  const prompt = `You are an expert AI Technical Recruiter and Career Coach specializing in student placement readiness assessment.

INPUT DATA:
${JSON.stringify({
  skills,
  projects,
  targetRole,
  availableHoursPerWeek: hoursPerWeek
}, null, 2)}

TASKS:
1. Estimate a readiness score (0-100) using the following weighting as a heuristic guideline:
   - Skill-role alignment (40%)
   - Project relevance (30%)
   - Missing critical skills (20%)
   - Time feasibility (10%)

2. Calculate skill-job match percentage based on overlap with industry expectations for the target role.

3. Identify:
   - 3-5 missing critical skills
   - 3-5 priority skills to strengthen

4. Create a realistic 4-week roadmap:
   - Respect the ${hoursPerWeek} hours/week limit
   - Each week must have 3-5 specific, actionable tasks

5. Suggest 3-4 alternative job roles the student can realistically target based on existing skill overlap.
   - Exclude the target role itself.

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON
- No markdown
- No explanations
- No text outside JSON

JSON FORMAT:
{
  "readinessScore": number,
  "skillJobMatchPercentage": number,
  "missingSkills": [string],
  "prioritySkills": [string],
  "alternativeRoles": [
    {
      "role": "<job title>",
      "matchReason": "<why this role fits the student's current skills/projects>"
    }
  ],
  "roadmap": {
    "week1": [string],
    "week2": [string],
    "week3": [string],
    "week4": [string]
  }
}

If you cannot comply exactly, return {}.`;


    const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });

  //return JSON.parse(result.response.text());
  return extractJson(result.response.text());
}

// -------------------- Resume analysis--------------------
export async function analyzeResume({
  resumeText,
  targetRole,
  hoursPerWeek
}) {
  const prompt = `
  TASKS:
1. Estimate a readiness score (0–100) using the following weighting as a heuristic guideline:
   - Skill-role alignment (40%)
   - Project relevance (30%)
   - Missing critical skills (20%)
   - Time feasibility (10%)

2. Calculate skill-job match percentage based on overlap with industry expectations for the target role.

3. Identify:
   - 3–5 missing critical skills
   - 3–5 priority skills to strengthen

4. Create a realistic 4-week roadmap:
   - Respect the ${hoursPerWeek} hours/week limit
   - Each week must have 3–5 specific, actionable tasks

5. Suggest 3–4 alternative job roles the student can realistically target based on existing skill overlap.
   - Exclude the target role itself.

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON
- No markdown
- No explanations
- No text outside JSON

Resume Text:
${resumeText.slice(0, 6000)}

Target Role: ${targetRole}
Available Hours Per Week: ${hoursPerWeek}

Return output strictly in this JSON format:
{
  "readinessScore": number,
  "skillJobMatchPercentage": number,
  "missingSkills": [string],
  "prioritySkills": [string],
  "alternativeRoles": [
    {
      "role": "<job title>",
      "matchReason": "<why this role fits the resume>"
    }
  ],
  "roadmap": {
    "week1": [string],
    "week2": [string],
    "week3": [string],
    "week4": [string]
  }
}

If you cannot comply exactly, return {}.

`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });

  //return JSON.parse(result.response.text());
  return extractJson(result.response.text());
}
