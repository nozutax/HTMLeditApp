import {
  BLOCK_CATEGORIES,
  BLOCK_DEFINITIONS,
  SLIDE_BLOCK_DEFINITIONS,
  type BlockDefinition,
} from '../lib/blocks'
import type { DocumentFormat } from '../types/htmlDocument'
import type { IframeEditorHandle } from './IframeEditor'

interface PartsPanelProps {
  editorRef: React.RefObject<IframeEditorHandle | null>
  format: DocumentFormat
  onClose: () => void
}

export function PartsPanel({ editorRef, format, onClose }: PartsPanelProps) {
  const handleInsert = (html: string) => {
    editorRef.current?.insertHtml(html)
  }

  const blocks: BlockDefinition[] =
    format === 'bundler-slide'
      ? [...SLIDE_BLOCK_DEFINITIONS, ...BLOCK_DEFINITIONS]
      : BLOCK_DEFINITIONS

  const categories = BLOCK_CATEGORIES.filter((cat) =>
    blocks.some((b) => b.category === cat.id),
  )

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            パーツ
          </h2>
          <button
            type="button"
            title="パーツを閉じる"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {format === 'bundler-slide' ? 'スライド用パーツを挿入' : 'クリックで挿入'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {categories.map((category) => {
          const categoryBlocks = blocks.filter((b) => b.category === category.id)
          if (categoryBlocks.length === 0) return null

          return (
            <div key={category.id} className="mb-4">
              <h3 className="mb-2 text-[11px] font-semibold text-slate-400">
                {category.label}
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {categoryBlocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    title={block.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsert(block.html)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 text-center transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="text-base leading-none">{block.icon}</span>
                    <span className="text-[10px] font-medium leading-tight text-slate-600">
                      {block.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
