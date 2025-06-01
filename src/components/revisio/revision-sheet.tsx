// @ts-nocheck
"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Palette } from 'lucide-react';
import type { RevisionSheetData } from '@/types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface RevisionSheetProps {
  data: RevisionSheetData | null;
}

export function RevisionSheetDisplay({ data }: RevisionSheetProps) {
  const sheetContentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!sheetContentRef.current || !data) return;

    const canvas = await html2canvas(sheetContentRef.current, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // If images are from external sources
      backgroundColor: null, // Use element's background
    });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height] // Use canvas dimensions for PDF page size
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`Revisio_${data.topic.replace(/\s+/g, '_')}.pdf`);
  };

  if (!data || !data.supplementedContent) {
    return (
      <div className="mt-8 text-center text-muted-foreground py-10">
        <FileText className="mx-auto h-16 w-16 mb-4" />
        <p className="text-xl">Votre fiche de révision apparaîtra ici.</p>
        <p>Soumettez du contenu pour commencer.</p>
      </div>
    );
  }
  
  // Basic formatting for supplemented content
  const formattedContent = data.supplementedContent.split('\n').map((paragraph, index) => {
    if (paragraph.startsWith('## ')) { // Treat as H2
      return <h2 key={index} className="text-xl font-headline text-primary mt-4 mb-2">{paragraph.substring(3)}</h2>;
    }
    if (paragraph.startsWith('# ')) { // Treat as H1 (though unlikely from AI, for safety)
      return <h1 key={index} className="text-2xl font-headline text-primary mt-4 mb-2">{paragraph.substring(2)}</h1>;
    }
    if (paragraph.trim() === '') {
      return <br key={index} />;
    }
    return <p key={index} className="mb-2 leading-relaxed">{paragraph}</p>;
  });

  return (
    <Card className="w-full max-w-4xl mx-auto mt-12 mb-8 shadow-2xl overflow-hidden">
      <div ref={sheetContentRef} className="bg-card p-2 sm:p-4 md:p-6"> {/* Inner div for PDF capture */}
        <CardHeader className="pb-4">
          <CardTitle className="text-4xl font-headline text-primary text-center break-words">
            {data.topic || "Fiche de Révision"}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">Langue: {data.language === 'fr' ? 'Français' : data.language === 'en' ? 'Anglais' : 'Allemand'}</p>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none text-foreground font-body text-base md:text-lg">
          {/* 
            The AI output 'supplementedPoints' is a string. 
            We can improve its presentation here.
            For example, split by newlines and render paragraphs, or use a markdown parser if the AI provides markdown.
          */}
          <div className="space-y-3 p-4 rounded-lg bg-background/50 border border-border">
            {formattedContent}
          </div>
        </CardContent>
      </div>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center p-6 bg-muted/30 border-t">
        <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
          Prévisualisation de votre fiche de révision.
        </div>
        <Button onClick={handleExportPDF} variant="default" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Download className="mr-2 h-5 w-5" />
          Exporter en PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
