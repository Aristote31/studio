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
import { UploadCloud, FileText, Languages, BookOpen, Loader2 } from 'lucide-react';
import type { Language } from '@/types';
import Image from 'next/image';

const formSchema = z.object({
  topic: z.string().min(3, { message: "Le sujet doit contenir au moins 3 caractères." }),
  language: z.enum(['en', 'de', 'fr'], { errorMap: () => ({ message: "Veuillez sélectionner une langue." }) }),
  inputType: z.enum(['text', 'image']),
  textContent: z.string().optional(),
  imageFile: z.any().optional(), // Using any for FileList
}).superRefine((data, ctx) => {
  if (data.inputType === 'text' && (!data.textContent || data.textContent.trim().length < 10)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['textContent'],
      message: "Le texte doit contenir au moins 10 caractères.",
    });
  }
  if (data.inputType === 'image' && !data.imageFile) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imageFile'],
      message: "Veuillez télécharger une image.",
    });
  }
});

type ContentInputFormValues = z.infer<typeof formSchema>;

interface ContentInputProps {
  onSubmit: (data: ContentInputFormValues, imageAsDataUrl?: string) => Promise<void>;
  isLoading: boolean;
}

export function ContentInputForm({ onSubmit, isLoading }: ContentInputProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    const file = event.target.files?.[0];
    if (file) {
      setValue('imageFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setValue('imageFile', undefined);
      setImagePreview(null);
    }
  };

  const handleFormSubmit = async (data: ContentInputFormValues) => {
    if (data.inputType === 'image' && data.imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSubmit(data, reader.result as string);
      };
      reader.onerror = () => {
        // Handle error, perhaps set an error state
        console.error("Error reading file");
      };
      reader.readAsDataURL(data.imageFile as File);
    } else {
      onSubmit(data);
    }
  };
  
  const setInputType = useCallback((type: 'text' | 'image') => {
    setSelectedInputType(type);
    setValue('inputType', type);
    if (type === 'text') {
        setValue('imageFile', undefined);
        setImagePreview(null);
    } else {
        setValue('textContent', '');
    }
  }, [setValue]);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center text-primary">Créez Votre Fiche de Révision</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Entrez du texte ou téléchargez une image pour commencer.
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
              <UploadCloud className="mr-2 h-4 w-4" /> Image
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
              <Label htmlFor="imageFile" className="text-lg">Télécharger une Image</Label>
              <Input 
                id="imageFile" 
                type="file" 
                accept="image/png, image/jpeg, image/jpg" 
                onChange={handleImageChange}
                className="text-base"
              />
              {imagePreview && (
                <div className="mt-4 border border-dashed border-border p-4 rounded-md flex justify-center">
                  <Image src={imagePreview} alt="Aperçu de l'image" width={300} height={200} className="max-w-full h-auto rounded-md shadow-md" data-ai-hint="user uploaded content" />
                </div>
              )}
              {errors.imageFile && <p className="text-sm text-destructive">{errors.imageFile.message}</p>}
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
