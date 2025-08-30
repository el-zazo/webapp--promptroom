'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'
import Spinner from '../Spinner'
import type { Prompt } from '@/types/supabase'
import { Sparkles } from 'lucide-react'
import { generatePromptContent } from '@/ai/flows/generate-prompt-content'
import { useAuth } from '@/hooks/useAuth'

interface AddPromptVersionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  prompt: Prompt
}

const versionSchema = z.object({
  content: z.string().min(1, 'Content is required'),
})

export default function AddPromptVersionModal({ isOpen, onClose, onSave, prompt }: AddPromptVersionModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const form = useForm<z.infer<typeof versionSchema>>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      content: '',
    },
  })
  
  useEffect(() => {
    if(isOpen) {
      form.reset({ content: '' });
    }
  }, [isOpen, form]);


  const onSubmit = async (values: z.infer<typeof versionSchema>) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to create a version.', variant: 'destructive' })
      return
    }
    setLoading(true)

    const { error: insertError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: prompt.id,
        user_id: user.id,
        content: values.content,
      })
    
    setLoading(false)
    if (insertError) {
      toast({ title: 'Error Creating Version', description: 'Could not save the new version. Please try again.', variant: 'destructive' })
    } else {
      toast({ title: 'Version Created', description: 'The new version has been saved successfully.' })
      onSave()
    }
  }

  const handleGenerateWithAI = async () => {
    const currentContent = form.getValues('content')
    setIsGenerating(true)
    try {
      const result = await generatePromptContent({ 
        title: prompt.title || 'Untitled', 
        content: currentContent || prompt.content
      })
      if (result.generatedContent) {
        form.setValue('content', result.generatedContent)
        toast({ title: 'Content Generated', description: 'AI has generated new content for your prompt version.' })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      toast({ title: 'Failed to generate content', description: errorMessage, variant: 'destructive' })
    }
    setIsGenerating(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Version</DialogTitle>
          <DialogDescription>
            Create a new version of your prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>New Version Content</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateWithAI}
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Spinner className="h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Generate with AI
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Write the new version of the prompt here..." {...field} rows={12} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner /> : 'Save Version'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
