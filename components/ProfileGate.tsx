'use client';

import { useEffect, useState } from 'react';
import { useProfile } from './ProfileProvider';
import { createClient } from '@/supabase/client';
import { Plus, User, Trash2, Pencil, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

type Profile = {
    id: string;
    name: string;
    avatar_url: string | null;
};

export default function ProfileGate({ children }: { children: React.ReactNode }) {
    const { currentProfile, switchProfile } = useProfile();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

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

    const handleCreateProfile = async () => {
        if (!newProfileName.trim()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Should allow login

            const { data, error } = await supabase.from('profiles').insert({
                name: newProfileName,
                user_id: user.id
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
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">Chi sta guardando?</h1>
                
                <div className="flex flex-wrap items-center justify-center gap-8">
                    {profiles.map(profile => (
                        <button
                            key={profile.id}
                            onClick={() => switchProfile(profile)}
                            className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
                        >
                            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden ring-2 ring-transparent group-hover:ring-white transition-all">
                                {profile.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={profile.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                        <User className="w-16 h-16 text-zinc-400" />
                                    </div>
                                )}
                            </div>
                            <span className="text-zinc-400 group-hover:text-white text-lg md:text-xl transition-colors">
                                {profile.name}
                            </span>
                        </button>
                    ))}

                    {/* Add Profile Button */}
                    <button
                        onClick={() => setIsCreating(true)}
                        className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
                    >
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-md bg-zinc-900 border-2 border-transparent group-hover:bg-zinc-800 flex items-center justify-center">
                            <Plus className="w-16 h-16 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                        </div>
                        <span className="text-zinc-500 group-hover:text-zinc-300 text-lg md:text-xl transition-colors">
                            Aggiungi Profilo
                        </span>
                    </button>
                </div>

                {isCreating && (
                    <div className="fixed inset-0 z-100 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full border border-zinc-800">
                            <h2 className="text-2xl font-bold text-white mb-6">Nuovo Profilo</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Nome</label>
                                    <input
                                        type="text"
                                        value={newProfileName}
                                        onChange={(e) => setNewProfileName(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-red-600"
                                        placeholder="Nome profilo"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        onClick={handleCreateProfile}
                                        disabled={!newProfileName.trim()}
                                        className="px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Crea
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
