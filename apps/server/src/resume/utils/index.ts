import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.AI_KEY });

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
export const extractJobDescSkills = async (jobDescription: string) => {
  const prompt = `Extract the following details from the given job description:
- Company name
- Technical skills

Make sure technical skills are the necessary skills needed for the programmer before populating it.

Generate the JSON object as plain text, without any code block formatting (like \`\`\`), explanation, or additional text. The output should only contain the valid JSON object in the following format:

{
  "company_name": "string",
  "job_desc_tech_skills": ["string"]
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
