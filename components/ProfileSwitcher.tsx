'use client';

import { useState, useEffect } from 'react';
import { createProfile, getProfiles, updateProfile, deleteProfile } from '@/lib/actions';
import { useProfile } from './ProfileProvider';
import Cookies from 'js-cookie';
import { User, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export default function ProfileSwitcher() {
  const { currentProfile, switchProfile } = useProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // States for different views
  const [view, setView] = useState<'select' | 'create' | 'manage' | 'edit'>('select');
  const [newProfileName, setNewProfileName] = useState('');
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadProfiles();
  }, []);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setView('select');
      setIsCreating(false); // Legacy cleanup
      // We can just reset to select
      setEditingProfile(null);
      setNewProfileName('');
      setEditName('');
    }
  }, [isOpen]);

  async function loadProfiles() {
    const res = await getProfiles();
    setProfiles(res);

    // Sync context with cookie if needed (only on initial load really)
    const cookieId = Cookies.get('profile_id');
    if (cookieId && !currentProfile) {
      const found = res.find(p => p.id === cookieId);
      if (found) {
        switchProfile(found);
      }
    }
  }

  async function handleCreateProfile() {
    if (!newProfileName.trim()) return;

    const res = await createProfile(newProfileName);
    if (res.success && res.data) {
      setProfiles([...profiles, res.data]);
      setNewProfileName('');
      switchProfile(res.data);
      setIsOpen(false);
    }
  }

  async function handleUpdateProfile() {
    if (!editingProfile || !editName.trim()) return;

    const res = await updateProfile(editingProfile.id, editName, editingProfile.avatar_url);
    if (res.success) {
      const updatedProfiles = profiles.map(p =>
        p.id === editingProfile.id ? { ...p, name: editName } : p
      );
      setProfiles(updatedProfiles);

      // If we updated current profile, update context
      if (currentProfile?.id === editingProfile.id) {
        switchProfile({ ...currentProfile, name: editName });
      }

      setEditingProfile(null);
      setView('manage');
    }
  }

  async function handleDeleteProfile() {
    if (!editingProfile) return;

    if (confirm('Sei sicuro di voler eliminare questo profilo?')) {
      const res = await deleteProfile(editingProfile.id);
      if (res.success) {
        const newProfiles = profiles.filter(p => p.id !== editingProfile.id);
        setProfiles(newProfiles);

        // If we deleted current, switch to first available or logout
        if (currentProfile?.id === editingProfile.id) {
          if (newProfiles.length > 0) {
            switchProfile(newProfiles[0] as any);
          } else {
            // clear cookie?
            Cookies.remove('profile_id');
            location.reload();
          }
        }

        setEditingProfile(null);
        setView('manage');
      }
    }
  }

  // Helper to start editing
  const startEditing = (profile: Profile) => {
    setEditingProfile(profile);
    setEditName(profile.name);
    setView('edit');
  };

  // Legacy state adapter
  const setIsCreating = (val: boolean) => {
    if (val) setView('create');
    else setView('select');
  };
  const isCreating = view === 'create';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white p-2 rounded-full transition-colors"
      >
        <div className="w-8 h-8 rounded bg-neutral-200 flex items-center justify-center text-sm font-bold">
          {currentProfile ? <Image
            src={currentProfile.avatar_url || '/avatar.png'}
            alt={currentProfile.name}
            width={24}
            height={24}
            className="w-8 h-8 rounded"
          /> : <User size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 p-4">
          {view === 'select' && (
            <>
              <h3 className="text-zinc-400 text-xs font-bold uppercase mb-3">Chi sta guardando?</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {profiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      switchProfile(profile as any);
                      router.refresh();
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors ${currentProfile?.id === profile.id ? 'bg-zinc-800' : ''}`}
                  >
                    <div className="w-8 h-8 rounded bg-neutral-200 flex items-center justify-center text-xs font-bold text-white">
                      <Image
                        src={profile.avatar_url || '/avatar.png'}
                        alt={profile.name}
                        width={24}
                        height={24}
                        className="w-8 h-8 rounded"
                      />
                    </div>
                    <span className="text-white text-sm font-medium truncate">{profile.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col gap-2">
                <button
                  onClick={() => setView('create')}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  <Plus size={16} /> Aggiungi Profilo
                </button>
                {profiles.length > 0 && (
                  <button
                    onClick={() => setView('manage')}
                    className="text-center text-zinc-500 hover:text-white text-xs mt-2"
                  >
                    Gestisci i profili
                  </button>
                )}
              </div>
            </>
          )}

          {view === 'create' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white text-sm font-bold">Nuovo Profilo</h3>
                <button onClick={() => setView('select')}><X size={16} className="text-zinc-400 hover:text-white" /></button>
              </div>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Nome"
                className="w-full bg-zinc-800 text-white text-sm p-2 rounded border border-zinc-700 focus:border-red-600 outline-none"
                autoFocus
              />
              <button
                onClick={handleCreateProfile}
                className="w-full bg-red-600 text-white text-sm font-bold py-2 rounded hover:bg-red-700 transition-colors"
              >
                Salva
              </button>
            </div>
          )}

          {view === 'manage' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-zinc-400 text-xs font-bold uppercase">Gestisci Profili</h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className="w-full flex items-center justify-between p-2 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-neutral-200 flex items-center justify-center text-xs font-bold text-white relative">
                        <Image
                          src={profile.avatar_url || '/avatar.png'}
                          alt={profile.name}
                          width={24}
                          height={24}
                          className="w-8 h-8 rounded"
                        />
                      </div>
                      <span className="text-zinc-300 text-sm font-medium truncate">{profile.name}</span>
                    </div>
                    <button
                      onClick={() => startEditing(profile)}
                      className="text-zinc-400 hover:text-white p-1"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
                <button
                  onClick={() => setView('select')}
                  className="bg-white text-black text-sm font-bold py-1 px-4 rounded hover:bg-gray-200"
                >
                  Fatto
                </button>
              </div>
            </>
          )}

          {view === 'edit' && editingProfile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white text-sm font-bold">Modifica Profilo</h3>
                <button onClick={() => setView('manage')}><X size={16} className="text-zinc-400 hover:text-white" /></button>
              </div>
              <div className="flex justify-center my-4">
                <div className="w-16 h-16 rounded bg-neutral-200 flex items-center justify-center text-2xl font-bold text-white">
                  <Image
                    src={editingProfile.avatar_url || '/avatar.png'}
                    alt={editingProfile.name}
                    width={24}
                    height={24}
                    className="w-16 h-16 rounded"
                  />
                </div>
              </div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome"
                className="w-full bg-zinc-800 text-white text-sm p-2 rounded border border-zinc-700 focus:border-red-600 outline-none"
                autoFocus
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 bg-white text-black text-sm font-bold py-2 rounded hover:bg-gray-200 transition-colors"
                >
                  Salva
                </button>
                <button
                  onClick={handleDeleteProfile}
                  className="flex-shrink-0 bg-transparent border border-zinc-600 text-zinc-400 hover:border-red-600 hover:text-red-600 p-2 rounded transition-colors"
                  title="Elimina Profilo"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}
