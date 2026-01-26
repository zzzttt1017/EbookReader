## 目标
- 在不改变“组件宽高完全依赖外层容器”的前提下，让工具栏根据容器宽度自适应：
  - 宽屏：工具栏悬浮在右侧（更接近“右侧贴边/垂直居中”的悬浮控件）。
  - 小屏：识别为移动端交互，底部工具栏默认隐藏；上划（或轻点）内容区时带动画出现；底栏从左到右：目录、搜索、进度、明暗、字号；点击任一项，上滑动画出现对应内容面板。

## 断点与宽度判定（基于容器自身）
- 在根节点（`.ebook-reader`）上用 `ResizeObserver` 监听自身宽度，而不是 `window.innerWidth`，确保嵌入任意容器都能正确响应。
- 采用两条阈值（可后续抽成常量/可配置）：
  - `MOBILE_MAX_WIDTH = 768`：≤768 进入移动端模式。
  - `WIDE_MIN_WIDTH = 1024`：≥1024 进入“右侧悬浮”模式。
  - 介于两者之间（平板/窄桌面）：保留现有右上角工具栏布局，避免频繁切换。

## 桌面/宽屏：右侧悬浮工具栏
- 仅改样式与包裹 class，不改按钮逻辑：
  - 给根节点加布局标记：`data-layout="mobile|default|wide"`。
  - 在 `wide` 下把 `.ebook-reader__toolbar` 从 `top/right` 改为 `top: 50%` + `transform: translateY(-50%)`，形成“右侧悬浮”。

## 移动端：底部工具栏 + 上滑内容面板
- React/Vue 都新增一套移动端 UI（仅在 `layout===mobile` 渲染），并在移动端隐藏现有：
  - 右上工具栏 `.ebook-reader__toolbar`
  - 现有底部进度条 `.ebook-reader__bottom`
  - 左/右侧抽屉（目录/搜索）改为底部面板展示（保持功能一致，但交互换为底部上滑）。

### 1) 底部工具栏结构
- 新增 DOM 结构（类名示例）：
  - `.ebook-reader__mbar`：底部条（含 5 个按钮，按需求顺序）。
  - `.ebook-reader__msheet`：底部上滑面板（内容区）。
  - `.ebook-reader__msheet.is-open`：打开态（translateY 动画）。
  - `.ebook-reader__moverlay`：面板打开时的遮罩（点击关闭）。

### 2) 面板内容复用现有逻辑
- 目录面板：复用现有 TOC 渲染（`renderTocItems`/Vue 对应递归渲染），点击跳转并关闭面板。
- 搜索面板：复用现有搜索输入、选项、结果列表与 `runSearch/cancel/clear` 逻辑。
- 进度面板：复用现有 range 逻辑（`isSeeking/seekPercent/goToFraction`），并显示当前百分比/章节标题。
- 明暗面板：提供一个“亮/暗”切换按钮（仍走 `setDarkModeInternal`）。
- 字号面板：提供 `A- / 当前百分比 / A+`（仍走 `setFontSizeInternal`），并对边界值做保护（避免负数或过大）。

### 3) “上划展示”手势与动画
- 手势只绑定在根容器或 viewer 区域（不依赖页面滚动）：
  - 监听 `pointerdown/move/up`，在移动端识别垂直滑动：
    - 上滑超过阈值（如 24px）显示底部工具栏（若已显示则不重复）。
    - 下滑超过阈值隐藏底部工具栏与面板。
  - 为避免与面板内部滚动冲突：仅当事件起点在 viewer 区域（不在面板/底栏）才触发手势。
- 动画由 CSS transition 实现：
  - 工具栏显示：`translateY(100%) -> 0`。
  - 面板上滑：`translateY(100%) -> 0`，并配合遮罩渐变。

## 样式实现（ebook-reader.css）
- 新增基于 `data-layout` 的样式分支：
  - `data-layout="wide"`：调整 `.ebook-reader__toolbar` 悬浮位置。
  - `data-layout="mobile"`：隐藏现有 toolbar/bottom/drawer；定义 `.ebook-reader__mbar/.ebook-reader__msheet/.ebook-reader__moverlay` 的布局、层级、圆角、阴影、过渡动画；沿用现有 CSS 变量（panel-bg/fg/border/accent/shadow/radius）。
- 保持默认布局样式不变，避免影响现有桌面使用方。

## 跨框架对齐
- React：修改 [EBookReader.tsx](file:///d:/Project/Demo/EBook/plugin/ebook-reader/src/react/EBookReader.tsx) 渲染分支与状态（`layout`、`mobileBarVisible`、`mobilePanel`）。
- Vue：同步修改 [EBookReaderVue.ts](file:///d:/Project/Demo/EBook/plugin/ebook-reader/src/vue/EBookReaderVue.ts) 的 VNode 渲染与响应式状态，保证功能一致。

## 验证方式
- 在 playground：
  - React demo 与 Vue demo 分别测试容器宽度在 360/768/900/1200 时的布局切换。
  - 移动端：触控上滑显示底栏、点击 5 项分别弹出面板、遮罩/下滑关闭、目录跳转/搜索/进度跳转/主题字号生效。
  - 桌面：键盘左右翻页、ESC 关闭抽屉（默认/宽屏模式仍可用）。

如果你确认该方案，我会按上述步骤同时改 React + Vue + CSS，并在两个 playground 做一轮手动验证。