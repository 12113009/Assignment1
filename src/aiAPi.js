// aiApi.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Choose a model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
console.log('Making the functional call')
let systemPrompt = `Assume you are a co-pilot for IDE just like cursor.You need to answer the user query in this manner:
1. Go through the prompt step  by step and analyze if user query is about code that is submitted along with this prompt at bottom.
2. Analyze prompt and make sure if the prompt is about the code included in query or not
3. If not, just answer the query.
4. If yes, make the required changes in code and return it

Output Format:
1. whenever you need to return the code, first return code only with required comments and below that include explanation if any
2. Make exaplanation absrtact. do  not strech it too much.
3. Make sure not to include user prompt in output unless included
`
// Function to call Gemini with prompt + context
export const callGemini = async (prompt, context = '') => {
  try {
    const input = context ? `Treat this as system prompt : ${systemPrompt}\n${prompt}\n\nContext:\n${context}` : prompt;

    const result = await model.generateContent(input);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Failed to fetch AI response.";
  }
};
