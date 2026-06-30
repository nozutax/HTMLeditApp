import { useEffect, useState } from 'react'
import type { IframeEditorHandle, SelectionInfo, ElementInspectorInfo } from './IframeEditor'

interface InspectorProps {
  editorRef: React.RefObject<IframeEditorHandle | null>
  selection: SelectionInfo | null
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export function Inspector({ editorRef, selection }: InspectorProps) {
  const [info, setInfo] = useState<ElementInspectorInfo | null>(null)

  useEffect(() => {
    if (!selection || !selection.isCollapsed || selection.tagName === 'text') {
      setInfo(null)
      return
    }
    setInfo(editorRef.current?.getInspectorInfo() ?? null)
  }, [selection, editorRef])

  if (!selection) {
    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            インスペクター
          </h2>
        </div>
        <p className="p-4 text-sm text-slate-400">要素をクリックして選択してください</p>
      </aside>
    )
  }

  if (!selection.isCollapsed) {
    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            インスペクター
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-blue-600">選択テキスト</p>
          <p className="mt-1 text-sm text-slate-700">「{selection.preview}」</p>
          <p className="mt-3 text-[11px] text-slate-400">
            フローティングツールバーで書式を変更できます
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          インスペクター
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-800">{selection.label}</p>
        {selection.preview && (
          <p className="truncate text-xs text-slate-400">「{selection.preview}」</p>
        )}
      </div>

      {info && (
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field label="文字色">
            <input
              type="color"
              value={info.textColor}
              onChange={(e) => editorRef.current?.setForeColor(e.target.value)}
              className="h-8 w-full cursor-pointer rounded border border-slate-200"
            />
          </Field>

          <Field label="背景色">
            <input
              type="color"
              value={info.backgroundColor === '#ffffff' ? '#ffffff' : info.backgroundColor}
              onChange={(e) => editorRef.current?.setElementBackgroundColor(e.target.value)}
              className="h-8 w-full cursor-pointer rounded border border-slate-200"
            />
          </Field>

          <Field label="余白 (padding)">
            <input
              type="text"
              defaultValue={info.padding}
              placeholder="例: 16px"
              onBlur={(e) => editorRef.current?.setElementStyle('padding', e.target.value)}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            />
          </Field>

          <Field label="外余白 (margin)">
            <input
              type="text"
              defaultValue={info.margin}
              placeholder="例: 16px 0"
              onBlur={(e) => editorRef.current?.setElementStyle('margin', e.target.value)}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            />
          </Field>

          {info.tagName === 'a' && (
            <Field label="リンクURL">
              <input
                type="url"
                defaultValue={info.href}
                onBlur={(e) => editorRef.current?.setElementAttribute('href', e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              />
            </Field>
          )}

          {info.tagName === 'img' && (
            <Field label="代替テキスト (alt)">
              <input
                type="text"
                defaultValue={info.alt}
                onBlur={(e) => editorRef.current?.setElementAttribute('alt', e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              />
            </Field>
          )}
        </div>
      )}
    </aside>
  )
}
