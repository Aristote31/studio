
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
    .describe('A single string containing the key revision points, formatted with Markdown headings (e.g., "## Point Title\\n\\n## Another Point..."). Each point is typically just a heading. This string is the combined output of a previous extraction step.'),
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
    .describe('The revision points supplemented with definitions, explanations, or examples, formatted as a single, continuous Markdown string. This output MUST BE PURE MARKDOWN TEXT, with no JSON fragments or any other data structures embedded within it. It should be ready for direct display.'),
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
  prompt: `You are an AI assistant creating comprehensive revision material in {{language}}.
Your task is to generate the content for the 'supplementedPoints' field.
The content for 'supplementedPoints' MUST be a single string of well-formatted Markdown.
This Markdown string will contain expanded explanations for revision points.

The input '{{{revisionPoints}}}' provides the initial points as a single string, where each point starts with a Markdown heading like '## Point Title'.

For each point starting with '## ' in the '{{{revisionPoints}}}' input string:
1.  Take the title (the text after '## ').
2.  Expand on this title by providing detailed definitions, clear explanations, and illustrative examples related to it.
3.  Format your expansion for this point starting with the original '## Point Title' Markdown heading, followed by your detailed content.

RULES FOR THE CONTENT OF THE 'supplementedPoints' FIELD:
- The content MUST be ONLY Markdown text.
- ABSOLUTELY NO JSON structures, keys (like "topic", "points", "point", "title", "summary"), or array-like syntax (square brackets, commas separating items as if in an array) should appear within the Markdown text.
- The Markdown text should be a continuous flow of headings (##) and paragraphs.

Topic (for context only, do not include in the output): {{topic}}

Initial Revision Points string (each starting with '## '):
{{{revisionPoints}}}

Example of how ONE point from the '{{{revisionPoints}}}' input string is expanded in your Markdown output:
If a line in '{{{revisionPoints}}}' is:
## Photosynthesis

Your supplemented output for THIS ONE POINT (which will be part of the larger Markdown output for 'supplementedPoints') should be structured like this:
## Photosynthesis
Photosynthesis is the fundamental process by which green plants, algae, and some bacteria convert light energy into chemical energy, stored in the form of glucose (sugar). This vital process occurs in chloroplasts and is crucial for life on Earth.
**Key Components involved:**
- **Sunlight:** Provides the necessary energy for the reactions.
- **Chlorophyll:** The green pigment located in chloroplasts that absorbs light energy.
- **Water (H2O):** Absorbed through the roots and transported to the leaves.
- **Carbon Dioxide (CO2):** Taken in from the atmosphere through small pores on the leaves called stomata.
**Main Stages:**
1.  **Light-dependent reactions:** Occur in the thylakoid membranes of chloroplasts. Light energy is captured by chlorophyll and used to split water molecules (photolysis), releasing oxygen (O2) as a byproduct. This stage also produces energy-carrying molecules ATP and NADPH.
2.  **Light-independent reactions (Calvin Cycle):** Occur in the stroma of chloroplasts. ATP and NADPH from the light reactions are used to convert CO2 into glucose (C6H12O6).
**Overall Equation:**
6CO2 + 6H2O + Light Energy → C6H12O6 + 6O2
**Importance:**
- Produces oxygen, which is essential for respiration in most living organisms.
- Forms the base of most food chains by producing organic compounds from inorganic materials.
- Plays a key role in regulating Earth's atmospheric composition.

Now, process ALL the points provided in the '{{{revisionPoints}}}' input string in this manner.
Combine your supplemented explanations for all points into a single, flowing Markdown text to be used as the value for the 'supplementedPoints' field.
Ensure the entire output for 'supplementedPoints' is in {{language}} and strictly adheres to the Markdown-only rule.

Begin generating the Markdown content for 'supplementedPoints' now:
`,
});

const supplementRevisionPointsFlow = ai.defineFlow(
  {
    name: 'supplementRevisionPointsFlow',
    inputSchema: SupplementRevisionPointsInputSchema,
    outputSchema: SupplementRevisionPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || typeof output.supplementedPoints !== 'string') {
      console.error("Invalid output from supplementRevisionPointsPrompt:", output);
      return { supplementedPoints: "Error: Could not generate supplemented content correctly because the output was not a string or was missing." };
    }
    
    let cleanedOutput = output.supplementedPoints;
    // More targeted cleanup for the specific reported issue, as a fallback.
    // This attempts to remove the problematic JSON-like fragments if the LLM still includes them.
    // Ideally, the prompt improvements should prevent this.
    cleanedOutput = cleanedOutput.replace(/,\s*"points":\s*\[{"point":/g, ''); 
    cleanedOutput = cleanedOutput.replace(/\[{"topic":\s*".*?",\s*"points":\s*\[{"point":/g, '');
    // Attempt to clean up if the LLM wraps the response in a JSON structure for supplementedPoints
    const match = cleanedOutput.match(/^\{\s*"supplementedPoints"\s*:\s*"(.*)"\s*\}$/s);
    if (match && match[1]) {
        cleanedOutput = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    return { supplementedPoints: cleanedOutput };
  }
);

