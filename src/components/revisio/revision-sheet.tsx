// @ts-nocheck
"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import type { RevisionSheetData } from '@/types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RevisionSheetProps {
  data: RevisionSheetData | null;
}

export function RevisionSheetDisplay({ data }: RevisionSheetProps) {
  const sheetContentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!sheetContentRef.current || !data) return;

    const canvas = await html2canvas(sheetContentRef.current, {
      scale: 2, 
      useCORS: true, 
      backgroundColor: window.getComputedStyle(sheetContentRef.current).backgroundColor, // Use computed background
    });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height] 
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
  
  return (
    <Card className="w-full max-w-4xl mx-auto mt-12 mb-8 shadow-2xl overflow-hidden">
      <div ref={sheetContentRef} className="bg-card p-2 sm:p-4 md:p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-4xl font-headline text-primary text-center break-words">
            {data.topic || "Fiche de Révision"}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">Langue: {data.language === 'fr' ? 'Français' : data.language === 'en' ? 'Anglais' : 'Allemand'}</p>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none text-foreground font-body text-base md:text-lg">
          <div className="p-4 rounded-lg bg-background/50 border border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.supplementedContent}
            </ReactMarkdown>
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
