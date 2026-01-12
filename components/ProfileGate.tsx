'use client';

import { useEffect, useState } from 'react';
import { useProfile } from './ProfileProvider';
import { createClient } from '@/supabase/client';
import { Plus, User, Pencil, RefreshCw } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { dylan, lorelei } from '@dicebear/collection';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

type Profile = {
  id: string;
  name: string;
  short: string;
  avatar_url: string | null;
};

export default function ProfileGate({ children }: { children: React.ReactNode }) {
  const { currentProfile, switchProfile } = useProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('');
  const [isManaging, setIsManaging] = useState(false);

  // Edit State
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState<string>('');

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const generateAvatar = (seed: string) => {
    return createAvatar(dylan, { seed }).toDataUri();
  };

  useEffect(() => {
    let mounted = true;

    async function initProfiles() {
      try {
        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        if (mounted) setIsAuthenticated(true);

        // 2. Fetch Profiles
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        const fetchedProfiles = data || [];

        if (mounted) {
          setProfiles(fetchedProfiles);
        }

        // 3. Auto-select if localStorage has ID
        const savedId = localStorage.getItem('profile_id');
        if (savedId) {
          const found = fetchedProfiles.find(p => p.id === savedId);
          if (found) {
            // Ensure cookie matches (sync repair)
            document.cookie = `profile_id=${found.id}; path=/; max-age=31536000; SameSite=Lax`;
            switchProfile(found);
          }
        }
      } catch (err) {
        console.error("Error initializing profiles:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initProfiles();

    return () => { mounted = false; };
  }, []);

  const initCreateProfile = () => {
    const seed = Math.random().toString(36).substring(7);
    setNewProfileAvatar(generateAvatar(seed));
    setNewProfileName('');
    setIsCreating(true);
  };

  const randomizeCreateAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setNewProfileAvatar(generateAvatar(seed));
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Should allow login

      const { data, error } = await supabase.from('profiles').insert({
        name: newProfileName,
        user_id: user.id,
        avatar_url: newProfileAvatar
      }).select().single();

      if (error) throw error;
      if (data) {
        setProfiles([...profiles, data]);
        switchProfile(data);
        setIsCreating(false);
        setNewProfileName('');
      }
    } catch (e) {
      console.error("Error creating profile:", e);
    }
  };

  const initEdit = (profile: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProfile(profile);
    setEditName(profile.name);
    setPreviewAvatar(profile.avatar_url || '');
  };

  const randomizeEditAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setPreviewAvatar(generateAvatar(seed));
  };

  const saveEdit = async () => {
    if (!editingProfile || !editName.trim()) return;

    try {
      const { data, error } = await supabase.from('profiles')
        .update({
          name: editName,
          avatar_url: previewAvatar
        })
        .eq('id', editingProfile.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProfiles(profiles.map(p => p.id === data.id ? data : p));
        setEditingProfile(null);
      }
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  // If we are loading, show a black screen or spinner (optional)
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600"></div>
      </div>
    );
  }

  // Pass through if not authenticated (Login page will be shown)
  // Or if we are explicitly on the login page (just in case)
  if (!isAuthenticated || pathname === '/login') {
    return <>{children}</>;
  }

  // If we have a profile selected, render children
  if (currentProfile) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-4xl px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-12">Chi sta guardando?</h1>

        <div className="flex flex-wrap items-center justify-center gap-8 px-6">
          {profiles.map(profile => (
            <div key={profile.id} className="relative group">
              <button
                onClick={(e) => {
                  if (isManaging) {
                    initEdit(profile, e);
                  } else {
                    switchProfile(profile);
                  }
                }}
                className="flex flex-col items-center gap-4 transition-transform hover:scale-105"
              >
                <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-4xl overflow-hidden ring-4 ring-transparent group-hover:ring-neutral-300 transition-all">
                  {profile.avatar_url ? (
                    <div>
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                      <span className="text-[10px] z-100 font-bold absolute bottom-0 right-0 bg-white h-8 w-8 rounded-tl-2xl text-black flex items-center justify-center">{profile.short}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-16 h-16 text-zinc-400" />
                    </div>
                  )}

                  {/* Overlay for Managing Mode */}
                  {isManaging && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-in fade-in">
                      <Pencil className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-zinc-400 group-hover:text-white text-lg md:text-xl transition-colors">
                  {profile.name}
                </span>
              </button>
            </div>
          ))}

          {/* Add Profile Button (Disable or Hide when managing?) 
              Let's keep it visible but maybe disabled if strictly requested "disattiva il select".
              User said "disattiva il select del profilo". Maybe "Aggiungi" is okay.
              Let's keep "Aggiungi" interactive or hide it to focus on managing.
              Typically "Manage Profiles" allows adding too, but let's hide it to keep UI clean if desired.
              Actually, usually you can add while managing. I'll leave it but maybe disable?
              Let's make it standard: It works always. 
              But wait, the user said "disattiva il select del profilo".
          */}
          {!isManaging && (
            <button
              onClick={initCreateProfile}
              className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
            >
              <div className="w-24 h-24 md:w-40 md:h-40 rounded-4xl bg-zinc-900 border-2 border-transparent group-hover:bg-zinc-800 flex items-center justify-center">
                <Plus className="w-16 h-16 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </div>
              <span className="text-zinc-500 group-hover:text-zinc-300 text-lg md:text-xl transition-colors">
                Aggiungi
              </span>
            </button>
          )}
        </div>

        {/* Manage Profiles Button */}
        <div className="mt-12">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white border border-zinc-500 hover:border-white px-8 py-2 uppercase tracking-widest"
            onClick={() => setIsManaging(!isManaging)}
          >
            {isManaging ? 'Fine' : 'Modifica profili'}
          </Button>
        </div>

        {isCreating && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogContent className="sm:max-w-xl bg-zinc-950 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white mb-4">
                  Nuovo Profilo
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                {/* Avatar Section */}
                <div className="relative group">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 shadow-xl">
                    {newProfileAvatar ? (
                      <Image src={newProfileAvatar} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <User className="w-12 h-12 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={randomizeCreateAvatar}
                    className="absolute bottom-0 right-0 p-2.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-full text-white transition-colors shadow-lg"
                    title="Cambia avatar"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {/* Form Section */}
                <div className="flex-1 w-full space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor='name' className="text-zinc-400 font-medium">Nome</Label>
                    <Input
                      id='name'
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Nome del profilo"
                      autoFocus
                      className="bg-zinc-900 border-zinc-800 focus:border-red-600 focus:ring-red-600/20 h-11 text-lg"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant='ghost'
                      onClick={() => setIsCreating(false)}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-900"
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={handleCreateProfile}
                      disabled={!newProfileName.trim()}
                      className='bg-red-600 hover:bg-red-700 text-white min-w-[100px]'
                    >
                      Crea
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Dialog */}
        {/* Edit Dialog */}
        <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
          <DialogContent className="sm:max-w-xl bg-zinc-950 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white mb-4">Modifica Profilo</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 shadow-xl">
                  {previewAvatar ? (
                    <Image src={previewAvatar} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-12 h-12 text-zinc-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={randomizeEditAvatar}
                  className="absolute bottom-0 right-0 p-2.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-full text-white transition-colors shadow-lg"
                  title="Cambia avatar"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* Form Section */}
              <div className="flex-1 w-full space-y-6">
                <div className="space-y-2">
                  <Label htmlFor='edit-name' className="text-zinc-400 font-medium">Nome</Label>
                  <Input
                    id='edit-name'
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome del profilo"
                    className="bg-zinc-900 border-zinc-800 focus:border-red-600 focus:ring-red-600/20 h-11 text-lg"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant='ghost'
                    onClick={() => setEditingProfile(null)}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-900"
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={saveEdit}
                    disabled={!editName.trim()}
                    className='bg-red-600 hover:bg-red-700 text-white min-w-[100px]'
                  >
                    Salva
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
