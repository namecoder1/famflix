import CategorySection from '@/components/CategorySection';
import { cookies } from 'next/headers';
import { getWatchList } from '@/lib/actions';
import { Heart } from 'lucide-react';
import React from 'react';

const FavoritesPage = async () => {
    // Get active profile
    const cookieStore = await cookies();
    const profileId = cookieStore.get('profile_id')?.value;
    let favorites: any[] = [];

    if (profileId) {
        const allWatched = await getWatchList(profileId);
        favorites = allWatched
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
    }

    if (!profileId) {
        return (
            <div className='min-h-screen bg-black pt-24 pb-10 flex items-center justify-center'>
                <div className="text-center">
                    <h1 className='text-4xl font-bold text-white mb-4'>Preferiti</h1>
                    <p className='text-zinc-400'>Seleziona un profilo per vedere i tuoi preferiti.</p>
                </div>
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

export default FavoritesPage
