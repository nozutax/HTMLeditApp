interface DropZoneProps {
  onFileSelect: (file: File) => void
  error: string | null
}

export function DropZone({ onFileSelect, error }: DropZoneProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    e.target.value = ''
  }

  return (
    <div
      className="relative flex flex-1 items-center justify-center p-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <label className="flex w-full max-w-lg cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-white p-12 transition-colors hover:border-blue-400 hover:bg-blue-50/50">
        <div className="text-5xl text-slate-400">📄</div>
        <div className="text-center">
          <p className="text-lg font-medium text-slate-800">HTMLファイルをアップロード</p>
          <p className="mt-1 text-sm text-slate-500">ドラッグ＆ドロップ、またはクリックして選択</p>
        </div>
        <input
          type="file"
          accept=".html,.htm"
          className="hidden"
          onChange={handleChange}
        />
      </label>
      {error && (
        <p className="absolute bottom-8 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
