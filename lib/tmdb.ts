import {
  ContentItem,
  Movie,
  MovieDetails,
  SearchResults,
  TVShow,
  TVShowDetails,
  Credits,
  SeasonDetails,
} from "./types";

import { unstable_cache } from "next/cache";

const TMDB_API_KEY = process.env.API_TOKEN_TMDB!;
const BASE_URL = "https://api.themoviedb.org/3";

async function fetchFromTMDB<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: "it-IT",
    ...params,
  });

  const res = await fetch(`${BASE_URL}${endpoint}?${query}`);

  if (!res.ok) {
    throw new Error(`TMDB API Error: ${res.statusText}`);
  }

  return res.json();
}

export const getTrending = unstable_cache(
  async (timeWindow: "day" | "week" = "week"): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<SearchResults>(
      `/trending/all/${timeWindow}`
    );
    // Filter out people, only keep movies and tv
    return data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    );
  },
  ["trending-all"],
  { revalidate: 3600 }
);

export const getPopularMovies = unstable_cache(
  async (): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: Omit<Movie, "media_type">[] }>(
      "/movie/popular"
    );
    return data.results.map((item) => ({ ...item, media_type: "movie" }));
  },
  ["popular-movies"],
  { revalidate: 3600 }
);

export const getPopularTVShows = unstable_cache(
  async (): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: Omit<TVShow, "media_type">[] }>(
      "/tv/popular"
    );
    return data.results.map((item) => ({ ...item, media_type: "tv" }));
  },
  ["popular-tv"],
  { revalidate: 3600 }
);

export async function searchContent(query: string): Promise<ContentItem[]> {
  if (!query) return [];
  const data = await fetchFromTMDB<SearchResults>("/search/multi", { query });
  return data.results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  );
}

export async function getMovieDetails(id: string): Promise<MovieDetails> {
  return fetchFromTMDB<MovieDetails>(`/movie/${id}`);
}

export const getTVShowDetails = unstable_cache(
  async (id: string): Promise<TVShowDetails> => {
    return fetchFromTMDB<TVShowDetails>(`/tv/${id}`);
  },
  ["tv-details"],
  { revalidate: 3600 }
);

export function getImageUrl(
  path: string | null,
  size: "w500" | "original" = "w500"
) {
  if (!path) return "/placeholder.png"; // Make sure to handle this in UI or have a placeholder asset
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function getMovieGenres(): Promise<
  { id: number; name: string }[]
> {
  const data = await fetchFromTMDB<{ genres: { id: number; name: string }[] }>(
    "/genre/movie/list"
  );
  return data.genres;
}

export async function getTVGenres(): Promise<{ id: number; name: string }[]> {
  const data = await fetchFromTMDB<{ genres: { id: number; name: string }[] }>(
    "/genre/tv/list"
  );
  return data.genres;
}

export async function getMoviesByGenre(
  genreId: number
): Promise<ContentItem[]> {
  const data = await fetchFromTMDB<{ results: Omit<Movie, "media_type">[] }>(
    "/discover/movie",
    {
      with_genres: genreId.toString(),
    }
  );
  return data.results.map((item) => ({ ...item, media_type: "movie" }));
}

export async function getTVShowsByGenre(
  genreId: number
): Promise<ContentItem[]> {
  const data = await fetchFromTMDB<{ results: Omit<TVShow, "media_type">[] }>(
    "/discover/tv",
    {
      with_genres: genreId.toString(),
    }
  );
  return data.results.map((item) => ({ ...item, media_type: "tv" }));
}

export async function getMovieCredits(id: string): Promise<Credits> {
  return fetchFromTMDB<Credits>(`/movie/${id}/credits`);
}

export const getSeasonDetails = unstable_cache(
  async (tvId: string, seasonNumber: number): Promise<SeasonDetails> => {
    return fetchFromTMDB<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
  },
  ["season-details"], // Note: Ideally should include IDs in cache key
  { revalidate: 3600 }
);
