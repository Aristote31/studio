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
    .describe('A single string containing the key revision points, typically formatted with Markdown headings (e.g., "## Point Title\\nPoint Summary\\n\\n## Another Point..."). This string is the combined output of a previous extraction step.'),
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
    .describe('The revision points supplemented with definitions, explanations, or examples, formatted as a single, continuous Markdown string. This output should be ready for direct display.'),
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
  prompt: `You are an AI assistant tasked with creating comprehensive revision material in {{language}}.
You will receive a topic and a series of pre-extracted revision points, which are provided to you as a single string where each point often starts with a Markdown heading (like '## Title') followed by a brief summary.

Your goal is to take EACH of these points from the input string and expand on its summary by providing detailed definitions, clear explanations, and illustrative examples.
Maintain the original Markdown heading (e.g., '## Title') for each point.
Your entire output MUST be a single, continuous Markdown text.

CRITICAL INSTRUCTIONS:
- DO NOT output JSON.
- DO NOT output any JavaScript object structures.
- DO NOT include keys like "topic", "points", "point", "title", or "summary" in your output text.
- Your output MUST ONLY be the supplemented text in Markdown format.

Topic: {{topic}}

Pre-extracted Revision Points (this is a single string input that you need to process):
{{{revisionPoints}}}

Example of how to process ONE point from the 'revisionPoints' input:
If an input point within '{{{revisionPoints}}}' is:
## Photosynthesis
The process by which green plants use sunlight, water, and carbon dioxide to create their own food.

Your supplemented output for THIS ONE POINT should be something like:
## Photosynthesis
Photosynthesis is the fundamental process by which green plants, algae, and some bacteria convert light energy into chemical energy, stored in the form of glucose (sugar). This vital process occurs in chloroplasts.
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

Now, process ALL the points provided in the '{{{revisionPoints}}}' input string in this manner. Combine your supplemented explanations for all points into a single, flowing Markdown text for the 'Supplemented Revision Points' output. Ensure the output is in {{language}}.

Supplemented Revision Points (ensure this is only well-formatted Markdown text, with no JSON or other structures):
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
      // Fallback or error handling if the output is not as expected
      // This should ideally not happen if the LLM respects the output schema and prompt
      console.error("Invalid output from supplementRevisionPointsPrompt:", output);
      return { supplementedPoints: "Error: Could not generate supplemented content correctly." };
    }
    // Basic cleanup to remove any stray JSON-like fragments if the LLM is still misbehaving slightly.
    // This is a workaround and ideally the prompt should be enough.
    let cleanedOutput = output.supplementedPoints;
    cleanedOutput = cleanedOutput.replace(/,\s*"points":\s*\[{"point":/g, ''); // Specific fragment
    cleanedOutput = cleanedOutput.replace(/\[{"topic":\s*".*?",\s*"points":\s*\[{"point":/g, ''); // More general start
    // Add more aggressive cleanup if needed, but this risks removing legitimate content.
    
    return { supplementedPoints: cleanedOutput };
  }
);

