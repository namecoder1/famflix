import { ContentItem } from "@/lib/types";
import MovieCard from "./MovieCard";

interface CategorySectionProps {
  title: string;
  items: ContentItem[];
  showStatusToggle?: boolean;
  onStatusChange?: () => void;
}

export default function CategorySection({ title, items, showStatusToggle = false, onStatusChange }: CategorySectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>

      {/* Scroll container with padding to align with container but bleed to edges on mobile if needed */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-4 px-4 py-4 snap-x scrollbar-hide">
          {items.map((item) => (
            <div key={item.id} className="w-[160px] md:w-[200px] flex-none snap-start">
              <MovieCard item={item} showStatusToggle={showStatusToggle} onStatusChange={onStatusChange} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
