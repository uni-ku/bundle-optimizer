# @uni-ku/bundle-optimizer <a href="https://www.npmjs.com/package/@uni-ku/bundle-optimizer"><img src="https://img.shields.io/npm/v/@uni-ku/bundle-optimizer" alt="npm package"></a>

[![NPM downloads](https://img.shields.io/npm/dm/@uni-ku/bundle-optimizer?label=downloads)](https://www.npmjs.com/package/@uni-ku/bundle-optimizer)
[![LICENSE](https://img.shields.io/github/license/uni-ku/bundle-optimizer?style=flat&label=license)](https://github.com/uni-ku/bundle-optimizer#readme)
[![pkg.pr.new](https://pkg.pr.new/badge/uni-ku/bundle-optimizer?style=flat&color=000&logoSize=auto)](https://pkg.pr.new/~/uni-ku/bundle-optimizer)

> [!TIP]
> uni-app 分包优化插件化实现
>
> 前往 <https://github.com/dcloudio/uni-app/issues/5025> 查看本项目立项背景。
>
> 前往 <https://github.com/Vanisper/uniapp-bundle-optimizer> 查看本插件详细发展过程与提交记录。

> [!CAUTION]
> **v2.0.0版本开始，有重大更新，如果您是从旧版本升级，请务必阅读 [迁移指南 (MIGRATION.MD)](./MIGRATION.md)。**

### 🎏 功能与支持

> 适用于 Uniapp - CLI 或 HBuilderX 创建的 Vue3 项目

- 分包优化
- 模块异步跨包调用
  > 允许使用 `import()` 语法，异步引用模块。
  >
  > 注意，这不是指静态导入，详见[此处](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/import)。
  >
  > `v2.1.0` 版本开始，插件实现了 **无感屏蔽** 非法的 `import()` 行为，同时会有 log 提示开发者迁移写法：
  > - 小程序端对 vue 组件文件的 `import()` 是非法的
  > - app端的编译格式是iife，无法使用`import()`语法，故均视为非法，将全量屏蔽
  >
- 组件异步跨包引用
  > 在vue 组件的 `defineOptions` 宏指令或者默认导出下配置 `componentPlaceholder`，eg:
  > ```vue
  > <!-- setup 模式（组合式） -->
  > <script setup>
  > import SubComponent from '@/pages-sub-async/component.vue'
  > import SubDemo from '@/pages-sub-demo/index.vue'
  >
  > defineOptions({
  >   componentPlaceholder: {
  >     SubComponent: 'view',
  >     SubDemo: 'view',
  >   },
  > })
  > </script>
  > ```
  > ```vue
  > <!-- 默认导出模式（选项式） -->
  > <script>
  > import SubComponent from '@/pages-sub-async/component.vue'
  > import SubDemo from '@/pages-sub-demo/index.vue'
  > // 同样支持支持 defineComponent
  > export default {
  >   components: {
  >     SubComponent,
  >     SubDemo,
  >   },
  >   componentPlaceholder: {
  >     SubComponent: 'view',
  >     SubDemo: 'view',
  >   },
  > }
  > </script>
  > ```

异步组件、异步模块引用基本原理：**详见 <https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html>**

### 📦 安装

```bash
pnpm add -D @uni-ku/bundle-optimizer
```

### 🚀 使用

#### 0. 插件可配置参数

> ！<b style="color: red;">以下各参数均为可选参数</b>，默认开启所有插件功能，并在项目根目录下生成`async-component.d.ts`文件

| 参数-[enable]               | 类型                  | 默认值    | 描述                                 |
|---------------------------|---------------------|--------|------------------------------------|
| enable                    | `boolean`\|`object` | `true` | 插件功能总开关，`object`时可详细配置各插件启闭状态，详见下列 |
| enable.optimization       | `boolean`           | `true` | 分包优化启闭状态                           |
| enable['async-import']    | `boolean`           | `true` | 模块异步跨包调用启闭状态                       |
| enable['async-component'] | `boolean`           | `true` | 组件异步跨包引用启闭状态                       |

| 参数-[logger] | 类型                    | 默认值     | 描述                                                                                                       |
|-------------|-----------------------|---------|----------------------------------------------------------------------------------------------------------|
| logger      | `boolean`\|`string[]` | `false` | 插件日志输出总配置，`true`时启用所有子插件的日志功能；`string[]`时可具体启用部分插件的日志，可以是`optimization`、`async-component`、`async-import` |

#### 1. 引入 `@uni-ku/bundle-optimizer`

- CLI: `直接编写` 根目录下的 vite.config.*
- HBuilderX: 需要根据你所使用语言, 在根目录下 `创建`  vite.config.*

##### 简单配置：

```js
// vite.config.*
import Uni from '@dcloudio/vite-plugin-uni'
import Optimization from '@uni-ku/bundle-optimizer'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Uni(),
    Optimization({
      enable: true,
      dts: true,
      logger: false,
    }),
    // 以上配置都是默认配置，可以直接不传任何配置
    // Optimization(),
  ],
})
```

##### 详细配置说明

```js
// vite.config.*
import Uni from '@dcloudio/vite-plugin-uni'
import Optimization from '@uni-ku/bundle-optimizer'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Uni(),
    // 可以无需传递任何参数，默认开启所有插件功能，并在项目根目录生成类型定义文件
    Optimization({
      // 插件功能开关，默认为true，即开启所有功能
      enable: {
        'optimization': true,
        'async-import': true,
        'async-component': true,
      },
      // 也可以传递具体的子插件的字符串列表，如 ['optimization', 'async-import', 'async-component']，开启部分插件的log功能
      logger: true, // 默认 false
    }),
  ],
})
```

#### 2. 修改 `manifest.json`

需要修改 manifest.json 中的 `mp-weixin.optimization.subPackages` 配置项为 true，开启方法与vue2版本的uniapp一致。

```json
{
  "mp-weixin": {
    "optimization": {
      "subPackages": true
    }
  }
}
```

> 使用了 `@uni-helper/vite-plugin-uni-manifest` 的项目，修改 `manifest.config.ts` 的对应配置项即可。

#### 3. (可选) 异步组件配置，获得 ts 类型标注

本项目为异步组件配置 componentPlaceholder 时，提供了 ts 类型标注，类型文件为 `@uni-ku/bundle-optimizer/client`。

可按需引用，下面分别提供 `三斜线指令` 与 `tsconfig` 两种配置方法。

##### 三斜线指令
在项目的入口文件（如 main.ts）顶部添加：
```ts
/// <reference types="@uni-ku/bundle-optimizer/client" />
```
> 但是一般不会在入口文件写这个类型引用，而是有专门的 `*.d.ts` 文件，内容同上。

##### tsconfig 配置
在业务项目的 `tsconfig` 配置文件的 `compilerOptions.types` 数组中添加：
```json
{
  "compilerOptions": {
    "types": [
      "@uni-ku/bundle-optimizer/client"
    ]
  }
}
```

### ✨ 例子

> 以下例子均以CLI创建项目为例, HBuilderX 项目与以上设置同理。
>
> 现在已经支持 hbx 创建的 vue3 + vite、不以 src 为主要代码目录的项目。

 🔗 [查看以下例子的完整项目](./examples)

<details>
  <summary>
    <strong>1. (点击展开) 分包优化</strong>
  </summary>
  <br />

`分包优化` 是本插件运行时默认开启的功能，无需额外配置，只需要确认 `manifest.json` 中的 `mp-weixin.optimization.subPackages` 配置项为 true 即可。

详情见本文档中的 [`使用`](#-使用) 部分。

</details>

<details>
  <summary>
    <strong>2. (点击展开) 模块异步跨包调用</strong>
  </summary>
  <br />

- `模块异步跨包调用` 是指在一个分包中引用另一个分包中的模块（不限主包与分包），这里的模块可以是 js/ts 模块(插件)。
- `TODO:` 是否支持 json 文件？
- `TODO:` 是否支持 vue 文件？当然，小程序环境引入 vue 文件一般是没有什么意义的。
  > ~~目前实测，小程序环境下，千万不要对一个 vue 组件进行 `import()`~~
  > ~~这会导致这个 vue 组件对应的页面或者文件空白，和 **“分包优化”** 功能有些许冲突”，后续会尽可能填补这个缺陷~~
  >
  > 随着新版本的到来 `v2.1.0`，对非法的 `import()` 行为，实现了无感的屏蔽操作，同时会有 log 提示开发者迁移写法
  >
  > 可以不用在意可能会因为这个问题导致的页面空白问题了，如果还存在问题，欢迎反馈🙏，[详见此处](./MIGRATION.md#4-对非法的-import-行为实现了无感的屏蔽操作)

可以直接使用 esm 的原生异步导入语法 `import()` 来实现模块的异步引入。
- h5：原生支持
- mp：转译成 `require.async()`
- app：app端的编译格式是 `iife`，无法使用 `import()` 语法，本插件将全量屏蔽 `import()` 行为
- 其他 mp：TODO: 未做兼容测试，欢迎反馈

```js
// js/ts 模块(插件) 异步引入
await import('@/pages-sub-async/async-plugin/index').then((res) => {
  console.log(res?.AsyncPlugin()) // 该插件导出了一个具名函数
})

// vue 文件 异步引入（页面文件）❌ 不要这样使用，不要这样引用组件文件
import('@/pages-sub-async/index.vue').then((res) => {
  console.log(res.default || res)
})

// vue 文件 异步引入（组件文件）❌ 不要这样使用，不要这样引用组件文件
import('@/pages-sub-async/async-component/index.vue').then((res) => {
  console.log(res.default || res)
})
```

</details>

<details>
  <summary>
    <strong>3. (点击展开) 组件异步跨包引用</strong>
  </summary>
  <br />

- `组件异步跨包引用` 是指在一个分包中引用另一个分包中的组件（不限主包与分包），这里的组件就是 vue 文件；貌似支持把页面文件也作为组件引入。
- 需要在 vue 组件的 `defineOptions` 宏指令或者默认导出下配置 `componentPlaceholder`。
- 由于小程序端需要 `kebab-case` 风格的组件名称，插件内部会自动处理你的 `componentPlaceholder` 配置：将组件名称（key）以及占位目标组件名（value）转换成 `kebab-case` 风格。

**setup 模式（组合式）：**
```vue
<!-- setup 模式（组合式） -->
<script setup>
import SubComponent from '@/pages-sub-async/component.vue'
import SubDemo from '@/pages-sub-demo/index.vue'

defineOptions({
  componentPlaceholder: {
    SubComponent: 'view',
    SubDemo: 'view',
  },
})
</script>
```
**默认导出模式（选项式）：**
> 可能有些环境不能使用 defineOptions 宏
```vue
<!-- 默认导出模式（选项式） -->
<script>
import SubComponent from '@/pages-sub-async/component.vue'
import SubDemo from '@/pages-sub-demo/index.vue'

// 同样支持支持 defineComponent
export default {
  components: {
    SubComponent,
    SubDemo,
  },
  componentPlaceholder: {
    SubComponent: 'view',
    SubDemo: 'view',
  },
}
</script>
```

</details>

### 🙏 感谢

- 感谢 [chouchouji](https://github.com/chouchouji) 提供的配置式异步组件导入的思路，插件指路 👉 [vite-plugin-component-placeholder](https://github.com/chouchouji/vite-plugin-component-placeholder)。
  > 详见讨论 https://github.com/uni-ku/bundle-optimizer/issues/26#issuecomment-3611984928
- 感谢 [vue-macros](https://github.com/vue-macros/vue-macros) 项目提供的 vue-sfc 以及宏指令解析实现。

### 🏝 周边

| 项目                                                                  | 描述                                  |
|---------------------------------------------------------------------|-------------------------------------|
| [Uni Ku](https://github.com/uni-ku)                                 | 有很多 Uniapp(Uni) 的酷(Ku) 😎           |
| [create-uni](https://uni-helper.js.org/create-uni)                  | 🛠️ 快速创建uni-app项目                   |
| [Wot Design Uni](https://github.com/Moonofweisheng/wot-design-uni/) | 一个基于Vue3+TS开发的uni-app组件库，提供70+高质量组件 |

### 🧔 找到我

> 加我微信私聊，方便定位、解决问题。

<table style="width: 100%; text-align: center;">
  <tr>
    <td>
      <img src="https://fastly.jsdelivr.net/gh/Vanisper/static@main/connect/weixin-qrcode.png" alt="wechat-qrcode" height="360" />
      <p align="center">微信</p>
    </td>
  </tr>
</table>

### 💖 赞赏

如果我的工作帮助到了您，可以请我吃辣条，使我能量满满 ⚡

> 请留下您的Github用户名，感谢 ❤

#### 直接赞助

<table style="width: 100%; text-align: center;">
  <tr>
    <td>
      <img src="https://fastly.jsdelivr.net/gh/Vanisper/sponsors@main/assets/wechat-pay.png" alt="wechat-pay" height="360" />
      <p align="center">微信</p>
    </td>
    <td>
      <img src="https://fastly.jsdelivr.net/gh/Vanisper/sponsors@main/assets/alipay.png" alt="alipay" height="360" />
      <p align="center">支付宝</p>
    </td>
  </tr>
</table>

#### 赞赏榜单

<p align="center">
  <a href="https://github.com/Vanisper/sponsors">
    <img alt="sponsors" src="https://fastly.jsdelivr.net/gh/Vanisper/sponsors@main/sponsors.svg"/>
  </a>
</p>

---

<p align="center">
Happy coding!
</p>
