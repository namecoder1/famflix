'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import CategorySection from './CategorySection';
import { ContentItem } from '@/lib/types';

interface LazyCategoryRowProps {
    title: string;
    fetchData: () => Promise<ContentItem[]>;
    delayIndex?: number;
}

export default function LazyCategoryRow({ title, genreId, type, delayIndex = 0 }: { title: string, genreId: number, type: 'movie' | 'tv', delayIndex?: number }) {
    const [items, setItems] = useState<ContentItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use a ref to track if we've already triggered the load to avoid double-firing
    const loadTriggeredRef = useRef(false);

    const loadData = useCallback(async () => {
        if (loadTriggeredRef.current) return;
        loadTriggeredRef.current = true;

        try {
            let data: ContentItem[] = [];
            if (type === 'movie') {
                const { fetchMoviesByGenreAction } = await import('@/app/actions/tmdb');
                data = await fetchMoviesByGenreAction(genreId);
            } else {
                const { fetchTVShowsByGenreAction } = await import('@/app/actions/tmdb');
                data = await fetchTVShowsByGenreAction(genreId);
            }

            setItems(data);
            setIsLoaded(true);
        } catch (error) {
            console.error(`Failed to load category: ${title}`, error);
        }
    }, [genreId, title, type]);

    useEffect(() => {
        if (loadTriggeredRef.current) return;

        let timeoutId: NodeJS.Timeout;

        // 1. Intersection Observer
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadData();
                    observer.disconnect();
                    if (timeoutId) clearTimeout(timeoutId);
                }
            },
            { rootMargin: '200px' } // Load when 200px away
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        // 2. Timer fallback ("piano piano...")
        // Stagger loading: initial delay of 2s + 1s per row index
        const delay = 2000 + (delayIndex * 1500);
        timeoutId = setTimeout(() => {
            loadData();
            observer.disconnect();
        }, delay);

        return () => {
            observer.disconnect();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [loadData, delayIndex]);

    if (!isLoaded) {
        return (
            <div ref={containerRef} className="py-8">
                <div className="container mx-auto px-4 mb-4">
                    {/* Title Skeleton */}
                    <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded mb-2"></div>
                </div>

                {/* Vertical Scroll / Snapshot emulation */}
                <div className="relative">
                    <div className="flex overflow-x-hidden gap-4 px-4 py-4 md:px-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="w-[160px] md:w-[200px] flex-none aspect-[2/3] bg-zinc-900 animate-pulse rounded-lg"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Don't render empty sections if load returned nothing
    if (items.length === 0) return null;

    return (
        <CategorySection
            title={title}
            items={items}
        />
    );
}
