
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

const ImageInputSchema = z.object({
  url: z.string().describe("A data URI of the image content. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  displayIndex: z.number().describe("The 1-based index of the image for display purposes.")
});

const ExtractRevisionPointsInputSchema = z.object({
  textContent: z.string().optional().describe('The text content to extract revision points from.'),
  imageDataObjects: z.array(ImageInputSchema).optional().describe("A list of image objects, each containing a data URI and a display index."),
  language: z.enum(['en', 'de', 'fr']).describe('The language of the revision sheet.'),
}).refine(data => data.textContent || (data.imageDataObjects && data.imageDataObjects.length > 0), {
  message: "Either textContent or at least one image must be provided.",
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
  console.log('extractRevisionPoints flow invoked with input:', JSON.stringify(input, null, 2));
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

  {{#if imageDataObjects}}
  The content to analyze are the following images. Extract text, concepts, and key information visible in them:
  {{#each imageDataObjects}}
  Image {{this.displayIndex}}:
  {{media url=this.url}}
  {{/each}}
  {{/if}}

  Language for the output: {{language}}

  Your output should be a list of revision points, where each point has a title and a short summary.
  Make sure the output is in the language: {{language}}.
  `,
});

const extractRevisionPointsFlow = ai.defineFlow(
  {
    name: 'extractRevisionPointsFlow',
    inputSchema: ExtractRevisionPointsInputSchema,
    outputSchema: ExtractRevisionPointsOutputSchema,
  },
  async input => {
    try {
      console.log('Attempting to call extractRevisionPointsPrompt with input:', JSON.stringify(input, null, 2));
      const {output} = await prompt(input);
      if (!output || !output.revisionPoints) {
        const errorMsg = "Invalid or missing revisionPoints in output from extractRevisionPointsPrompt.";
        console.error(errorMsg, "Output received:", output);
        
        let errorTitle = "Erreur d'Extraction";
        let errorSummary = "L'IA n'a pas pu retourner de points de révision valides.";
        if (input.language === 'en') {
            errorTitle = "Extraction Error";
            errorSummary = "The AI could not return valid revision points.";
        } else if (input.language === 'de') {
            errorTitle = "Extraktionsfehler";
            errorSummary = "Die KI konnte keine gültigen Revisionspunkte zurückgeben.";
        }
        return { revisionPoints: [{ title: errorTitle, summary: `${errorSummary} (Output was: ${JSON.stringify(output)})` }] };
      }
      console.log('extractRevisionPointsPrompt call successful.');
      return output!;
    } catch (error: any) {
      console.error("Error in extractRevisionPointsFlow during AI call. Input was:", JSON.stringify(input, null, 2));
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let errorTitle = "Erreur d'Extraction Critique";
      let errorSummary = "Une erreur critique est survenue lors de l'extraction des points de révision.";
      if (input.language === 'en') {
        errorTitle = "Critical Extraction Error";
        errorSummary = "A critical error occurred while extracting revision points.";
      } else if (input.language === 'de') {
        errorTitle = "Kritischer Extraktionsfehler";
        errorSummary = "Beim Extrahieren der Revisionspunkte ist ein kritischer Fehler aufgetreten.";
      }
      
      return { 
        revisionPoints: [{ 
          title: errorTitle, 
          summary: `${errorSummary} Détails: ${error.message || 'Erreur inconnue.'}. Veuillez vérifier les logs du serveur.`
        }] 
      };
    }
  }
);
