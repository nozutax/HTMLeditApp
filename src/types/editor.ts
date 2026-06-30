export type DeviceMode = 'desktop' | 'tablet' | 'mobile' | 'slide'

export const DEVICE_WIDTHS: Record<DeviceMode, number | null> = {
  desktop: null,
  tablet: 768,
  mobile: 375,
  slide: 1200,
}

export interface OverlayRect {
  top: number
  left: number
  width: number
  height: number
}
