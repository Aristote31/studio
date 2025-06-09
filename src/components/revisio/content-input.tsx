// @ts-nocheck
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, FileText, Languages, BookOpen, Loader2, FileImage } from 'lucide-react';
import type { Language } from '@/types';
import Image from 'next/image';

const formSchema = z.object({
  topic: z.string().min(3, { message: "Le sujet doit contenir au moins 3 caractères." }),
  language: z.enum(['en', 'de', 'fr'], { errorMap: () => ({ message: "Veuillez sélectionner une langue." }) }),
  inputType: z.enum(['text', 'image']),
  textContent: z.string().optional(),
  imageFiles: z.any().optional(), // Changed from z.instanceof(FileList) to z.any()
}).superRefine((data, ctx) => {
  if (data.inputType === 'text' && (!data.textContent || data.textContent.trim().length < 10)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['textContent'],
      message: "Le texte doit contenir au moins 10 caractères.",
    });
  }
  if (data.inputType === 'image' && (!data.imageFiles || data.imageFiles.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imageFiles'],
      message: "Veuillez télécharger au moins une image.",
    });
  }
});

type ContentInputFormValues = z.infer<typeof formSchema>;

interface ContentInputProps {
  onSubmit: (data: ContentInputFormValues, imagesAsDataUrls?: string[]) => Promise<void>;
  isLoading: boolean;
}

export function ContentInputForm({ onSubmit, isLoading }: ContentInputProps) {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedInputType, setSelectedInputType] = useState<'text' | 'image'>('text');

  const { control, handleSubmit, register, setValue, watch, formState: { errors } } = useForm<ContentInputFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      language: 'fr',
      inputType: 'text',
      textContent: '',
    },
  });

  const inputType = watch('inputType');

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setValue('imageFiles', files);
      const newPreviews: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          // Only update previews once all files are read for simplicity in this example
          // A more robust solution might update previews individually or show placeholders
          if (newPreviews.length === files.length) {
            setImagePreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setValue('imageFiles', undefined);
      setImagePreviews([]);
    }
  };

  const handleFormSubmit = async (data: ContentInputFormValues) => {
    if (data.inputType === 'image' && data.imageFiles && data.imageFiles.length > 0) {
      const filePromises = Array.from(data.imageFiles).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      try {
        const imagesAsDataUrls = await Promise.all(filePromises);
        onSubmit(data, imagesAsDataUrls);
      } catch (error) {
        console.error("Error reading files:", error);
        // Handle error, perhaps set an error state or show a toast
      }
    } else {
      onSubmit(data);
    }
  };
  
  const setInputType = useCallback((type: 'text' | 'image') => {
    setSelectedInputType(type);
    setValue('inputType', type);
    if (type === 'text') {
        setValue('imageFiles', undefined);
        setImagePreviews([]);
    } else {
        setValue('textContent', '');
    }
  }, [setValue]);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center text-primary">Créez Votre Fiche de Révision</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Entrez du texte ou téléchargez une ou plusieurs images pour commencer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic" className="flex items-center text-lg">
              <BookOpen className="mr-2 h-5 w-5 text-primary" />
              Sujet de la fiche
            </Label>
            <Input 
              id="topic" 
              {...register('topic')} 
              placeholder="Ex: Histoire de la Révolution Française" 
              className="text-base"
            />
            {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-lg flex items-center">
              <Languages className="mr-2 h-5 w-5 text-primary" />
              Langue de la fiche
            </Label>
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-full text-base">
                    <SelectValue placeholder="Sélectionnez une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                    <SelectItem value="de">Allemand</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.language && <p className="text-sm text-destructive">{errors.language.message}</p>}
          </div>
          
          <div className="flex space-x-2 mb-4">
            <Button 
              type="button" 
              variant={selectedInputType === 'text' ? 'default' : 'outline'} 
              onClick={() => setInputType('text')}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" /> Texte
            </Button>
            <Button 
              type="button" 
              variant={selectedInputType === 'image' ? 'default' : 'outline'}
              onClick={() => setInputType('image')}
              className="flex-1"
            >
              <UploadCloud className="mr-2 h-4 w-4" /> Image(s)
            </Button>
          </div>
          <Input type="hidden" {...register('inputType')} value={selectedInputType} />


          {selectedInputType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="textContent" className="text-lg">Contenu Texte</Label>
              <Textarea 
                id="textContent" 
                {...register('textContent')} 
                placeholder="Collez ou écrivez votre texte ici..." 
                rows={8}
                className="text-base"
              />
              {errors.textContent && <p className="text-sm text-destructive">{errors.textContent.message}</p>}
            </div>
          )}

          {selectedInputType === 'image' && (
            <div className="space-y-2">
              <Label htmlFor="imageFiles" className="text-lg">Télécharger Image(s)</Label>
              <Input 
                id="imageFiles" 
                type="file" 
                accept="image/png, image/jpeg, image/jpg" 
                onChange={handleImageChange}
                className="text-base"
                multiple // Allow multiple files
              />
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border border-dashed border-border p-4 rounded-md">
                  {imagePreviews.map((previewUrl, index) => (
                    <div key={index} className="relative aspect-square">
                       <Image src={previewUrl} alt={`Aperçu de l'image ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md shadow-md" data-ai-hint="user uploaded content" />
                    </div>
                  ))}
                </div>
              )}
              {imagePreviews.length === 0 && watch('imageFiles') && watch('imageFiles').length > 0 && (
                 <p className="text-sm text-muted-foreground mt-2">{watch('imageFiles').length} image(s) sélectionnée(s).</p>
              )}
              {errors.imageFiles && <p className="text-sm text-destructive">{errors.imageFiles.message}</p>}
            </div>
          )}

          <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              "Générer la Fiche"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
