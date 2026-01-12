"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

interface GenreFilterProps {
  genres: { id: number; name: string }[];
}

export default function GenreFilter({ genres }: GenreFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get("genre");

  const handleGenreChange = (value: string) => {
    if (value === "all") {
      router.push("?");
    } else {
      router.push(`?genre=${value}`);
    }
  };

  return (
    <div className="w-[200px]">
      <Select
        value={currentGenre || "all"}
        onValueChange={handleGenreChange}
      >
        <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white">
          <SelectValue placeholder="Filtra per genere" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
          <SelectItem value="all" className="focus:bg-zinc-800 focus:text-white">
            Tutti i generi
          </SelectItem>
          {genres.map((genre) => (
            <SelectItem
              key={genre.id}
              value={genre.id.toString()}
              className="focus:bg-zinc-800 focus:text-white"
            >
              {genre.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
