'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { Prompt, PromptVersion, Pack } from '@/types/supabase'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/Spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Star, ArrowLeft } from 'lucide-react'
import PromptVersionCard from '@/components/prompts/PromptVersionCard'
import AddPromptVersionModal from '@/components/prompts/AddPromptVersionModal'
import { format } from 'date-fns'

export default function PromptDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const packId = params.packId as string
  const promptId = params.id as string

  const [pack, setPack] = useState<Pack | null>(null)
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user || !promptId || !packId) return
    setLoading(true)

    const packPromise = supabase
      .from('packs')
      .select('title')
      .eq('id', packId)
      .eq('user_id', user.id)
      .single()

    const promptPromise = supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', user.id)
      .single()

    const versionsPromise = supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })

    const [packResult, promptResult, versionsResult] = await Promise.all([
      packPromise,
      promptPromise,
      versionsPromise,
    ])
    
    if (packResult.error) {
      console.error('Error fetching pack:', packResult.error)
      router.push('/packs')
      return
    }
    setPack(packResult.data)

    if (promptResult.error) {
      console.error('Error fetching prompt:', promptResult.error)
      router.push(`/packs/${packId}/prompts`); // Redirect if prompt not found or no permission
    } else {
      setPrompt(promptResult.data)
    }

    if (versionsResult.error) {
      console.error('Error fetching versions:', versionsResult.error)
    } else {
      setVersions(versionsResult.data)
    }

    setLoading(false)
  }, [user, promptId, packId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (!prompt || !pack) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold">Content not found</h1>
        <p className="text-muted-foreground">The requested content could not be found or you don't have permission to view it.</p>
         <Button variant="outline" onClick={() => router.push('/packs')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packs
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => router.push(`/packs/${packId}/prompts`)} className="mb-4 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to "{pack.title}"
        </Button>
        <Card className="mb-8 shadow-lg border-0 bg-secondary/20">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold tracking-tight">{prompt.title}</CardTitle>
                <div className="flex items-center gap-6 pt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Star className={`h-5 w-5 ${prompt.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{prompt.rating ? `${prompt.rating}/10` : 'Not rated'}</span>
                    </div>
                    <div className="text-xs">
                        <p>Created: {format(new Date(prompt.created_at), "PPP p")}</p>
                        <p>Updated: {format(new Date(prompt.updated_at), "PPP p")}</p>
                    </div>
                </div>
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Version
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg whitespace-pre-wrap leading-relaxed">{prompt.content}</p>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold tracking-tight mb-6">Versions</h2>

        {versions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {versions.map((version) => (
              <PromptVersionCard key={version.id} version={version} onUpdate={fetchData} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
            <h2 className="text-xl font-semibold tracking-tight">No versions for this prompt</h2>
            <p className="text-muted-foreground mt-2">Click "Add Version" to create one.</p>
          </div>
        )}
      </div>
      {prompt && (
        <AddPromptVersionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            fetchData()
            setIsModalOpen(false)
          }}
          prompt={prompt}
        />
      )}
    </>
  )
}
