// src/ai/flows/rate-prompt-version-clarity.ts
"use server";
/**
 * @fileOverview An AI agent for rating the clarity of a prompt version.
 *
 * - ratePromptVersionClarity - A function that rates the clarity of a prompt version.
 * - RatePromptVersionClarityInput - The input type for the ratePromptVersionClarity function.
 * - RatePromptVersionClarityOutput - The return type for the ratePromptVersionClarity function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const RatePromptVersionClarityInputSchema = z.object({
  content: z.string().describe("The content of the prompt version to rate."),
});
export type RatePromptVersionClarityInput = z.infer<typeof RatePromptVersionClarityInputSchema>;

const RatePromptVersionClarityOutputSchema = z.object({
  rating: z.number().int().min(1).max(10).describe("The AI-generated rating (1-10) for the prompt version clarity."),
});
export type RatePromptVersionClarityOutput = z.infer<typeof RatePromptVersionClarityOutputSchema>;

export async function ratePromptVersionClarity(input: RatePromptVersionClarityInput): Promise<RatePromptVersionClarityOutput> {
  return ratePromptVersionClarityFlow(input);
}

const ratePromptVersionClarityPrompt = ai.definePrompt({
  name: "ratePromptVersionClarityPrompt",
  input: { schema: RatePromptVersionClarityInputSchema },
  output: { schema: RatePromptVersionClarityOutputSchema },
  prompt: `Rate the clarity and quality of the following text from 1 to 10, where 1 is very unclear and 10 is very clear:\n\n{{content}}`,
});

const ratePromptVersionClarityFlow = ai.defineFlow(
  {
    name: "ratePromptVersionClarityFlow",
    inputSchema: RatePromptVersionClarityInputSchema,
    outputSchema: RatePromptVersionClarityOutputSchema,
  },
  async (input) => {
    const { output } = await ratePromptVersionClarityPrompt(input);
    return output!;
  }
);
