import type { ExtractRevisionPointsOutput } from '@/ai/flows/extract-revision-points';

export type Language = 'en' | 'de' | 'fr';

export interface RevisionSheetData {
  topic: string;
  language: Language;
  extractedPoints: ExtractRevisionPointsOutput['revisionPoints'] | null;
  supplementedContent: string | null;
}

export interface ContentInput {
  inputType: 'text' | 'image';
  textContent: string;
  imageFiles?: FileList; // Changed from imageFile to imageFiles
  topic: string;
  language: Language;
}
