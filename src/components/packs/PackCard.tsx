'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, FilePenLine, CalendarClock, Package, FileText } from 'lucide-react'
import type { Pack } from '@/types/supabase'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import EditPackModal from './EditPackModal'
import Spinner from '../Spinner'

interface PackCardProps {
  pack: Pack
  onUpdate: () => void
}

export default function PackCard({ pack, onUpdate }: PackCardProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await supabase.from('packs').delete().eq('id', pack.id)
    if (error) {
      toast({ title: 'Error Deleting Pack', description: 'Could not delete the pack. Please try again.', variant: 'destructive' })
    } else {
      toast({ title: 'Pack Deleted', description: 'The pack has been successfully deleted.' })
      onUpdate()
    }
    setIsDeleting(false)
  }

  const handleSave = () => {
    setIsEditing(false)
    onUpdate()
  }

  return (
    <>
      <Card className="flex flex-col h-full shadow-lg border-0 bg-secondary/20 hover:bg-secondary/40 transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
           <Link href={`/packs/${pack.id}/prompts`} className="hover:underline">
            <CardTitle className="truncate font-semibold tracking-tight flex items-center gap-2">
                <Package className="h-5 w-5 text-primary"/>
                {pack.title}
            </CardTitle>
          </Link>
           <CardDescription className="flex items-center gap-4 pt-1 text-xs">
             <span className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{pack.number_prompts ?? 0} {pack.number_prompts === 1 ? 'prompt' : 'prompts'}</span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground line-clamp-3">{pack.description || "No description."}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4">
           <span className="flex items-center gap-1">
             <CalendarClock className="h-4 w-4" />
             <span>
                {formatDistanceToNow(new Date(pack.updated_at || pack.created_at), { addSuffix: true })}
             </span>
           </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit pack">
              <FilePenLine className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete pack">
                   {isDeleting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this pack and all its prompts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Spinner /> : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>
      </Card>
      {isEditing && (
        <EditPackModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          pack={pack}
          onSave={handleSave}
        />
      )}
    </>
  )
}
