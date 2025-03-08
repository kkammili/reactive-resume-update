/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.AI_KEY });

type JobDescription = {
  companyName: string;
  jobDescTechSkills: string[];
};

/**
 * Extracts company name, company details, and technical skills from a job description.
 * @param {string} jobDescription - The job description text.
 * @returns {Object} - An object containing the extracted details in the following format:
 * {
 *   company_name: "string",
 *   company_details: "string",
 *   job_desc_tech_skills: ["string"]
 * }
 */
export const extractJobDescSkills = async (jobDescription: string): Promise<JobDescription> => {
  const prompt = `Extract the following details from the given job description:
- Company name
- Technical skills

Make sure technical skills are the necessary skills needed for the programmer before populating it.

Generate the JSON object as plain text, without any code block formatting (like \`\`\`), explanation, or additional text. The output should only contain the valid JSON object in the following format:

{
  "companyName": "string",
  "jobDescTechSkills": ["string"]
}

Job Description:
"""
${jobDescription}
"""
`;

  try {
    // Call your AI utility function (e.g., promptUtil) to process the prompt
    const response = await promptUtil(prompt);

    // Ensure response is a string and not null or undefined
    if (typeof response !== "string") {
      throw new TypeError("AI response is not a valid string.");
    }

    // Parse the response into a JSON object
    const extractedDetails = JSON.parse(response);

    return extractedDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Adds missing technical skills to existing categories without creating redundant categories or empty skill entries.
 * @param {Object} existingSkills - The existing skills structure.
 * @param {string[]} missingSkills - The list of missing technical skills.
 * @returns {Object} - An object containing the updated skills structure without empty categories.
 */
export const addingMissingSkills = async (existingSkills: object, missingSkills: string[]) => {
  const prompt =
    `You are an AI that classifies technology skills into categories for resume structuring. Given a list of missing technical skills and an existing skills structure, categorize each missing skill into one of these categories without creating redundancies:\n\n` +
    `- Frontend Technologies\n` +
    `- Frontend Testing\n` +
    `- Backend Technologies\n` +
    `- DevOps & Tools\n` +
    `- Databases\n` +
    `- Cloud Technologies\n` +
    `- Infrastructure\n` +
    `- Miscellaneous (if you cannot categorize it)\n\n` +
    `### Existing Skills Structure:\n${JSON.stringify(existingSkills)}\n\n` +
    `### Missing Skills:\n${JSON.stringify(missingSkills)}\n\n` +
    `### Instructions:\n` +
    `- **Do not create redundant categories.** Merge skills into existing categories wherever possible.\n` +
    `- **Preserve old skills.** Only add new skills if they are not already present in the existing structure.\n` +
    `- **Avoid duplication.** Ensure skills are not duplicated across categories.\n` +
    `- **Do not include empty categories.** Remove any categories with no skills.\n\n` +
    `Return a JSON object with the updated skills structure in the following format:\n\n` +
    `{\n` +
    `  "items": [\n` +
    `    {\n` +
    `      "id": "string",\n` +
    `      "visible": boolean,\n` +
    `      "name": "string",\n` +
    `      "description": "string",\n` +
    `      "level": number,\n` +
    `      "keywords": ["string"]\n` +
    `    }\n` +
    `  ]\n` +
    `}`;

  try {
    // Call your AI utility function (e.g., promptUtil) to process the prompt
    const response = await promptUtil(prompt);

    // Ensure response is a string and not null or undefined
    if (typeof response !== "string") {
      throw new TypeError("AI response is not a valid string.");
    }

    // Parse the response into a JSON object
    const updatedSkills = JSON.parse(response);

    // Filter out categories with empty keywords
    updatedSkills.items = updatedSkills.items.filter(
      (item: any) => item.keywords && item.keywords.length > 0,
    );

    return updatedSkills;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const generateResumePoints = async (missingSkills: string[]) => {
  const prompt =
    `Generate professional resume bullet points for these skills: ${JSON.stringify(missingSkills)}\n\n` +
    `STRICT RULES:\n` +
    `1. For each skill, generate 2 UNIQUE points with different action verbs\n` +
    `2. Include measurable impact where possible\n` +
    `3. Output ONLY valid JSON array format with double quotes\n` +
    `4. FORBIDDEN: Markdown, triple backticks, or any non-JSON text\n` +
    `5. Example format for "React":\n` +
    `   ["Developed 15+ reusable React components reducing development time by 40%",\n` +
    `    "Migrated legacy jQuery UI to React, improving page load speed by 2.5s"]\n\n` +
    `OUTPUT STRICTLY IN THIS FORMAT:\n` +
    `["point1", "point2", "point3", ...]`;

  try {
    const rawResponse: string = (await promptUtil(prompt)) ?? "";

    // Sanitize response before parsing
    const sanitized = rawResponse
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .replace(/,\s*]/g, "]") // Remove trailing commas
      .replace(/^[^[]+/, "") // Remove non-JSON prefix
      .replace(/[^\]]+$/, "") // Remove non-JSON suffix
      .trim();

    return JSON.parse(sanitized);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Resume points generation failed: ${errorMessage}`);
  }
};

/**
 * Rewrites a professional summary to make it more relevant for a specific job.
 * @param {string} oldSummary - The user's old professional summary.
 * @param {string} jobDescription - The job description for the target role.
 * @param {string} companyName - The name of the company the user is applying to.
 * @returns {Object} - An object containing the improved professional summary in the following format:
 * {
 *   improved_professional_summary: "string"
 * }
 */
export const generateProfessionalSummary = async (
  oldSummary: string,
  jobDescription: string,
  companyName: string,
) => {
  const prompt =
    `You are an AI specializing in resume optimization. Given an old professional summary, a job description, and a company name, rewrite the professional summary to make it more relevant for the job while keeping the user's core experience intact.\n\n` +
    `### Old Professional Summary:\n${oldSummary}\n\n` +
    `### Job Description:\n${jobDescription}\n\n` +
    `### Company Name:\n${companyName}\n\n` +
    `### Instructions:\n` +
    `- Ensure the new summary is **concise, engaging, and ATS-friendly**.\n` +
    `- Highlight **key skills and responsibilities** that align with the job description.\n` +
    `- Maintain the **essence of the user's experience**, but make it **more appealing to recruiters**.\n` +
    `- **Always retain awards, recognitions, and quantifiable achievements** (e.g., *Increased efficiency by 30%*, *Awarded Most Valuable Associate in 2024*).\n` +
    `- Include the company name naturally in the summary (e.g., *Excited to bring my expertise to ${companyName}...*).\n\n` +
    `Return a JSON object with the improved summary in this format:\n\n` +
    `{\n` +
    `  "summary": "string"\n` +
    `}`;

  try {
    // Call your AI utility function (e.g., promptUtil) to process the prompt
    const response = await promptUtil(prompt);

    // Ensure response is a string and not null or undefined
    if (typeof response !== "string") {
      throw new TypeError("AI response is not a valid string.");
    }

    // Parse the response into a JSON object
    const improvedSummary = JSON.parse(response);

    return improvedSummary.summary;
  } catch (error) {
    throw new Error(error.message);
  }
};

const generateListHTML = (points: string[]) => {
  if (points.length === 0) return "";
  const listItems = points.map((point) => `<li>${point}</li>`).join("");
  return `<ul>${listItems}</ul>`;
};

export const addResumePointsToExperience = (resumePoints: string[], experience: any) => {
  const half = Math.ceil(resumePoints.length / 2);
  const firstHalfPoints = resumePoints.slice(0, half);
  const secondHalfPoints = resumePoints.slice(half);

  const firstListHTML = generateListHTML(firstHalfPoints);
  const secondListHTML = generateListHTML(secondHalfPoints);

  // If exp is empty then please handle the edge case.
  if (experience.items.length > 0) {
    experience.items[0].summary += firstListHTML;
  }
  if (experience.items.length > 1) {
    experience.items[1].summary += secondListHTML;
  }

  return experience;
};

export const promptUtil = async (prompt: string) => {
  try {
    const res = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      max_tokens: 4096,
    });

    return res.choices[0].message.content;
  } catch (error) {
    throw new Error(error.message);
  }
};
