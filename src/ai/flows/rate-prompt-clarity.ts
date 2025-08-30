"use server";

/**
 * @fileOverview An AI agent for rating the clarity and quality of a prompt.
 *
 * - ratePromptClarity - A function that rates the clarity of a given prompt.
 * - RatePromptClarityInput - The input type for the ratePromptClarity function.
 * - RatePromptClarityOutput - The return type for the ratePromptClarity function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const RatePromptClarityInputSchema = z.object({
  content: z.string().describe("The content of the prompt to be rated."),
});
export type RatePromptClarityInput = z.infer<typeof RatePromptClarityInputSchema>;

const RatePromptClarityOutputSchema = z.object({
  rating: z.number().int().min(1).max(10).describe("The AI-generated rating (1-10) for the prompt content."),
});
export type RatePromptClarityOutput = z.infer<typeof RatePromptClarityOutputSchema>;

export async function ratePromptClarity(input: RatePromptClarityInput): Promise<RatePromptClarityOutput> {
  return ratePromptClarityFlow(input);
}

const prompt = ai.definePrompt({
  name: "ratePromptClarityPrompt",
  input: { schema: RatePromptClarityInputSchema },
  output: { schema: RatePromptClarityOutputSchema },
  prompt: `Rate the following text from 1 to 10 based on clarity and quality.\n\nText: {{{content}}}`,
});

const ratePromptClarityFlow = ai.defineFlow(
  {
    name: "ratePromptClarityFlow",
    inputSchema: RatePromptClarityInputSchema,
    outputSchema: RatePromptClarityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
