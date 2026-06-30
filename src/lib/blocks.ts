export interface BlockDefinition {
  id: string
  label: string
  icon: string
  category: 'text' | 'layout' | 'media' | 'table'
  html: string
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    id: 'heading1',
    label: '見出し1',
    icon: 'H1',
    category: 'text',
    html: '<h1>見出しテキスト</h1>',
  },
  {
    id: 'heading2',
    label: '見出し2',
    icon: 'H2',
    category: 'text',
    html: '<h2>見出しテキスト</h2>',
  },
  {
    id: 'heading3',
    label: '見出し3',
    icon: 'H3',
    category: 'text',
    html: '<h3>見出しテキスト</h3>',
  },
  {
    id: 'paragraph',
    label: '段落',
    icon: '¶',
    category: 'text',
    html: '<p>ここにテキストを入力してください。</p>',
  },
  {
    id: 'button',
    label: 'ボタン',
    icon: '▢',
    category: 'text',
    html: '<p><a href="#" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">ボタン</a></p>',
  },
  {
    id: 'ul',
    label: '箇条書き',
    icon: '•',
    category: 'text',
    html: '<ul><li>リスト項目1</li><li>リスト項目2</li></ul>',
  },
  {
    id: 'ol',
    label: '番号付き',
    icon: '1.',
    category: 'text',
    html: '<ol><li>リスト項目1</li><li>リスト項目2</li></ol>',
  },
  {
    id: 'blockquote',
    label: '引用',
    icon: '❝',
    category: 'text',
    html: '<blockquote style="border-left:4px solid #2563eb;padding-left:16px;margin:16px 0;color:#475569;">引用テキスト</blockquote>',
  },
  {
    id: 'hr',
    label: '区切り線',
    icon: '—',
    category: 'layout',
    html: '<hr style="border:none;border-top:2px solid #e2e8f0;margin:24px 0;" />',
  },
  {
    id: 'two-column',
    label: '2カラム',
    icon: '▥',
    category: 'layout',
    html: `<div style="display:flex;gap:16px;margin:16px 0;flex-wrap:wrap;">
  <div style="flex:1;min-width:200px;padding:16px;background:#f8fafc;border-radius:8px;">
    <p>左カラム</p>
  </div>
  <div style="flex:1;min-width:200px;padding:16px;background:#f8fafc;border-radius:8px;">
    <p>右カラム</p>
  </div>
</div>`,
  },
  {
    id: 'image-placeholder',
    label: '画像',
    icon: '🖼',
    category: 'media',
    html: '<p><img src="https://placehold.co/600x300/e2e8f0/64748b?text=Image" alt="画像" style="max-width:100%;height:auto;border-radius:8px;" /></p>',
  },
  {
    id: 'table',
    label: '表',
    icon: '⊞',
    category: 'table',
    html: `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr>
      <th style="border:1px solid #e2e8f0;padding:8px 12px;background:#f1f5f9;">見出し1</th>
      <th style="border:1px solid #e2e8f0;padding:8px 12px;background:#f1f5f9;">見出し2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #e2e8f0;padding:8px 12px;">セル1</td>
      <td style="border:1px solid #e2e8f0;padding:8px 12px;">セル2</td>
    </tr>
  </tbody>
</table>`,
  },
]

export const BLOCK_CATEGORIES: { id: BlockDefinition['category']; label: string }[] = [
  { id: 'text', label: 'テキスト' },
  { id: 'layout', label: 'レイアウト' },
  { id: 'media', label: 'メディア' },
  { id: 'table', label: '表' },
]
