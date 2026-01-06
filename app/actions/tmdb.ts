'use server';

import { getMoviesByGenre, getTVShowsByGenre } from "@/lib/tmdb";
import { ContentItem } from "@/lib/types";

export async function fetchMoviesByGenreAction(genreId: number): Promise<ContentItem[]> {
    try {
        const movies = await getMoviesByGenre(genreId);
        return movies;
    } catch (error) {
        console.error("Failed to fetch movies by genre:", error);
        return [];
    }
}

export async function fetchTVShowsByGenreAction(genreId: number): Promise<ContentItem[]> {
    try {
        const shows = await getTVShowsByGenre(genreId);
        return shows;
    } catch (error) {
        console.error("Failed to fetch TV shows by genre:", error);
        return [];
    }
}
