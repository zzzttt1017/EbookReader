# @somecat/ebook-reader

轻量 EBookReader：基于 `foliate-js` 的 `foliate-view`，提供 React 18+ / Vue 3 组件（不依赖 Ant Design / UnoCSS），并内置基础 UI（目录、搜索、翻页、字号、明暗主题、阅读进度）。

## 安装

```bash
pnpm add @somecat/ebook-reader
```

同时在你的应用入口引入样式：

```ts
import '@somecat/ebook-reader/style.css'
```

## React 18+

```tsx
import { useMemo, useState } from 'react'
import { EBookReader } from '@somecat/ebook-reader/react'
import '@somecat/ebook-reader/style.css'

export default function Demo() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <div style={{ height: '100vh' }}>
      <input
        type="file"
        accept=".epub"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div style={{ height: 'calc(100vh - 40px)' }}>
        <EBookReader file={file} />
      </div>
    </div>
  )
}
```

## Vue 3

```ts
import '@somecat/ebook-reader/style.css'
```

```ts
import { defineComponent, ref } from 'vue'
import { EBookReaderVue } from '@somecat/ebook-reader/vue'

export default defineComponent({
  setup() {
    const file = ref<File | null>(null)
    return () => (
      <div style="height:100vh">
        <input
          type="file"
          accept=".epub"
          onChange={(e: any) => (file.value = e?.target?.files?.[0] ?? null)}
        />
        <div style="height:calc(100vh - 40px)">
          <EBookReaderVue file={file.value} />
        </div>
      </div>
    )
  },
})
```

## 注意事项

- 外层容器必须有明确高度（组件内部会使用 `height: calc(100% - 40px)` 给阅读区留出底部进度条）。
- 键盘左右方向键翻页：需要组件获得焦点（点击组件区域或 Tab 聚焦）。
