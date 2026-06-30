import { BLOCK_CATEGORIES, BLOCK_DEFINITIONS } from '../lib/blocks'
import type { IframeEditorHandle } from './IframeEditor'

interface PartsPanelProps {
  editorRef: React.RefObject<IframeEditorHandle | null>
}

export function PartsPanel({ editorRef }: PartsPanelProps) {
  const handleInsert = (html: string) => {
    editorRef.current?.insertHtml(html)
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          パーツ
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">クリックで挿入</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {BLOCK_CATEGORIES.map((category) => {
          const blocks = BLOCK_DEFINITIONS.filter((b) => b.category === category.id)
          if (blocks.length === 0) return null

          return (
            <div key={category.id} className="mb-4">
              <h3 className="mb-2 text-[11px] font-semibold text-slate-400">
                {category.label}
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {blocks.map((block) => (
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
