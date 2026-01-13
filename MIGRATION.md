# 迁移指南 | Migration Guide

本指南旨在帮助开发者将 `@uni-ku/bundle-optimizer` 升级至最新版本。此次更新包含多项破坏性变更，涉及模块异步导入与组件异步引用，请按照以下步骤进行迁移。

---

## 🚨 破坏性变更 (Breaking Changes)

### 1. 模块异步导入：`AsyncImport` 更名为 `import`
原来的自定义异步导入函数 `AsyncImport` 已被废弃，现在直接使用 ESM 原生异步导入语法 `import()`。插件会自动处理多端兼容性（如在小程序端转译为 `require.async`）。

### 2. 组件异步引用：移除 `?async` 查询参数
不再支持通过 `import Component from './Comp.vue?async'` 的方式声明异步组件。请改用配置式声明。

### 3. 移除 `dts` 自动生成功能
插件不再负责生成 `async-import.d.ts` 和 `async-component.d.ts` 类型定义文件，相关的 `dts` 配置参数也已移除。

### 4. 对非法的 `import()` 行为，实现了无感的屏蔽操作
`v2.1.0` 版本开始，插件实现了 **无感屏蔽** 非法的 `import()` 行为，同时会有 log 提示开发者迁移写法
#### 小程序端
- 暂停对 Vue 文件的 `import()` 动态导入支持
- ~~目前在代码中使用 `import('./Comp.vue').then(...)` 这种方式动态加载 Vue 文件会与分包优化逻辑冲突，可能导致组件/页面空白。~~ 随着新版本的到来 `v2.1.0`，可以不用在意这个问题了，如果还存在问题，欢迎反馈🙏
- 况且这种做法在小程序端是没有效果的，本项目的早前示例只是一个极端测试
> 注：针对 JS/TS 模块的动态导入 `import('./module.ts')` 仍然正常支持。
#### APP 端
- app端的编译格式是iife，无法使用`import()`语法，故均视为非法，将全量屏蔽

---

## 🛠 迁移步骤 (Migration Steps)

### 1. 模块导入迁移 (AsyncImport -> import)

全局搜索 `AsyncImport` 并替换为 `import`。

**修改前 (Before):**
```ts
AsyncImport('@/utils/test').then((res) => {
  res.doSomething()
})
```

**修改后 (After):**
```ts
import('@/utils/test').then((res) => {
  res.doSomething()
})
```

### 2. 组件引用迁移 (Config-based)

全局搜索 `?async` 字符串，移除后缀并添加 `componentPlaceholder` 配置。

#### 方式一：使用 `<script setup>` (推荐)
```vue
<script setup lang="ts">
// ✅ 移除 ?async 后缀
import SubComponent from '@/pages-sub/component.vue'

// ✅ 添加 componentPlaceholder 配置
defineOptions({
  componentPlaceholder: {
    SubComponent: 'view'
  }
})
</script>
```

#### 方式二：使用选项式 API
```vue
<script>
import SubComponent from '@/pages-sub/component.vue'

// 同样支持支持 defineComponent
export default {
  components: { SubComponent },
  // ✅ 添加配置
  componentPlaceholder: {
    SubComponent: 'view'
  }
}
</script>
```

### 3. 清理配置文件与环境

*   **`vite.config.ts`**: 移除插件配置中的 `dts` 选项。
*   **文件清理**: 删除项目根目录下的 `async-import.d.ts` 和 `async-component.d.ts`。
*   **`tsconfig.json`**: 移除对上述 `.d.ts` 文件的引用。
*   **`.gitignore`**: 移除相关忽略规则。

---

## ❓ 常见问题

**Q: 为什么要统一使用原生 `import()`？**
- A: 降低学习成本，提供更好的 IDE 类型支持，并使代码更符合标准。

**Q: 动态 `import()` Vue 文件，导致文件对应的组件、页面空白了怎么办？**
- A: 这可能是 `v2.1.0` 之前的版本存在的问题，详见本文档 **“破坏性变更”** 中[此处的说明](#4-对非法的-import-行为实现了无感的屏蔽操作)
- 当前版本下禁止再使用这种做法，况且这种做法在小程序端是没有效果的；当前版本这种行为与分包优化的某一个行为有些许冲突。
- 如果真的是要异步跨包引用一个组件，则改用本文档推荐的 `componentPlaceholder` 配置式方案来实现组件的异步跨包引用。

**Q: `componentPlaceholder` 的值应该填什么？**
- A: 通常填写 `'view'` 即可。
