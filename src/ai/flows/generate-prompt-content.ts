"use server";

/**
 * @fileOverview An AI agent for generating creative prompt content.
 *
 * - generatePromptContent - A function that generates content for a prompt based on a title and initial content.
 * - GeneratePromptContentInput - The input type for the generatePromptContent function.
 * - GeneratePromptContentOutput - The return type for the generatePromptContent function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GeneratePromptContentInputSchema = z.object({
  title: z.string().describe("The title of the prompt."),
  content: z.string().describe("The existing content of the prompt to be used as context."),
});
export type GeneratePromptContentInput = z.infer<typeof GeneratePromptContentInputSchema>;

const GeneratePromptContentOutputSchema = z.object({
  generatedContent: z.string().describe("The AI-generated prompt content."),
});
export type GeneratePromptContentOutput = z.infer<typeof GeneratePromptContentOutputSchema>;

export async function generatePromptContent(input: GeneratePromptContentInput): Promise<GeneratePromptContentOutput> {
  return generatePromptContentFlow(input);
}

const prompt = ai.definePrompt({
  name: "generatePromptContentPrompt",
  input: { schema: GeneratePromptContentInputSchema },
  output: { schema: GeneratePromptContentOutputSchema },
  prompt: `You are an AI assistant that helps users create better prompts. 
Based on the following title and content, generate a more detailed and effective version of the prompt content.

Title: {{{title}}}
Content: {{{content}}}

Generate a new version of the content.`,
});

const generatePromptContentFlow = ai.defineFlow(
  {
    name: "generatePromptContentFlow",
    inputSchema: GeneratePromptContentInputSchema,
    outputSchema: GeneratePromptContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
