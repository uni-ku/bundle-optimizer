# @uni-ku/bundle-optimizer <a href="https://www.npmjs.com/package/@uni-ku/bundle-optimizer"><img src="https://img.shields.io/npm/v/@uni-ku/bundle-optimizer" alt="npm package"></a>

[![NPM downloads](https://img.shields.io/npm/dm/@uni-ku/bundle-optimizer?label=downloads)](https://www.npmjs.com/package/@uni-ku/bundle-optimizer)
[![LICENSE](https://img.shields.io/github/license/uni-ku/bundle-optimizer?style=flat&label=license)](https://github.com/uni-ku/bundle-optimizer#readme)

> [!TIP]
> uni-app 分包优化插件化实现
>
> 前往 <https://github.com/dcloudio/uni-app/issues/5025> 查看本项目立项背景。
>
> 前往 <https://github.com/Vanisper/uniapp-bundle-optimizer> 查看本插件详细发展过程与提交记录。

### 🎏 功能与支持

> ！<b style="color: red;">暂时没有对App平台做兼容性实现</b>
>
> 适用于 Uniapp - CLI 或 HBuilderX 创建的 Vue3 项目

- 分包优化
- 模块异步跨包调用
- 组件异步跨包引用

### 📦 安装

```bash
pnpm add -D @uni-ku/bundle-optimizer
```

### 🚀 使用

#### 0. 插件可配置参数

> ！<b style="color: red;">以下各参数均为可选参数</b>，默认在项目根目录下生成`async-import.d.ts`与`async-component.d.ts`文件

|参数-[enable]|类型|默认值|描述|
|---|---|---|---|
|enable|`boolean`\|`object`|`true`|插件功能总开关，`object`时可详细配置各插件启闭状态，详见下列|
|enable.optimization|`boolean`|`true`|分包优化启闭状态|
|enable['async-import']|`boolean`|`true`|模块异步跨包调用启闭状态|
|enable['async-component']|`boolean`|`true`|组件异步跨包引用启闭状态|

|参数-[dts]|类型|默认值|描述|
|---|---|---|---|
|dts|`boolean`\|`object`|`true`|dts文件输出总配置，`true`时按照下列各配置的默认参数来（根目录下生成`async-import.d.ts`与`async-component.d.ts`文件），`object`时可详细配置各类型文件的生成，详见下列|
|dts.enable|`boolean`|`true`|总配置，是否生成dts文件|
|dts.base|`string`|`./`|总配置，dts文件输出目录，可相对路径，也可绝对路径|
|dts['async-import']|`boolean`\|`object`|`true`|`async-import`dts文件配置，默认为`true`（在项目根目录生成`async-import.d.ts`文件），`object`时可详细配置该项的生成|
|dts['async-import'].enable|`boolean`|`true`|是否生成dts文件|
|dts['async-import'].base|`string`|`./`|dts文件输出目录，可相对路径，也可绝对路径|
|dts['async-import'].name|`string`|`async-import.d.ts`|dts文件名称，需要包含文件后缀|
|dts['async-import'].path|`string`|`${base}/${name}`|dts文件输出路径，如果没有定义此项则会是`${base}/${name}`，否则此配置项优先级更高，可相对路径，也可绝对路径|
|dts['async-component']|`boolean`\|`object`|`true`|`async-component`dts文件配置，默认为`true`（在项目根目录生成`async-component.d.ts`文件），`object`时可详细配置该项的生成|
|dts['async-component'].enable|`boolean`|`true`|是否生成dts文件|
|dts['async-component'].base|`string`|`./`|dts文件输出目录，可相对路径，也可绝对路径|
|dts['async-component'].name|`string`|`async-component.d.ts`|dts文件名称，需要包含文件后缀|
|dts['async-component'].path|`string`|`${base}/${name}`|dts文件输出路径，如果没有定义此项则会是`${base}/${name}`，否则此配置项优先级更高，可相对路径，也可绝对路径|

#### 1. 引入 `@uni-ku/bundle-optimizer`

- CLI: `直接编写` 根目录下的 vite.config.*
- HBuilderX: 需要根据你所使用语言, 在根目录下 `创建`  vite.config.*

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
      // dts文件输出配置，默认为true，即在项目根目录生成类型定义文件
      dts: {
        'enable': true,
        'base': 'src/types',
        // 上面是对类型生成的比较全局的一个配置
        // 下面是对每个类型生成的配置，以下各配置均为可选参数
        'async-import': {
          enable: true,
          base: 'src/types',
          name: 'async-import.d.ts',
          path: 'src/types/async-import.d.ts',
        },
        'async-component': {
          enable: true,
          base: 'src/types',
          name: 'async-component.d.ts',
          path: 'src/types/async-component.d.ts',
        },
      },
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

#### 3. 将插件生成的类型标注文件加入 `tsconfig.json`

插件运行时会在项目根目录下生成 `async-import.d.ts` 与 `async-component.d.ts` 两个类型标注文件，需要将其加入到 `tsconfig.json` 的 `include` 配置项中。

当然，如果原来的配置已经覆盖到了这两个文件，就可以不加；如果没有运行项目的时候，这两个文件不会生成。

```json
{
  "include": [
    "async-import.d.ts",
    "async-component.d.ts"
  ]
}
```

- `async-import.d.ts`：定义了 `AsyncImport` 这个异步函数，用于异步引入模块。
- `async-component.d.ts`：拓展了 `import` 的 `静态引入`，引入路径后面加上`?async`即可实现小程序端的组件异步引用。
- **详见 <https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html>**

> 这两个类型文件不会对项目的运行产生任何影响，只是为了让编辑器能够正确的识别本插件定义的自定义语法、类型。
>
> 这两个文件可以加入到 `.gitignore` 中，不需要提交到代码仓库。

### ✨ 例子

> 以下例子均以CLI创建项目为例, HBuilderX 项目与以上设置同理, 只要注意是否需要包含 src目录 即可。

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

- `模块异步跨包调用` 是指在一个分包中引用另一个分包中的模块（不限主包与分包），这里的模块可以是 js/ts 模块(插件)、vue 文件。当然，引入 vue 文件一般是没有什么意义的，但是也做了兼容处理。
- `TODO:` 是否支持 json 文件？

可以使用函数 `AsyncImport` 这个异步函数来实现模块的异步引入。

```js
// js/ts 模块(插件) 异步引入
await AsyncImport('@/pages-sub-async/async-plugin/index').then((res) => {
  console.log(res?.AsyncPlugin()) // 该插件导出了一个具名函数
})

// vue 文件 异步引入（页面文件）
AsyncImport('@/pages-sub-async/index.vue').then((res) => {
  console.log(res.default || res)
})

// vue 文件 异步引入（组件文件）
AsyncImport('@/pages-sub-async/async-component/index.vue').then((res) => {
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
- 在需要跨包引入的组件路径后面加上 `?async` 即可实现异步引入。

```vue
<script setup>
import AsyncComponent from 'xxxxx.vue?async'
</script>

<template>
  <view>
    <AsyncComponent />
  </view>
</template>
```

</details>

### 🏝 周边

|项目|描述|
|---|---|
|[Uni Ku](https://github.com/uni-ku)|有很多 Uniapp(Uni) 的酷(Ku) 😎|
|[Wot Design Uni](https://github.com/Moonofweisheng/wot-design-uni/)|一个基于Vue3+TS开发的uni-app组件库，提供70+高质量组件|

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
