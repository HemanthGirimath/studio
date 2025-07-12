'use server';

/**
 * @fileOverview An AI agent that provides contextual responses based on previous interactions.
 *
 * - contextualResponse - A function that handles the contextual response process.
 * - ContextualResponseInput - The input type for the contextualResponse function.
 * - ContextualResponseOutput - The return type for the contextualResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualResponseInputSchema = z.object({
  query: z.string().describe('The user query related to emails.'),
  context: z.string().optional().describe('The previous conversation context.'),
  emailMetadata: z
    .array(
      z.object({
        id: z.string(),
        from: z.string(),
        subject: z.string(),
        date: z.string(),
        snippet: z.string(),
      })
    )
    .optional()
    .describe('A list of recent email metadata to answer questions from.'),
});
export type ContextualResponseInput = z.infer<typeof ContextualResponseInputSchema>;

const ContextualResponseOutputSchema = z.object({
  response: z.string().describe('The AI response to the user query.'),
  updatedContext: z.string().describe('The updated conversation context.'),
});
export type ContextualResponseOutput = z.infer<typeof ContextualResponseOutputSchema>;

export async function contextualResponse(input: ContextualResponseInput): Promise<ContextualResponseOutput> {
  return contextualResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualResponsePrompt',
  input: {schema: ContextualResponseInputSchema},
  output: {schema: ContextualResponseOutputSchema},
  prompt:
    'You are a helpful AI assistant specializing in Gmail management.\n' +
    "Your goal is to answer the user's questions based on the provided email metadata.\n" +
    'You also maintain context throughout the conversation to provide relevant and accurate responses.\n' +
    '\n' +
    "Use the following email metadata to answer the user's query. The metadata is an array of objects with from, subject, date, and a snippet of the body.\n" +
    '```\n' +
    '{{json emailMetadata}}\n' +
    '```\n' +
    '\n' +
    'Previous Conversation Context:\n' +
    '{{context}}\n' +
    '\n' +
    'User Query:\n' +
    '{{query}}\n' +
    '\n' +
    'Response: {"response": "<AI Response>", "updatedContext": "<Updated Conversation Context>"}',
});

const contextualResponseFlow = ai.defineFlow(
  {
    name: 'contextualResponseFlow',
    inputSchema: ContextualResponseInputSchema,
    outputSchema: ContextualResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
