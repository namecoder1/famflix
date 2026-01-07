'use client';
import { useProfile } from '@/components/ProfileProvider';
import { getWatchList } from '@/lib/actions';
import { ContentItem } from '@/lib/types';
import { Heart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import CategorySection from '@/components/CategorySection';

const FavoritesPage = () => {
    const { currentProfile } = useProfile();
    const [favorites, setFavorites] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchFavorites() {
            if (!currentProfile) {
                setFavorites([]);
                setIsLoading(false);
                return;
            }

            try {
                // Client-side fetch using Supabase directly to avoid 431 on Server Actions
                const { createClient } = await import('@/supabase/client');
                const supabase = createClient();

                const { data, error } = await supabase
                    .from('user_media')
                    .select('*')
                    .eq('profile_id', currentProfile.id);

                if (error) throw error;

                const allWatched = (data || []).map(item => ({
                    ...item,
                    isFavorite: item.is_favorite,
                    posterPath: item.poster_path,
                    releaseDate: item.release_date,
                    mediaType: item.media_type,
                    tmdbId: item.tmdb_id,
                    totalDuration: item.total_duration,
                    lastSeason: item.last_season,
                    lastEpisode: item.last_episode,
                    vote: item.vote,
                }));

                const favs = allWatched
                    .filter(item => item.isFavorite)
                    .map(item => ({
                        ...item,
                        id: item.tmdbId,
                        poster_path: item.posterPath,
                        media_type: item.mediaType,
                        vote_average: item.rating || 0,
                        release_date: item.releaseDate,
                        first_air_date: item.releaseDate,
                        name: item.mediaType === 'tv' ? item.title : undefined,
                    }));
                setFavorites(favs);
            } catch (error) {
                console.error("Failed to fetch favorites", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchFavorites();
    }, [currentProfile]);

    if (!currentProfile) {
        return (
            <div className='min-h-screen bg-black pt-24 pb-10 flex items-center justify-center'>
                <div className="text-center">
                    <h1 className='text-4xl font-bold text-white mb-4'>Preferiti</h1>
                    <p className='text-zinc-400'>Seleziona un profilo per vedere i tuoi preferiti.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
         return (
             <div className='min-h-screen bg-black pt-24 pb-10 flex items-center justify-center'>
                 <div className="text-white">Caricamento...</div>
             </div>
         );
    }

    return (
        <div className='min-h-screen bg-black pt-24 pb-10'>
            <div className='container mx-auto px-4 mb-8'>
                <div className="flex items-center gap-3 mb-2">
                    <Heart className="w-8 h-8 text-red-600 fill-red-600" />
                    <h1 className='text-4xl font-bold text-white'>I tuoi Preferiti</h1>
                </div>
                <p className='text-zinc-400'>Tutti i film e le serie TV che ami.</p>
            </div>

            <div className='container mx-auto px-4'>
                {favorites.length > 0 ? (
                    <CategorySection
                        title=""
                        items={favorites}
                    />
                ) : (
                    <p className="text-zinc-500 text-lg">Non hai ancora aggiunto nulla ai preferiti.</p>
                )}
            </div>
        </div>
    )
}

export default FavoritesPage;
