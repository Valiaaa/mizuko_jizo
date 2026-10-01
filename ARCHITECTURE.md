# 页面结构说明

这个项目仍然输出一个可以直接发布的静态 `index.html`，但日常编辑不再需要把所有内容堆在同一个文件中。

## 日常编辑位置

```text
src/
├── index.html                         # 页面骨架与分片装配顺序
├── sections/
│   ├── room/
│   │   └── room.html                  # 房间故事段落
│   └── falling/
│       └── falling.html               # 下坠段落与下一场景入口
└── components/
    └── custom-cursor/
        └── custom-cursor.html         # 自定义鼠标组件

scripts/
├── room/
│   └── room-experience.js             # 房间阶段、拖拽、过渡与进度
└── falling/
    └── falling-experience.js          # 下坠物品、角色 Cursor 与黑洞

styles/
└── base.css                           # 当前全局视觉样式
```

以后可以按同样方式增加目录，例如：

```html
<!-- @include ./sections/prologue/prologue.html -->
<!-- @include ./sections/room/room.html -->
<!-- @include ./sections/ending/ending.html -->
```

分片路径相对于写下 `@include` 的文件。分片还可以继续包含更小的分片，但不能循环引用，也不能引用 `src/` 目录之外的文件。

## 生成发布文件

修改 `src/` 下的 HTML 后，在项目根目录运行：

```sh
npm run build
```

该命令会把分片按 `src/index.html` 中的顺序合并，并更新根目录的 `index.html`。生成文件顶部会带有说明，请不要直接长期编辑生成后的文件。

JavaScript 与 CSS 仍然是浏览器直接加载的普通静态文件，因此现有发布方式不需要改变，也不需要安装第三方依赖。
