// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { ContentInputForm } from '@/components/revisio/content-input';
import { RevisionSheetDisplay } from '@/components/revisio/revision-sheet';
import type { RevisionSheetData, Language } from '@/types';
import { extractRevisionPoints, type ExtractRevisionPointsInput, type ExtractRevisionPointsOutput } from '@/ai/flows/extract-revision-points';
import { supplementRevisionPoints, type SupplementRevisionPointsInput } from '@/ai/flows/supplement-revision-points';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ContentInputFormValues {
  topic: string;
  language: Language;
  inputType: 'text' | 'image';
  textContent?: string;
  imageFiles?: FileList; // Changed from imageFile to imageFiles
}

export default function RevisioPage() {
  const [revisionData, setRevisionData] = useState<RevisionSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFormSubmit = async (formData: ContentInputFormValues, imagesAsDataUrls?: string[]) => {
    setIsLoading(true);
    setError(null);
    setRevisionData(null);

    try {
      let extractionInput: ExtractRevisionPointsInput;

      if (formData.inputType === 'image' && imagesAsDataUrls && imagesAsDataUrls.length > 0) {
        extractionInput = { imageDataUris: imagesAsDataUrls, language: formData.language };
      } else if (formData.inputType === 'text' && formData.textContent) {
        extractionInput = { textContent: formData.textContent, language: formData.language };
      } else {
        throw new Error("Contenu invalide. Veuillez fournir du texte ou au moins une image.");
      }
      
      toast({
        title: "Étape 1/2: Extraction des points clés...",
        description: "L'IA analyse votre contenu.",
      });
      const extractedOutput: ExtractRevisionPointsOutput = await extractRevisionPoints(extractionInput);

      if (!extractedOutput.revisionPoints || extractedOutput.revisionPoints.length === 0) {
        throw new Error("L'IA n'a pas pu extraire de points de révision pertinents de votre contenu.");
      }

      const revisionPointsString = extractedOutput.revisionPoints
        .map(p => `## ${p.title}`)
        .join('\n\n');

      const supplementationInput: SupplementRevisionPointsInput = {
        topic: formData.topic,
        revisionPoints: revisionPointsString,
        language: formData.language,
      };

      toast({
        title: "Étape 2/2: Enrichissement du contenu...",
        description: "L'IA ajoute des détails et des explications.",
      });
      const supplementedOutput = await supplementRevisionPoints(supplementationInput);

      setRevisionData({
        topic: formData.topic,
        language: formData.language,
        extractedPoints: extractedOutput.revisionPoints,
        supplementedContent: supplementedOutput.supplementedPoints,
      });

      toast({
        title: "Fiche de révision générée!",
        description: "Votre fiche est prête à être consultée et exportée.",
        variant: "default",
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (err: any) {
      console.error("Error generating revision sheet:", err);
      const errorMessage = err.message || "Une erreur est survenue lors de la génération de la fiche.";
      setError(errorMessage);
      toast({
        title: "Erreur de génération",
        description: errorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-400" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4 bg-gradient-to-br from-background to-secondary/30">
      <header className="mb-10 text-center">
        <h1 className="text-6xl font-headline text-primary tracking-tight">
          Revisio
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Transformez vos notes en fiches de révision élégantes et efficaces.
        </p>
      </header>

      <main className="w-full">
        <ContentInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        
        {error && (
          <div className="mt-8 max-w-2xl mx-auto p-4 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3" />
            <p>{error}</p>
          </div>
        )}

        <RevisionSheetDisplay data={revisionData} />
      </main>
      
      <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Revisio. Tous droits réservés.</p>
        <p>Propulsé par l'Intelligence Artificielle.</p>
      </footer>
    </div>
  );
}
