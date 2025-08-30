'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCopy, Trash2, Star, Loader2 } from 'lucide-react'
import type { PromptVersion } from '@/types/supabase'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'
import { ratePromptVersionClarity } from '@/ai/flows/rate-prompt-version-clarity'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { formatDistanceToNow } from 'date-fns'

interface PromptVersionCardProps {
  version: PromptVersion
  onUpdate: () => void
}

export default function PromptVersionCard({ version, onUpdate }: PromptVersionCardProps) {
  const { toast } = useToast()
  const [isRating, setIsRating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(version.content)
    toast({ title: 'Copied', description: 'The version content has been copied to your clipboard.' })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error: deleteError } = await supabase.from('prompt_versions').delete().eq('id', version.id)
    setIsDeleting(false)

    if (deleteError) {
      toast({ title: 'Error Deleting Version', description: 'Could not delete the version. Please try again.', variant: 'destructive' })
    } else {
      toast({ title: 'Version Deleted', description: 'The version has been successfully deleted.' })
      onUpdate()
    }
  }

  const handleRate = async () => {
    setIsRating(true)
    try {
      const result = await ratePromptVersionClarity({ content: version.content })
      if (result.rating) {
        const { error } = await supabase
          .from('prompt_versions')
          .update({ rating: result.rating })
          .eq('id', version.id)
        
        if (error) throw new Error(error.message)
        toast({ title: 'Rating Updated', description: `The version has been rated ${result.rating}/10.` })
        onUpdate()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      toast({ title: 'Failed to rate version', description: errorMessage, variant: 'destructive' })
    }
    setIsRating(false)
  }
  
  const formattedDate = formatDistanceToNow(new Date(version.created_at), { addSuffix: true })

  return (
    <Card className="flex flex-col h-full shadow-lg border-0 bg-secondary/20 hover:bg-secondary/40 transition-all duration-300 hover:-translate-y-1">
      <CardHeader>
        <CardDescription className="flex items-center justify-between">
            <span className="flex items-center gap-1">
                <Star className={`h-4 w-4 ${version.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                <span>{version.rating ? `${version.rating}/10` : 'Not rated'}</span>
            </span>
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-4">{version.content}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={handleRate} disabled={isRating} aria-label="Rate version">
          {isRating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy version">
          <ClipboardCopy className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete version">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this version.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
