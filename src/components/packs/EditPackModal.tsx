'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Pack } from '@/types/supabase'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'
import Spinner from '../Spinner'

interface EditPackModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  pack?: Pack
}

const packSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

export default function EditPackModal({ isOpen, onClose, onSave, pack }: EditPackModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof packSchema>>({
    resolver: zodResolver(packSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  useEffect(() => {
    if (pack) {
      form.reset({
        title: pack.title,
        description: pack.description || '',
      })
    } else {
      form.reset({
        title: '',
        description: '',
      })
    }
  }, [pack, form, isOpen])

  const onSubmit = async (values: z.infer<typeof packSchema>) => {
    if (!user) return
    setLoading(true)

    const packData = {
        ...values,
        user_id: user.id,
    }

    if (pack) {
      // Update existing pack
      const { error } = await supabase
        .from('packs')
        .update({ ...packData, updated_at: new Date().toISOString() })
        .eq('id', pack.id)

      setLoading(false)
      if (error) {
        toast({ title: 'Error Updating Pack', description: 'Could not update the pack. Please try again.', variant: 'destructive' })
      } else {
        toast({ title: 'Pack Updated', description: 'Your pack has been successfully updated.' })
        onSave()
      }
    } else {
      // Create new pack
      const { error } = await supabase
        .from('packs')
        .insert(packData)
      
      setLoading(false)
      if (error) {
        toast({ title: 'Error Creating Pack', description: 'Could not create the pack. Please try again.', variant: 'destructive' })
      } else {
        toast({ title: 'Pack Created', description: 'Your new pack has been saved.' })
        onSave()
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pack ? 'Edit Pack' : 'Create New Pack'}</DialogTitle>
          <DialogDescription>
            {pack ? 'Make changes to your pack here.' : 'Add a new pack to your collection.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Marketing Copy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What is this pack for?" {...field} rows={3} />
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
