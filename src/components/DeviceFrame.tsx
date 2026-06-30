import type { DeviceMode } from '../types/editor'
import { DEVICE_WIDTHS } from '../types/editor'

interface DeviceFrameProps {
  deviceMode: DeviceMode
  children: React.ReactNode
}

export function DeviceFrame({ deviceMode, children }: DeviceFrameProps) {
  // スライドは内部で 1200px を zoom 縮小して全体表示するため、枠は全幅にする
  const maxWidth = deviceMode === 'slide' ? null : DEVICE_WIDTHS[deviceMode]
  const showBadge = deviceMode === 'tablet' || deviceMode === 'mobile'

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-slate-200/60 p-4">
      <div
        className="relative h-full min-h-[400px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg transition-all duration-300"
        style={{
          width: maxWidth ? `${maxWidth}px` : '100%',
          maxWidth: '100%',
        }}
      >
        {showBadge && (
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center border-b border-slate-200 bg-slate-50 py-1">
            <span className="text-[10px] font-medium text-slate-400">
              {deviceMode === 'tablet' ? '768px' : '375px'}
            </span>
          </div>
        )}
        <div className={`h-full ${showBadge ? 'pt-6' : ''}`}>{children}</div>
      </div>
    </div>
  )
}
