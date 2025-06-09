'use server';

/**
 * @fileOverview Extracts key concepts and information from an image or text for revision sheet creation.
 *
 * - extractRevisionPoints - A function that handles the extraction of revision points.
 * - ExtractRevisionPointsInput - The input type for the extractRevisionPoints function.
 * - ExtractRevisionPointsOutput - The return type for the extractRevisionPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractRevisionPointsInputSchema = z.object({
  textContent: z.string().optional().describe('The text content to extract revision points from.'),
  imageDataUris: z.array(z.string()).optional().describe("A list of data URIs of the image content to extract revision points from. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  language: z.enum(['en', 'de', 'fr']).describe('The language of the revision sheet.'),
}).refine(data => data.textContent || (data.imageDataUris && data.imageDataUris.length > 0), {
  message: "Either textContent or at least one imageDataUri must be provided.",
  path: ["textContent"], 
});

export type ExtractRevisionPointsInput = z.infer<typeof ExtractRevisionPointsInputSchema>;

const ExtractRevisionPointsOutputSchema = z.object({
  revisionPoints: z.array(
    z.object({
      title: z.string().describe('The title of the revision point.'),
      summary: z.string().describe('A short summary of the revision point.'),
    })
  ).describe('The extracted revision points.'),
});
export type ExtractRevisionPointsOutput = z.infer<typeof ExtractRevisionPointsOutputSchema>;

export async function extractRevisionPoints(input: ExtractRevisionPointsInput): Promise<ExtractRevisionPointsOutput> {
  return extractRevisionPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractRevisionPointsPrompt',
  input: {schema: ExtractRevisionPointsInputSchema},
  output: {schema: ExtractRevisionPointsOutputSchema},
  prompt: `You are an expert at extracting key concepts and information from various types of content to create concise and effective revision sheets.

  Analyze the provided content and extract the most important revision points. Each revision point should include a title and a short summary.
  The revision sheet should be in the language specified by the user.

  {{#if textContent}}
  The content to analyze is the following text:
  {{{textContent}}}
  {{/if}}

  {{#if imageDataUris}}
  The content to analyze are the following images. Extract text, concepts, and key information visible in them:
  {{#each imageDataUris}}
  Image {{add @index 1}}:
  {{media url=this}}
  {{/each}}
  {{/if}}

  Language for the output: {{language}}

  Your output should be a list of revision points, where each point has a title and a short summary.
  Make sure the output is in the language: {{language}}.
  `,
  customizers: [
    (prompt) => {
        prompt.handlebars.registerHelper('add', function (a, b) {
            return a + b;
        });
        return prompt;
    }
  ]
});

const extractRevisionPointsFlow = ai.defineFlow(
  {
    name: 'extractRevisionPointsFlow',
    inputSchema: ExtractRevisionPointsInputSchema,
    outputSchema: ExtractRevisionPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
