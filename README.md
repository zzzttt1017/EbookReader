# @somecat/epub-reader

轻量 EBookReader：基于 `foliate-js` 的 `foliate-view`，提供 React 18+ / Vue 3 组件（不依赖 Ant Design / UnoCSS），并内置基础 UI（目录、搜索、翻页、字号、明暗主题、阅读进度）。

## 安装

```bash
pnpm add @somecat/epub-reader
```

同时在你的应用入口引入样式：

```ts
import '@somecat/epub-reader/style.css'
```

## React 18+

```tsx
import { useMemo, useRef, useState } from 'react'
import { EBookReader } from '@somecat/epub-reader/react'
import '@somecat/epub-reader/style.css'

export default function Demo() {
  const [file, setFile] = useState<File | null>(null)
  const ref = useRef(null)

  return (
    <div style={{ height: '100vh' }}>
      <input
        type="file"
        accept=".epub"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div style={{ height: 'calc(100vh - 40px)' }}>
        <EBookReader ref={ref} file={file} />
      </div>
    </div>
  )
}
```

### Props

> `file` 与 `fileUrl` 同时传入时，优先使用 `file`。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| file | `File \| null` | - | 直接传入本地文件（`.epub`） |
| fileUrl | `string \| null` | - | 传入 URL，组件内部下载并打开（需服务端允许跨域） |
| className | `string` | - | 根容器额外类名 |
| style | `React.CSSProperties` | - | 根容器行内样式 |
| defaultFontSize | `number` | `100` | 非受控字号初始值（百分比） |
| fontSize | `number` | - | 受控字号（百分比） |
| onFontSizeChange | `(fontSize: number) => void` | - | 字号变化回调（受控/非受控都会触发） |
| defaultDarkMode | `boolean` | `false` | 非受控暗黑模式初始值 |
| darkMode | `boolean` | - | 受控暗黑模式 |
| onDarkModeChange | `(darkMode: boolean) => void` | - | 明暗变化回调（受控/非受控都会触发） |
| enableKeyboardNav | `boolean` | `true` | 是否启用键盘左右键翻页、ESC 关闭抽屉 |
| defaultSearchOptions | `SearchOptions` | `{ matchCase:false, wholeWords:false, matchDiacritics:false }` | 搜索默认选项 |
| onReady | `(handle: EBookReaderHandle) => void` | - | Core 就绪回调（可拿到完整 handle） |
| onError | `(error: unknown) => void` | - | 错误回调（初始化/打开/搜索等） |
| onProgress | `(info: ProgressInfo) => void` | - | 阅读进度回调 |

### Ref（命令式 API）

`ref` 暴露的方法：

- `prevPage()` / `nextPage()`
- `prevSection()` / `nextSection()`
- `goTo(target: string)`
- `goToFraction(fraction: number)`（`0 ~ 1`）
- `search(query: string, options?: SearchOptions): Promise<SearchResult[]>`
- `cancelSearch()` / `clearSearch()`

## Vue 3

```ts
import '@somecat/epub-reader/style.css'
```

```ts
import { defineComponent, ref } from 'vue'
import { EBookReaderVue } from '@somecat/epub-reader/vue'

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

### Props

> `file` 与 `fileUrl` 同时传入时，优先使用 `file`。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| file | `File \| null` | - | 直接传入本地文件（`.epub`） |
| fileUrl | `string \| null` | - | 传入 URL，组件内部下载并打开（需服务端允许跨域） |
| defaultFontSize | `number` | `100` | 非受控字号初始值（百分比） |
| fontSize | `number` | - | 受控字号（百分比） |
| defaultDarkMode | `boolean` | `false` | 非受控暗黑模式初始值 |
| darkMode | `boolean` | - | 受控暗黑模式 |
| enableKeyboardNav | `boolean` | `true` | 是否启用键盘左右键翻页、ESC 关闭抽屉 |
| defaultSearchOptions | `SearchOptions` | `{ matchCase:false, wholeWords:false, matchDiacritics:false }` | 搜索默认选项 |

### Emits / v-model

- `ready(handle)` / `error(error)` / `progress(info)`
- `fontSizeChange(fontSize)` / `darkModeChange(darkMode)`
- `update:fontSize(fontSize)` / `update:darkMode(darkMode)`（用于 `v-model:fontSize`、`v-model:darkMode`）

### Expose（命令式 API）

组件实例暴露的方法同 React ref：

- `prevPage()` / `nextPage()`
- `prevSection()` / `nextSection()`
- `goTo(target: string)`
- `goToFraction(fraction: number)`（`0 ~ 1`）
- `search(query: string, options?: SearchOptions): Promise<SearchResult[]>`
- `cancelSearch()` / `clearSearch()`

## 类型说明

### SearchOptions

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| matchCase | `boolean` | `false` | 匹配大小写 |
| wholeWords | `boolean` | `false` | 全词匹配 |
| matchDiacritics | `boolean` | `false` | 匹配变音符号 |

### ProgressInfo

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| fraction | `number \| undefined` | 进度（`0 ~ 1`） |
| tocItem | `TocItem \| null \| undefined` | 当前章节信息 |
| location | `unknown` | 底层定位信息（透传） |

## 注意事项

- 外层容器必须有明确高度（组件内部会使用 `height: calc(100% - 40px)` 给阅读区留出底部进度条）。
- 键盘左右方向键翻页：需要组件获得焦点（点击组件区域或 Tab 聚焦）。
- 使用 `fileUrl` 时，资源需要允许浏览器跨域访问（CORS），否则下载会失败。
