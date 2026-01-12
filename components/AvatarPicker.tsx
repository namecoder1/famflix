'use client';

import { useState, useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as collection from '@dicebear/collection';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';

// Definisci gli stili disponibili
const AVATAR_STYLES = [
  { id: 'adventurer', name: 'Adventurer', style: collection.adventurer as any },
  { id: 'adventurerNeutral', name: 'Adventurer Neutral', style: collection.adventurerNeutral as any },
  { id: 'avataaars', name: 'Avataaars', style: collection.avataaars as any },
  { id: 'avataaarsNeutral', name: 'Avataaars Neutral', style: collection.avataaarsNeutral as any },
  { id: 'bigEars', name: 'Big Ears', style: collection.bigEars as any },
  { id: 'bigEarsNeutral', name: 'Big Ears Neutral', style: collection.bigEarsNeutral as any },
  { id: 'bigSmile', name: 'Big Smile', style: collection.bigSmile as any },
  { id: 'bottts', name: 'Bottts', style: collection.bottts as any },
  { id: 'botttsNeutral', name: 'Bottts Neutral', style: collection.botttsNeutral as any },
  { id: 'croodles', name: 'Croodles', style: collection.croodles as any },
  { id: 'croodlesNeutral', name: 'Croodles Neutral', style: collection.croodlesNeutral as any },
  { id: 'dylan', name: 'Dylan', style: collection.dylan as any },
  { id: 'funEmoji', name: 'Fun Emoji', style: collection.funEmoji as any },
  { id: 'glass', name: 'Glass', style: collection.glass as any },
  { id: 'icons', name: 'Icons', style: collection.icons as any },
  { id: 'identicon', name: 'Identicon', style: collection.identicon as any },
  { id: 'initials', name: 'Initials', style: collection.initials as any },
  { id: 'lorelei', name: 'Lorelei', style: collection.lorelei as any },
  { id: 'loreleiNeutral', name: 'Lorelei Neutral', style: collection.loreleiNeutral as any },
  { id: 'micah', name: 'Micah', style: collection.micah as any },
  { id: 'miniavs', name: 'Miniavs', style: collection.miniavs as any },
  { id: 'notionists', name: 'Notionists', style: collection.notionists as any },
  { id: 'notionistsNeutral', name: 'Notionists Neutral', style: collection.notionistsNeutral as any },
  { id: 'openPeeps', name: 'Open Peeps', style: collection.openPeeps as any },
  { id: 'personas', name: 'Personas', style: collection.personas as any },
  { id: 'pixelArt', name: 'Pixel Art', style: collection.pixelArt as any },
  { id: 'pixelArtNeutral', name: 'Pixel Art Neutral', style: collection.pixelArtNeutral as any },
  { id: 'rings', name: 'Rings', style: collection.rings as any },
  { id: 'shapes', name: 'Shapes', style: collection.shapes as any },
  { id: 'thumbs', name: 'Thumbs', style: collection.thumbs as any },
];


// Semi predefiniti per ogni stile
const PREDEFINED_SEEDS = [
  'Felix', 'Aneka', 'Jasmine', 'Oliver', 'Luna', 'Max', 'Bella', 'Charlie',
  'Lucy', 'Cooper', 'Daisy', 'Milo', 'Sadie', 'Buddy', 'Molly', 'Rocky',
  'Maggie', 'Bear', 'Sophie', 'Jack', 'Chloe', 'Duke', 'Lola', 'Toby',
];

interface AvatarPickerProps {
  currentAvatar?: string;
  onAvatarSelect: (avatarUrl: string) => void;
}

export default function AvatarPicker({ currentAvatar, onAvatarSelect }: AvatarPickerProps) {
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(11); // Dylan come default
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);

  const currentStyle = AVATAR_STYLES[selectedStyleIndex];

  // Genera tutti gli avatar per lo stile corrente
  const avatars = useMemo(() => {
    return PREDEFINED_SEEDS.map(seed => ({
      seed,
      url: createAvatar(currentStyle.style, { seed }).toDataUri(),
    }));
  }, [currentStyle]);

  const handleStyleChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedStyleIndex((prev) => (prev === 0 ? AVATAR_STYLES.length - 1 : prev - 1));
    } else {
      setSelectedStyleIndex((prev) => (prev === AVATAR_STYLES.length - 1 ? 0 : prev + 1));
    }
    setSelectedSeed(null);
  };

  const handleAvatarClick = (avatarUrl: string, seed: string) => {
    setSelectedSeed(seed);
    onAvatarSelect(avatarUrl);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className='flex items-center justify-between'>
          <Label className="text-zinc-400 font-medium">Scegli Avatar</Label>
          <div className="space-y-3 max-w-50 w-full ml-auto">
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleStyleChange('prev')}
                className="h-7 w-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              <div className="flex-1 text-center">
                <div className="text-white text-xs font-semibold">{currentStyle.name}</div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleStyleChange('next')}
                className="h-7 w-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
          {avatars.map(({ seed, url }) => (
            <button
              key={seed}
              type="button"
              onClick={() => handleAvatarClick(url, seed)}
              className={`
                relative bg-white aspect-square rounded-lg overflow-hidden border-2 transition-all
                hover:scale-105 hover:border-red-500
                ${selectedSeed === seed ? 'border-red-600 ring-2 ring-red-600/50' : 'border-zinc-700'}
              `}
              title={seed}
            >
              <Image
                src={url}
                alt={seed}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
