'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import type { Pack } from '@/types/supabase'
import PackCard from '@/components/packs/PackCard'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Spinner from '@/components/Spinner'
import EditPackModal from '@/components/packs/EditPackModal'

export default function PacksPage() {
  const { user } = useAuth()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchPacks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching packs:', error)
    } else {
      setPacks(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPacks()
  }, [fetchPacks])

  const handlePackSaved = () => {
    fetchPacks()
    setIsModalOpen(false)
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Packs</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Pack
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      ) : packs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} onUpdate={fetchPacks} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
          <h2 className="text-xl font-semibold tracking-tight">No packs yet</h2>
          <p className="text-muted-foreground mt-2">Click "New Pack" to get started.</p>
        </div>
      )}

      <EditPackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handlePackSaved}
      />
    </div>
  )
}
