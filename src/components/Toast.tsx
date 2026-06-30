interface ToastProps {
  message: string
  type?: 'info' | 'error'
  onClose: () => void
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${
        type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
      }`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100"
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  )
}
