import { Plus } from 'lucide-react'
import { STORIES } from './feedUtils'

const StoriesRow = () => (
  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
    {STORIES.map((story) => (
      <div
        key={story.name}
        className="relative shrink-0 w-28 h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
      >
        <div className={`absolute inset-0 bg-gradient-to-b ${story.color}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

        <div className="absolute top-3 left-3">
          {story.isCreate ? (
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-[3px] border-[#1877f2] flex items-center justify-center text-white text-xs font-bold">
              {story.fallback}
            </div>
          )}
        </div>

        <p className="absolute bottom-3 left-0 right-0 text-center text-white text-[11px] font-semibold px-2 leading-tight drop-shadow">
          {story.name}
        </p>
      </div>
    ))}
  </div>
)

export default StoriesRow
