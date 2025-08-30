'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Prompt } from '@/types/supabase'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'
import Spinner from '../Spinner'
import { Sparkles } from 'lucide-react'
import { generatePromptContent } from '@/ai/flows/generate-prompt-content'

interface EditPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  prompt?: Prompt
  packId: string
}

const promptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
})

export default function EditPromptModal({ isOpen, onClose, onSave, prompt, packId }: EditPromptModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const form = useForm<z.infer<typeof promptSchema>>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  })

  useEffect(() => {
    if (prompt) {
      form.reset({
        title: prompt.title || '',
        content: prompt.content,
      })
    } else {
      form.reset({
        title: '',
        content: '',
      })
    }
  }, [prompt, form, isOpen])

  const onSubmit = async (values: z.infer<typeof promptSchema>) => {
    if (!user) return
    setLoading(true)

    if (prompt) {
      // Update existing prompt
      const { error } = await supabase
        .from('prompts')
        .update({ title: values.title, content: values.content, updated_at: new Date().toISOString() })
        .eq('id', prompt.id)

      if (error) {
        toast({ title: 'Error Updating Prompt', description: 'Could not update the prompt. Please try again.', variant: 'destructive' })
      } else {
        toast({ title: 'Prompt Updated', description: 'Your prompt has been successfully updated.' })
        onSave()
      }
    } else {
      // Create new prompt
      const { data, error } = await supabase
        .from('prompts')
        .insert({ ...values, user_id: user.id, pack_id: packId })
        .select()
        .single();
      
      if (error) {
        toast({ title: 'Error Creating Prompt', description: 'Could not create the prompt. Please try again.', variant: 'destructive' })
      } else {
        // also create a version
        if (data) {
          await supabase.from('prompt_versions').insert({
            prompt_id: data.id,
            content: data.content,
            user_id: user.id
          });
        }
        toast({ title: 'Prompt Created', description: 'Your new prompt has been saved.' })
        onSave()
      }
    }
    setLoading(false)
  }

  const handleGenerateWithAI = async () => {
    const { title, content } = form.getValues()
    if (!title) {
      toast({
        title: 'Title is required',
        description: 'Please enter a title to generate content with AI.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generatePromptContent({ title, content })
      if (result.generatedContent) {
        form.setValue('content', result.generatedContent)
        toast({ title: 'Content Generated', description: 'AI has generated new content for your prompt.' })
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
          <DialogTitle>{prompt ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
          <DialogDescription>
            {prompt ? 'Make changes to your prompt here.' : 'Add a new prompt to your collection.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Creative story starter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>Content</FormLabel>
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
                      <Textarea placeholder="Write your prompt here..." {...field} rows={12} />
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
                  {loading ? <Spinner /> : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
