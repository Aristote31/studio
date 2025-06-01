// @ts-nocheck
"use client"; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8">
      <div className="text-center max-w-md p-8 bg-card rounded-lg shadow-xl">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-headline text-destructive mb-4">Quelque chose s'est mal passé !</h2>
        <p className="text-muted-foreground mb-6">
          Nous sommes désolés, une erreur inattendue est survenue. Vous pouvez essayer de rafraîchir la page ou de revenir plus tard.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Détail de l'erreur: {error.message}
        </p>
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          variant="destructive"
          size="lg"
        >
          Réessayer
        </Button>
      </div>
    </div>
  );
}
