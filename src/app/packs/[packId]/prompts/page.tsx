'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import type { Prompt, Pack } from '@/types/supabase'
import PromptCard from '@/components/prompts/PromptCard'
import { Button } from '@/components/ui/button'
import { PlusCircle, ArrowLeft } from 'lucide-react'
import EditPromptModal from '@/components/prompts/EditPromptModal'
import Spinner from '@/components/Spinner'

export default function PromptsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const packId = params.packId as string

  const [pack, setPack] = useState<Pack | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchPrompts = useCallback(async () => {
    if (!user || !packId) return
    setLoading(true)

    // Fetch pack details
    const { data: packData, error: packError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single()

    if (packError) {
      console.error('Error fetching pack:', packError)
      router.push('/packs')
      return
    }
    setPack(packData)

    // Fetch prompts for the pack
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id)
      .eq('pack_id', packId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching prompts:', error)
    } else {
      setPrompts(data)
    }
    setLoading(false)
  }, [user, packId, router])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const handlePromptCreated = () => {
    fetchPrompts()
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold">Pack not found</h1>
        <p className="text-muted-foreground">The requested pack could not be found or you don't have permission to view it.</p>
        <Button variant="outline" onClick={() => router.push('/packs')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packs
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
       <Button variant="ghost" onClick={() => router.push('/packs')} className="mb-4 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packs
        </Button>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Prompts for {pack.title}</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

       {prompts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} onUpdate={fetchPrompts} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
          <h2 className="text-xl font-semibold tracking-tight">No prompts in this pack yet</h2>
          <p className="text-muted-foreground mt-2">Click "New Prompt" to get started.</p>
        </div>
      )}

      <EditPromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handlePromptCreated}
        packId={packId}
      />
    </div>
  )
}
