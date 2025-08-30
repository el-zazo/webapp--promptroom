'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCopy, Trash2, FilePenLine, Star, Loader2, GitFork, CalendarClock } from 'lucide-react'
import type { Prompt } from '@/types/supabase'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'
import EditPromptModal from './EditPromptModal'
import { ratePromptClarity } from '@/ai/flows/rate-prompt-clarity'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface PromptCardProps {
  prompt: Prompt
  onUpdate: () => void
}

export default function PromptCard({ prompt, onUpdate }: PromptCardProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content)
    toast({ title: 'Copied', description: 'The prompt content has been copied to your clipboard.' })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await supabase.from('prompts').delete().eq('id', prompt.id)
    if (error) {
      toast({ title: 'Error Deleting Prompt', description: 'Could not delete the prompt. Please try again.', variant: 'destructive' })
    } else {
      toast({ title: 'Prompt Deleted', description: 'The prompt has been successfully deleted.' })
      onUpdate()
    }
    setIsDeleting(false)
  }

  const handleRate = async () => {
    setIsRating(true)
    try {
      const result = await ratePromptClarity({ content: prompt.content })
      if (result.rating) {
        const { error } = await supabase
          .from('prompts')
          .update({ rating: result.rating })
          .eq('id', prompt.id)
        
        if (error) throw new Error(error.message)
        toast({ title: 'Rating Updated', description: `The prompt has been rated ${result.rating}/10.` })
        onUpdate()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      toast({ title: 'Failed to rate prompt', description: errorMessage, variant: 'destructive' })
    }
    setIsRating(false)
  }

  const handleSave = () => {
    setIsEditing(false)
    onUpdate()
  }

  return (
    <>
      <Card className="flex flex-col h-full shadow-lg border-0 bg-secondary/20 hover:bg-secondary/40 transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="truncate font-semibold tracking-tight">
            <Link href={`/packs/${prompt.pack_id}/prompts/${prompt.id}`} className="hover:underline">
              {prompt.title}
            </Link>
          </CardTitle>
          <CardDescription className="flex items-center gap-4 pt-1 text-xs">
            <span className="flex items-center gap-1">
              <Star className={`h-4 w-4 ${prompt.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              <span>{prompt.rating ? `${prompt.rating}/10` : 'Not rated'}</span>
            </span>
             <span className="flex items-center gap-1">
                <GitFork className="h-4 w-4 text-muted-foreground" />
                <span>{prompt.number_versions ?? 0} {prompt.number_versions === 1 ? 'version' : 'versions'}</span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground line-clamp-3">{prompt.content}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4">
           <span className="flex items-center gap-1">
             <CalendarClock className="h-4 w-4" />
             <span>
                {formatDistanceToNow(new Date(prompt.updated_at || prompt.created_at), { addSuffix: true })}
             </span>
           </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleRate} disabled={isRating} aria-label="Rate prompt">
              {isRating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy prompt">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit prompt">
              <FilePenLine className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete prompt">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your prompt.
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
          </div>
        </CardFooter>
      </Card>
      {isEditing && (
        <EditPromptModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          prompt={prompt}
          onSave={handleSave}
          packId={prompt.pack_id}
        />
      )}
    </>
  )
}
