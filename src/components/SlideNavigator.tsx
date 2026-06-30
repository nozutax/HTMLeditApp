import type { IframeEditorHandle } from './IframeEditor'

interface SlideNavigatorProps {
  editorRef: React.RefObject<IframeEditorHandle | null>
  slideCount: number
  activeSlide: number
  onSlideChange: (index: number) => void
}

export function SlideNavigator({
  editorRef,
  slideCount,
  activeSlide,
  onSlideChange,
}: SlideNavigatorProps) {
  if (slideCount <= 0) return null

  const goTo = (index: number) => {
    editorRef.current?.goToSlide(index)
    onSlideChange(index)
  }

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-600">
          スライド {activeSlide + 1} / {slideCount}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={activeSlide === 0}
            onClick={() => goTo(activeSlide - 1)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
          >
            ← 前
          </button>
          <button
            type="button"
            disabled={activeSlide >= slideCount - 1}
            onClick={() => goTo(activeSlide + 1)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
          >
            次 →
          </button>
        </div>
      </div>
      <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
        {Array.from({ length: slideCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              i === activeSlide
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
