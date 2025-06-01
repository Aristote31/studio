// supplement-revision-points.ts
'use server';

/**
 * @fileOverview Supplements revision points with definitions, explanations, or examples.
 *
 * - supplementRevisionPoints - A function that enhances revision points with additional information.
 * - SupplementRevisionPointsInput - The input type for the supplementRevisionPoints function.
 * - SupplementRevisionPointsOutput - The return type for the supplementRevisionPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SupplementRevisionPointsInputSchema = z.object({
  topic: z.string().describe('The topic of the revision sheet.'),
  revisionPoints: z
    .string()
    .describe('The key revision points to be supplemented.'),
  language: z
    .enum(['en', 'de', 'fr'])
    .describe('The language of the revision sheet.'),
});
export type SupplementRevisionPointsInput = z.infer<
  typeof SupplementRevisionPointsInputSchema
>;

const SupplementRevisionPointsOutputSchema = z.object({
  supplementedPoints: z
    .string()
    .describe('The revision points supplemented with definitions, explanations, or examples.'),
});
export type SupplementRevisionPointsOutput = z.infer<
  typeof SupplementRevisionPointsOutputSchema
>;

export async function supplementRevisionPoints(
  input: SupplementRevisionPointsInput
): Promise<SupplementRevisionPointsOutput> {
  return supplementRevisionPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supplementRevisionPointsPrompt',
  input: {schema: SupplementRevisionPointsInputSchema},
  output: {schema: SupplementRevisionPointsOutputSchema},
  prompt: `You are an AI assistant helping students create effective revision sheets.

  Given the topic and key revision points below, your task is to supplement each point with relevant definitions, explanations, or examples to enhance understanding and memorization.
  The revision sheet is in the language {{language}}.

  Topic: {{topic}}
  Revision Points: {{revisionPoints}}

  Supplemented Revision Points:`,
});

const supplementRevisionPointsFlow = ai.defineFlow(
  {
    name: 'supplementRevisionPointsFlow',
    inputSchema: SupplementRevisionPointsInputSchema,
    outputSchema: SupplementRevisionPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
