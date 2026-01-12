'use client';

import { useEffect, useRef, useState } from 'react';
import { incrementProgress, updateEpisodeProgress, checkUrlAvailability } from '@/lib/actions';
import { useProfile } from './ProfileProvider';
import EpisodeSelector from './EpisodeSelector';

interface Episode {
  episode_number: number;
  name: string;
  still_path: string | null;
  overview: string;
  runtime: number;
}

interface Season {
  season_number: number;
  name: string;
  episodes: Episode[];
}

interface VideoPlayerProps {
  tmdbId: number;
  season?: number;
  episode?: number;
  mediaType: 'movie' | 'tv';
  startTime: number;
  title: string;
  posterPath: string;
  totalDuration?: number;
  genres?: string; // JSON string
  nextEpisodeUrl?: string | null;
  seasons?: Season[];
}

export default function VideoPlayer({
  tmdbId,
  season,
  episode,
  mediaType,
  startTime,
  title,
  posterPath,
  totalDuration,
  genres,
  nextEpisodeUrl,
  seasons = [],
}: VideoPlayerProps) {
  const { currentProfile } = useProfile();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial URL construction - this state will ensure the iframe src is stable
  // even if the parent re-renders with a new startTime.
  // Initial URL construction - this state will ensure the iframe src is stable
  // even if the parent re-renders with a new startTime.
  const [iframeSrc, setIframeSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySource = async () => {
      setIsLoading(true);
      const primaryBase =
        mediaType === 'movie'
          ? `https://vixsrc.to/movie/${tmdbId}`
          : `https://vixsrc.to/tv/${tmdbId}/${season}/${episode}`;
      const primaryUrl = `${primaryBase}?startAt=${startTime}`;

      // Check primary source availability (without query params typically, but here we check base or full?)
      // Usually checking the base URL is safer/simpler for 404 detection.
      const isAvailable = await checkUrlAvailability(primaryBase);

      if (isAvailable) {
        setIframeSrc(primaryUrl);
      } else {
        console.log('Primary source failed (404), switching to fallback');
        const fallbackUrl =
          mediaType === 'movie'
            ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
            : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
        setIframeSrc(fallbackUrl);
      }
      setIsLoading(false);
    };

    verifySource();
  }, [tmdbId, season, episode, mediaType, startTime]);

  // Track local progress because we need to send absolute value to episode_progress
  const [currentProgress, setCurrentProgress] = useState(startTime);
  const [duration, setDuration] = useState(totalDuration || 0);
  const [showNextButton, setShowNextButton] = useState(false);

  // Ref to keep currentProgress fresh in interval without resetting it
  const progressRef = useRef(startTime);
  const durationRef = useRef(totalDuration || 0);
  const isPlayingRef = useRef(false);

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    progressRef.current = currentProgress;
  }, [currentProgress]);

  useEffect(() => {
    if (!currentProfile) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      const msg = event.data;

      let parsedMsg = msg;
      if (typeof msg === 'string') {
        try {
          parsedMsg = JSON.parse(msg);
        } catch (e) {
          // It might just be a simple string event like 'play', so we ignore JSON parse errors
        }
      }

      // Handle simple string events (if any)
      if (
        parsedMsg === 'play' ||
        parsedMsg.event === 'play' ||
        parsedMsg.type === 'play'
      ) {
        isPlayingRef.current = true;
      }
      if (
        parsedMsg === 'pause' ||
        parsedMsg.event === 'pause' ||
        parsedMsg.type === 'pause'
      ) {
        isPlayingRef.current = false;
      }

      // Handle nested PLAYER_EVENT structure from logs
      // Structure: { type: "PLAYER_EVENT", data: { event: "play" | "pause" | "timeupdate", ... } }
      if (
        typeof parsedMsg === 'object' &&
        parsedMsg.type === 'PLAYER_EVENT' &&
        parsedMsg.data
      ) {
        const eventType = parsedMsg.data.event;

        if (eventType === 'play') {
          isPlayingRef.current = true;
          console.log('Video playing (PLAYER_EVENT)');
        } else if (eventType === 'pause') {
          isPlayingRef.current = false;
          console.log('Video paused (PLAYER_EVENT)');
        } else if (
          eventType === 'timeupdate' &&
          typeof parsedMsg.data.currentTime === 'number'
        ) {
          // Sync our local progress with the actual player time
          progressRef.current = Math.floor(parsedMsg.data.currentTime);
          setCurrentProgress(progressRef.current);

          // Capture duration if available
          if (
            parsedMsg.data.duration &&
            typeof parsedMsg.data.duration === 'number'
          ) {
            durationRef.current = Math.floor(parsedMsg.data.duration);
            setDuration(durationRef.current);
          }

          // Check for 93% completion to show button
          if (durationRef.current > 0) {
            const percentage =
              (progressRef.current / durationRef.current) * 100;
            if (percentage >= 93) {
              setShowNextButton(true);
            } else {
              setShowNextButton(false);
            }
          }

          // Implicitly playing if we get time updates
          isPlayingRef.current = true;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Clear existing interval if props change
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      // Only SAVE to DB if visible AND playing
      // We rely on 'timeupdate' to update progressRef.current accurately.
      // The interval is now just a throttled saver.
      if (document.visibilityState === 'visible' && isPlayingRef.current) {
        // We use the current progress (synced from timeupdate)
        const progressToSave = progressRef.current;

        // Don't save 0 or very start unnecessarily unless we want to mark "started"
        if (progressToSave > 0) {
          if (mediaType === 'tv' && season && episode) {
            updateEpisodeProgress(
              currentProfile.id,
              tmdbId,
              season,
              episode,
              progressToSave,
              durationRef.current,
              {
                mediaType,
                title,
                posterPath,
                totalDuration: durationRef.current,
                genres: genres, // Pass genres
              }
            );
          } else {
            const { updateMovieProgress } = await import('@/lib/actions');
            updateMovieProgress(
              currentProfile.id,
              tmdbId,
              progressToSave,
              durationRef.current,
              {
                title,
                posterPath,
                totalDuration: durationRef.current,
                genres: genres, // Pass genres
              }
            );
          }
          console.log('(+1min) Saved progress to DB:', progressToSave);
        }
      }
    }, 60000); // Each minute

    return () => {
      window.removeEventListener('message', handleMessage);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    currentProfile,
    tmdbId,
    season,
    episode,
    mediaType,
    title,
    posterPath,
    totalDuration,
    genres,
  ]);

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {posterPath && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${posterPath})` }}
              />
              <img
                src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                alt={title}
                className="relative z-10 w-48 rounded-lg shadow-2xl animate-pulse"
              />
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        </div>
      ) : iframeSrc.includes('vidsrc.cc') ? (
        <iframe
          src={iframeSrc}
          className="w-full h-full border-none"
          title={title}
          allowFullScreen
          referrerPolicy="origin"
          sandbox="allow-forms allow-scripts allow-same-origin"
        />
      ) : (
        <iframe
          src={iframeSrc}
          className="w-full h-full border-none"
          title={title}
          allowFullScreen
          allow="autoplay; encrypted-media"
          referrerPolicy="origin"
        />
      )}

      {/* Episode Selector - only for TV shows */}
      {mediaType === 'tv' && season && episode && (
        <EpisodeSelector
          tmdbId={tmdbId}
          currentSeason={season}
          currentEpisode={episode}
          seasons={seasons}
          isVisible={isHovering}
        />
      )}

      {/* Next Episode Button - only show at 93%+ OR on hover if there's a next episode */}
      {showNextButton && nextEpisodeUrl && mediaType === 'tv' && (
        <a
          href={nextEpisodeUrl}
          className="absolute bottom-24 right-8 z-60 bg-white text-black px-6 py-3 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          <span>Prossimo Episodio</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
