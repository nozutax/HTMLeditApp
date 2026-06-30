export type DocumentFormat = 'standard' | 'bundler-slide'

export interface BundlerShell {
  /** Original file content before template JSON (includes opening script tag) */
  prefix: string
  /** Closing script tag and everything after */
  suffix: string
}

export interface ParsedHtmlDocument {
  doctype: string
  htmlAttributes: string
  headHtml: string
  bodyHtml: string
  bodyAttributes: string
  fileName: string
  format: DocumentFormat
  bundlerShell?: BundlerShell
  /** Original template HTML with UUID asset refs (for repacking) */
  bundlerTemplateHtml?: string
  slideCount?: number
}
