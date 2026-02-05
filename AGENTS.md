# 项目上下文指南 (AGENTS.md)

这份文档旨在为智能体（AI Agent）提供 `@somecat/epub-reader` 项目的全面上下文信息，帮助理解架构设计、代码逻辑和业务规则。

## 1. 项目概览

*   **项目名称**: `@somecat/epub-reader`
*   **主要目的**: 提供一个基于 Web Components 的跨框架 EPUB 电子书阅读器组件库。
*   **核心价值**: 封装底层复杂的 EPUB 解析与渲染逻辑（基于 `foliate-js`），提供统一、易用的 API 和 UI 组件，支持 React 和 Vue 框架，开箱即用。
*   **技术栈**:
    *   **核心语言**: TypeScript
    *   **核心依赖**: `foliate-js` (负责 EPUB 解析与渲染)
    *   **框架支持**: React (>=18), Vue (>=3)
    *   **构建工具**: `tsup` (打包), `vite` (Playground 运行)
    *   **包管理**: `pnpm` (Monorepo 工作空间管理)

## 2. 目录结构解析

项目采用 Monorepo 风格结构（尽管当前主要是一个包），核心逻辑与演示应用分离。

*   **`src/`**: 源代码目录。
    *   **`core/`**: 核心逻辑层。不依赖任何 UI 框架。
        *   `reader.ts`: 封装 `foliate-view` 自定义元素，提供底层 API（`createEBookReader`）。
        *   `types.ts`: 定义核心类型接口（`EBookReaderHandle`, `TocItem` 等）。
    *   **`react/`**: React 适配层。
        *   `EBookReader.tsx`: React 组件实现，包含完整 UI（目录、设置、进度条）。
    *   **`vue/`**: Vue 适配层。
        *   `EBookReaderVue.ts`: Vue 组件实现，功能与 React 版本对齐。
    *   **`styles/`**: 样式文件。
        *   `epub-reader.css`: 组件的核心样式。
*   **`playgrounds/`**: 演示与开发环境。
    *   `react-demo/`: 基于 Vite + React 的测试应用。
    *   `vue-demo/`: 基于 Vite + Vue 的测试应用。
*   **`scripts/`**: 构建脚本。
    *   `copy-style.mjs`: 构建后将 CSS 文件复制到发布目录。
*   **配置文件**:
    *   `package.json`: 定义依赖、脚本及多入口导出（exports 字段区分 core/react/vue）。
    *   `tsup.config.mjs`: 打包配置，生成 ESM 和 CJS 格式，拆分多入口。
    *   `pnpm-workspace.yaml`: 定义工作空间范围。

## 3. 核心模块/组件说明

### 3.1 Core (`src/core`)
*   **职责**: 连接 `foliate-js` 与上层组件，屏蔽 DOM 操作细节。
*   **关键文件**: `src/core/reader.ts`
*   **主要函数**: `createEBookReader(container, options)`
    *   **输入**: 挂载容器 DOM，配置选项（字号、暗黑模式、回调函数）。
    *   **输出**: `EBookReaderHandle` 对象，包含 `open`, `goTo`, `setDarkMode` 等控制方法。
    *   **内部逻辑**: 创建并管理 `<foliate-view>` 元素，注入样式，监听阅读进度事件。

### 3.2 React Component (`src/react`)
*   **职责**: 提供 React 开发者友好的组件接口，内置常用 UI。
*   **关键文件**: `src/react/EBookReader.tsx`
*   **组件**: `EBookReader`
    *   **Props**: `file` (File对象), `defaultFontSize`, `defaultDarkMode`, `onProgress` 等。
    *   **Ref**: 暴露 `EBookReaderHandle` 供父组件命令式控制。
    *   **内部状态**: 管理目录显隐、搜索状态、当前进度百分比。

### 3.3 Vue Component (`src/vue`)
*   **职责**: 提供 Vue 开发者友好的组件接口，功能与 React 版本保持一致。
*   **关键文件**: `src/vue/EBookReaderVue.ts`
*   **组件**: `EBookReaderVue`
    *   **Props**: 与 React 版本一致。
    *   **Emits**: `ready`, `error`, `progress` 等事件。

