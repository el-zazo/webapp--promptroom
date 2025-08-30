'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Spinner from '@/components/Spinner'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [profileUsername, setProfileUsername] = useState<string | null>(null)
  const [newUsername, setNewUsername] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116: row not found
        throw error
      }

      const username = data?.username || user.user_metadata.username || ''
      setProfileUsername(username)
      setNewUsername(username)
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Error fetching profile',
        description: error.message,
        variant: 'destructive',
      })
      // Fallback to auth metadata if public.users fetch fails
      const username = user.user_metadata.username || ''
      setProfileUsername(username)
      setNewUsername(username)
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  const handleUpdateUsername = async () => {
    if (!user || !newUsername.trim()) {
      toast({ title: 'Username cannot be empty', variant: 'destructive' })
      return
    }
    if (newUsername === profileUsername) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      // First, try to update the public.users table
      const { error: publicUserError } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('id', user.id)
      
      if (publicUserError) throw publicUserError
      
      // Then, update the auth.users metadata for consistency
      const { error: authUserError } = await supabase.auth.updateUser({
        data: { username: newUsername },
      })

      if (authUserError) throw authUserError

      setProfileUsername(newUsername)
      setIsEditing(false)
      toast({ title: 'Username updated successfully!' })
    } catch (error: any) {
      console.error('Error updating username:', error)
       if (error.message?.includes('users_username_key')) {
         toast({
           title: 'Username is already taken',
           description: 'Please choose a different username.',
           variant: 'destructive',
         });
       } else {
         toast({
           title: 'Error updating username',
           description: error.message,
           variant: 'destructive',
         });
       }
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold">Not logged in</h1>
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Your Profile</h1>
        <Card className="w-full max-w-lg mx-auto shadow-lg border-0 bg-secondary/20">
            <CardHeader>
                <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Username</span>
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(!isEditing)}>
                        <Pencil className="h-4 w-4" />
                     </Button>
                  </div>
                   {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="text-lg"
                      />
                      <Button onClick={handleUpdateUsername} disabled={isSaving} size="icon" className="h-10 w-10">
                        {isSaving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-lg">{profileUsername || 'Not set'}</span>
                  )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Email</span>
                    <span className="text-lg">{user.email}</span>
                </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Joined</span>
                    <span className="text-lg">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
