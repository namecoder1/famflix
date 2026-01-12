import {
  ContentItem,
  Movie,
  MovieDetails,
  SearchResults,
  TVShow,
  TVShowDetails,
  Credits,
  SeasonDetails,
  CollectionDetails,
  Person,
  MultiSearchResultItem,
  MovieReleaseDates,
  TVContentRatings,
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

// Certification utility functions
export function isContentFamilyFriendly(
  certification: string,
  mediaType: "movie" | "tv"
): boolean {
  if (!certification) return true; // If no certification, allow it (safer default)

  const cert = certification.toUpperCase();

  if (mediaType === "movie") {
    // Italian movie certifications (family-friendly)
    const italianFamilyCerts = ["T", "VM6", "VM12", "G"];
    // US movie certifications (family-friendly)
    const usFamilyCerts = ["G", "PG", "PG-13"];

    return italianFamilyCerts.includes(cert) || usFamilyCerts.includes(cert);
  } else {
    // TV content ratings (family-friendly)
    const familyTVRatings = ["TV-Y", "TV-Y7", "TV-G", "TV-PG"];

    return familyTVRatings.includes(cert);
  }
}

export async function getMovieCertification(id: number): Promise<string | null> {
  try {
    const data = await fetchFromTMDB<MovieReleaseDates>(`/movie/${id}/release_dates`);

    // Prioritize Italian certification
    const italianRelease = data.results.find(r => r.iso_3166_1 === "IT");
    if (italianRelease && italianRelease.release_dates.length > 0) {
      const cert = italianRelease.release_dates.find(rd => rd.certification);
      if (cert?.certification) return cert.certification;
    }

    // Fallback to US certification
    const usRelease = data.results.find(r => r.iso_3166_1 === "US");
    if (usRelease && usRelease.release_dates.length > 0) {
      const cert = usRelease.release_dates.find(rd => rd.certification);
      if (cert?.certification) return cert.certification;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching movie certification for ${id}:`, error);
    return null;
  }
}

export async function getTVCertification(id: number): Promise<string | null> {
  try {
    const data = await fetchFromTMDB<TVContentRatings>(`/tv/${id}/content_ratings`);

    // Prioritize Italian rating
    const italianRating = data.results.find(r => r.iso_3166_1 === "IT");
    if (italianRating?.rating) return italianRating.rating;

    // Fallback to US rating
    const usRating = data.results.find(r => r.iso_3166_1 === "US");
    if (usRating?.rating) return usRating.rating;

    return null;
  } catch (error) {
    console.error(`Error fetching TV certification for ${id}:`, error);
    return null;
  }
}

export async function filterContentByAge(
  items: ContentItem[],
  profileAge: number | null
): Promise<ContentItem[]> {
  // If no age or age >= 16, show all content
  if (!profileAge || profileAge >= 16) {
    return items;
  }

  // Filter for users under 16
  const filteredItems: ContentItem[] = [];

  for (const item of items) {
    try {
      let certification: string | null = null;

      if (item.media_type === "movie") {
        certification = await getMovieCertification(item.id);
      } else if (item.media_type === "tv") {
        certification = await getTVCertification(item.id);
      }

      // If we got a certification, check if it's family-friendly
      if (certification) {
        if (isContentFamilyFriendly(certification, item.media_type)) {
          filteredItems.push(item);
        }
      } else {
        // If no certification found, include it (safer default)
        filteredItems.push(item);
      }
    } catch (error) {
      // On error, include the item (safer default)
      console.error(`Error filtering item ${item.id}:`, error);
      filteredItems.push(item);
    }
  }

  return filteredItems;
}

export const getTrending = unstable_cache(
  async (timeWindow: "day" | "week" = "week", profileAge: number | null = null): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<SearchResults>(
      `/trending/all/${timeWindow}`
    );
    // Filter out people, only keep movies and tv
    const items = data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    );

    return filterContentByAge(items, profileAge);
  },
  ["trending-all"],
  { revalidate: 3600 }
);

export const getPopularMovies = unstable_cache(
  async (profileAge: number | null = null): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: Omit<Movie, "media_type">[] }>(
      "/movie/popular"
    );
    const items = data.results.map((item) => ({ ...item, media_type: "movie" as const }));

    return filterContentByAge(items, profileAge);
  },
  ["popular-movies"],
  { revalidate: 3600 }
);

export const getPopularTVShows = unstable_cache(
  async (profileAge: number | null = null): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: Omit<TVShow, "media_type">[] }>(
      "/tv/popular"
    );
    const items = data.results.map((item) => ({ ...item, media_type: "tv" as const }));

    return filterContentByAge(items, profileAge);
  },
  ["popular-tv"],
  { revalidate: 3600 }
);

export async function searchContent(query: string, profileAge: number | null = null): Promise<ContentItem[]> {
  if (!query) return [];
  const data = await fetchFromTMDB<SearchResults>("/search/multi", { query });

  const allResults: ContentItem[] = [];
  const seenIds = new Set<string>();

  const addResult = (item: ContentItem) => {
    // Determine unique ID
    const uniqueId = `${item.media_type}-${item.id}`;
    if (!seenIds.has(uniqueId)) {
      seenIds.add(uniqueId);
      allResults.push(item);
    }
  };

  for (const item of data.results) {
    if (item.media_type === "movie" || item.media_type === "tv") {
      addResult(item);
    } else if (item.media_type === "person") {
      // If it's a person, add their known_for works
      if (item.known_for) {
        item.known_for.forEach((known) => {
          if (known.media_type === "movie" || known.media_type === "tv") {
            addResult(known);
          }
        });
      }
    }
  }

  return filterContentByAge(allResults, profileAge);
}

export async function getMovieDetails(id: string): Promise<MovieDetails> {
  return fetchFromTMDB<MovieDetails>(`/movie/${id}`, {
    append_to_response: "release_dates",
  });
}

export const getTVShowDetails = unstable_cache(
  async (id: string): Promise<TVShowDetails> => {
    return fetchFromTMDB<TVShowDetails>(`/tv/${id}`, {
      append_to_response: "content_ratings",
    });
  },
  ["tv-details"],
  { revalidate: 3600 }
);

export function getImageUrl(
  path: string | null,
  size: "w500" | "original" = "w500",
  type: "content" | "user" = "content"
) {
  if (!path) return type === "content" ? "/not-found.png" : "/user-not-found.png";
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
  genreId: number,
  page: number = 1,
  profileAge: number | null = null
): Promise<ContentItem[]> {
  const data = await fetchFromTMDB<{ results: Omit<Movie, "media_type">[] }>(
    "/discover/movie",
    {
      with_genres: genreId.toString(),
      page: page.toString(),
    }
  );
  const items = data.results.map((item) => ({ ...item, media_type: "movie" as const }));

  return filterContentByAge(items, profileAge);
}

export async function getTVShowsByGenre(
  genreId: number,
  page: number = 1,
  profileAge: number | null = null
): Promise<ContentItem[]> {
  const data = await fetchFromTMDB<{ results: Omit<TVShow, "media_type">[] }>(
    "/discover/tv",
    {
      with_genres: genreId.toString(),
      page: page.toString(),
    }
  );
  const items = data.results.map((item) => ({ ...item, media_type: "tv" as const }));

  return filterContentByAge(items, profileAge);
}

export async function getMovieCredits(id: string): Promise<Credits> {
  return fetchFromTMDB<Credits>(`/movie/${id}/credits`);
}

export async function getTVShowCredits(id: string): Promise<Credits> {
  return fetchFromTMDB<Credits>(`/tv/${id}/credits`);
}

export const getSeasonDetails = unstable_cache(
  async (tvId: string, seasonNumber: number): Promise<SeasonDetails> => {
    return fetchFromTMDB<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
  },
  ["season-details"], // Note: Ideally should include IDs in cache key
  { revalidate: 3600 }
);

export const getCollectionDetails = unstable_cache(
  async (id: number): Promise<CollectionDetails> => {
    const data = await fetchFromTMDB<CollectionDetails>(`/collection/${id}`);
    // Parts inside collection don't usually have media_type, so we ensure they are treated as movies
    data.parts = data.parts.map((part) => ({
      ...part,
      media_type: "movie" as const,
    }));
    return data;
  },
  ["collection-details"],
  { revalidate: 3600 }
);

export const getSimilarMovies = unstable_cache(
  async (id: string, profileAge: number | null = null): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: Omit<Movie, "media_type">[] }>(
      `/movie/${id}/similar`
    );
    const items = data.results
      .map((item) => ({ ...item, media_type: "movie" as const }))
      .slice(0, 20);

    return filterContentByAge(items, profileAge);
  },
  ["similar-movies"],
  { revalidate: 3600 }
);

export const getRecommendedMovies = unstable_cache(
  async (id: string, profileAge: number | null = null): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: Omit<Movie, "media_type">[] }>(
      `/movie/${id}/recommendations`
    );
    const items = data.results
      .map((item) => ({ ...item, media_type: "movie" as const }))
      .slice(0, 20);

    return filterContentByAge(items, profileAge);
  },
  ["recommended-movies"],
  { revalidate: 3600 }
);

export const getSimilarTVShows = unstable_cache(
  async (id: string, profileAge: number | null = null): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: Omit<TVShow, "media_type">[] }>(
      `/tv/${id}/similar`
    );
    const items = data.results
      .map((item) => ({ ...item, media_type: "tv" as const }))
      .slice(0, 20);

    return filterContentByAge(items, profileAge);
  },
  ["similar-tv"],
  { revalidate: 3600 }
);

export const getRecommendedTVShows = unstable_cache(
  async (id: string, profileAge: number | null = null): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: Omit<TVShow, "media_type">[] }>(
      `/tv/${id}/recommendations`
    );
    const items = data.results
      .map((item) => ({ ...item, media_type: "tv" as const }))
      .slice(0, 20);

    return filterContentByAge(items, profileAge);
  },
  ["recommended-tv"],
  { revalidate: 3600 }
);