## 4. 关键业务流程

### 4.1 电子书打开流程
1.  用户在 Playground 选择 `.epub` 文件。
2.  Playground 组件将 `File` 对象传递给 `EBookReader` (React/Vue) 组件。
3.  组件内部调用 Core 层的 `reader.open(file)`。
4.  Core 层调用 `foliate-view` 的 `open` 方法解析书籍。
5.  解析完成后触发 `onReady` 回调，UI 更新为“阅读模式”。

### 4.2 样式/主题切换流程
1.  用户点击 UI 上的“设置”按钮，修改字号或暗黑模式。
2.  组件状态更新，并调用 Handle 的 `setFontSize` 或 `setDarkMode`。
3.  Core 层接收调用，重新生成 CSS 字符串（`getContentCSS`）。
4.  Core 层调用 `viewer.renderer.setStyles` 将新 CSS 注入到 Shadow DOM 中，实现样式实时更新。

## 5. 外部依赖与集成

*   **`foliate-js`**: 核心渲染引擎。
    *   **集成方式**: 通过 `import 'foliate-js/view.js'` 注册自定义元素 `<foliate-view>`。
    *   **注意**: 必须确保自定义元素已注册，且操作的是 DOM 元素上的方法。

## 6. 开发与构建指南

*   **安装依赖**: `pnpm install`
*   **启动开发环境**:
    *   React: `pnpm dev:react` (运行在 `http://localhost:5173`)
    *   Vue: `pnpm dev:vue`
*   **构建库**: `pnpm build` (使用 tsup 打包并复制样式)
*   **类型检查**: `pnpm typecheck`

## 7. 配置说明

*   **`tsup.config.mjs`**:
    *   `entry`: 定义了 `index`, `core`, `react`, `vue` 四个入口，实现按需加载。
    *   `format`: 同时输出 ESM (`.js`) 和 CJS (`.cjs`)。
    *   `external`: `react`, `vue` 被标记为外部依赖，不打包进库中。

## 8. 约定与规范

*   **文件命名**: 
    *   React 组件使用 `.tsx`，大驼峰命名 (e.g., `EBookReader.tsx`).
    *   Vue 组件使用 `.ts` (TSX/Render Function 风格)，大驼峰命名.
    *   Core 逻辑使用 `.ts`.
*   **样式管理**: 核心样式集中在 `src/styles/epub-reader.css`，使用 CSS 变量（`--epub-reader-*`）实现主题定制。
*   **代码风格**: 依赖 Prettier/ESLint（虽然未显式看到配置文件，但代码风格统一）。

## 9. 为智能体提供的上下文提示

作为智能体，在处理本项目任务时，请遵循以下建议：

*   **代码分析重点**:
    *   如果涉及 **底层渲染问题** (如翻页、样式注入失败)，请重点查看 `src/core/reader.ts`。
    *   如果涉及 **UI 交互问题** (如目录打不开、进度条不更新)，请分别查看 `src/react/EBookReader.tsx` 或 `src/vue/EBookReaderVue.ts`。
    *   如果涉及 **样式问题**，请直接修改 `src/styles/epub-reader.css`，并注意 CSS 变量的定义。

*   **跨框架一致性**:
    *   本项目承诺 React 和 Vue 版本功能一致。如果你修改了 `src/react` 下的逻辑，**务必** 检查并同步修改 `src/vue` 下的对应逻辑，反之亦然。

*   **常见任务入口**:
    *   **添加新配置项**: 
        1. 修改 `src/core/types.ts` 中的 `EBookReaderOptions`。
        2. 更新 `src/core/reader.ts` 处理新选项。
        3. 更新 React/Vue 组件的 Props 定义及 UI 绑定。
    *   **修复渲染 Bug**: 检查 `getContentCSS` 函数生成的 CSS 是否正确。

*   **示例查询**:
    *   "如何增加一个背景色设置选项？" -> 提示查看 `types.ts` 和 `getContentCSS`。
    *   "Vue 组件的事件是如何发出的？" -> 提示查看 `src/vue/EBookReaderVue.ts` 中的 `emit` 用法。
