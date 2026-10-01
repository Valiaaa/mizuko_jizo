# 页面结构说明

这个项目仍然输出一个可以直接发布的静态 `index.html`，但日常编辑不再需要把所有内容堆在同一个文件中。

## 日常编辑位置

```text
src/
├── index.html                         # 页面骨架与分片装配顺序
├── sections/
│   ├── room/
│   │   └── room.html                  # 房间故事段落
│   ├── falling/
│   │   └── falling.html               # 下坠段落与地狱场景
│   └── doors/
│       └── doors.html                 # 门厅、倒影入口与独立房间壳层
└── components/
    └── custom-cursor/
        └── custom-cursor.html         # 自定义鼠标组件

scripts/
├── room/
│   └── room-experience.js             # 房间阶段、拖拽、过渡与进度
├── falling/
│   └── falling-experience.js          # 下坠物品、角色 Cursor 与黑洞
└── hell/
    └── hell-experience.js             # 地狱叙事、门状态与房间路由

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

## Test 模式

```text
?scene=doors                 直接进入三扇门大厅
?scene=door-1               直接进入第一扇门的独立场景
?scene=door-2               直接进入第二扇门的独立场景
?scene=door-3               直接进入第三扇门的独立场景
?scene=door-4               直接进入第四扇倒影之门
?scene=doors&visited=1,2     模拟第一、二扇门已经进入过
?scene=doors&visited=all     模拟三扇门都已进入，显示第四扇门
?scene=doors&visited=        模拟三扇门都未进入
?reset=1&scene=doors         清除本地进度后进入门厅
```

前三扇门在第一次进入时写入 `mizuko-door-progress-v1`。返回门厅后，已经进入过的门保持打开；三扇门全部进入后，第三扇门下方出现第四扇门的动态倒影。
