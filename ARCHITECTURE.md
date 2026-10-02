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
│   ├── doors/
│   │   └── doors.html                 # 门厅、倒影入口与独立房间壳层
│   ├── offerings/
│   │   └── offerings.html             # 第二房间：环绕供品、换装与祈愿文字
│   ├── reflection/
│   │   └── reflection.html            # 第四房间：第二次坠落和分散叙事
│   └── searching/
│       └── searching.html             # 第一房间：18 尊佛像与原文逐段显现
└── components/
    └── custom-cursor/
        └── custom-cursor.html         # 自定义鼠标组件

scripts/
├── navigation/
│   └── scene-navigation.js           # 统一场景名称、test 方向键与地址同步
├── room/
│   └── room-experience.js             # 房间阶段、拖拽、过渡与进度
├── falling/
│   └── falling-experience.js          # 下坠物品、角色 Cursor 与黑洞
├── reflection/
│   └── reflection-experience.js       # 滚动显现文字、中段撕裂与清理
├── offerings/
│   └── offerings-experience.js        # 供品选择、换装和 pointer 光标
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

Test 模式由 `?test=1`、`?phase=数字` 或 `?scene=场景名` 启用。左右方向键的主线顺序为：

```text
房间阶段 1–7 ↔ 下坠／洞 ↔ 地狱 ↔ 三扇门
```

叙述和质问不加入方向键主线；如通过点击或 URL 进入这两页，左方向键回地狱、右方向键去门厅。

门厅按右方向键进入第一房间，门内按左方向键一律返回门厅；门内按右方向键可依次测试第一、第二、第三房间。三扇门都已进入后，第三房间按右方向键可进入第四扇倒影之门。主线最前端不再后退；第四房间右方向键进入车祸开篇，车祸四个画面可用左右方向键依次测试，第一页左方向键返回第四房间，第四页右方向键进入星座开篇；聚焦碎石时，方向键移动碎石。输入框内、组合键和长按重复触发不执行场景切换。

```text
?test=1                     恢复最近的 test 位置，首次从房间阶段 1 开始
?phase=7                    直接进入旋转／拖拽阶段
?scene=falling              直接进入下坠／洞
?scene=next                 直接进入地狱
?scene=hell-story           直接进入叙述页
?scene=hell-accusation      直接进入质问页
?scene=doors                直接进入三扇门大厅
?scene=door-1               直接进入第一房间
?scene=door-2               直接进入第二房间
?scene=door-3               直接进入第三房间
?scene=door-4               直接测试倒影之门，同时补齐 test 的三扇门进度
?scene=accident&accidentPage=1  直接进入车祸第一画面（1–4）
?scene=constellation        白色清物 → 身体放大 → 连星 → 陶瓷与夜晚文字
?scene=doors&visited=1,2     模拟第一、二扇门已经进入过
?scene=doors&visited=all     模拟三扇门都已进入
?scene=doors&visited=        模拟三扇门都未进入
?reset=1&scene=doors         清除 test 进度后进入门厅
```

方向键和正常点击都同步当前 `scene`；房间阶段额外同步 `phase`。刷新保留当前页面，显式的 URL 场景／阶段优先于存储中的位置。`reset` 和 `visited` 是一次性初始化参数，应用后从地址中移除，避免刷新重复重置。已完成的收拢进度不会覆盖显式指定的房间阶段。

Test 进度独立写入 `mizuko-room-test-progress-v1` 和 `mizuko-door-test-progress-v1`；正式浏览仍使用 `mizuko-room-progress-v3` 和 `mizuko-door-progress-v1`。Test 跳转不会改动正式进度。正式流程中的叙述、质问、门厅及房间也分别保存场景名称。

前三扇门在第一次进入时记为已进入。返回门厅后，已经进入过的门保持打开；三扇门全部进入后，第三扇门下方出现第四扇门的动态倒影。第三扇门位于倒影之上（第三扇门 z-index 为 1、倒影为 0，父容器隔离层叠）。切换场景时会清理洞口和下坠的延迟过渡，并让隐藏场景无法接收鼠标及键盘焦点。

第一房间使用 `Page5.1_寻找_asset` 的背景和 18 尊佛像，文字按 `p5.1_text.pages` 的顺序排列。鼠标悬停或键盘聚焦时原位显示段落，离开后恢复佛像。第 15 尊水子变成黑色剪影，点击返回门厅；第 16、17 段中的“水子”也可以返回。触屏点按显示文字，水子第一次点按显现、再次点按返回。窄屏改为三列，可纵向滚动。

地狱质问页的微弱闪烁由 `hell-experience.js` 更新模糊与光晕参数；离开该页、切到后台或启用减少动态效果时停止。

第二房间使用 `Page5.2_供奉_asset` 的六种贡品、七张水子石像和六张原始手写文字。默认显示 `Mizuko_Plain`，右侧留空；点击贡品后淡入对应装扮及文字。灰色点圈由 `offering-rings.svg` 绘制，100 秒转一周；贡品 160 秒绕中心一周，自身保持直立，hover 或键盘聚焦时暂停环绕。Hover 使用系统 pointer 光标和轻微抬起／放大，隐藏自定义光标以避免重叠。点击中央水子返回门厅，每次重新进入恢复 plain。离开房间暂停旋转，减少动态效果设置下停用旋转。

第四房间由 `door-room-4` 自身纵向滚动，内容长度为 660vh。七段文字按用户提供的顺序散布，最后一句置于页面底端；中段约 40%–79% 的滚动进度播放 `Page6_Falling2_asset/rotate_anim.gif`，离开该区域停止显示，重新进入重播。背景和人物光标复用 `Page3_Falling_asset`；Page 6 内字节完全相同的 `Falling_BgLoop.gif`、`Falling_Mouse.gif` 已删除。整个体验只保留一个 `.falling-cursor`，由第一次坠落脚本挂到 body 后共同使用。离开第四房间清理动画、监听观察和光标显示，重新进入从顶端开始。

第四房间的撕裂动画以绝对定位和自身中心旋转校准到视口中心；撕裂动画透明度为 0.45，自滚动中段出现后保留至底部；两个低透明度（0.075）背景圈分别位于右上和左下，继续复用同一 GIF。末尾文字为可键盘激活的按钮，hover／聚焦时人物光标切换为眼睛，仅“受苦受难”变为暗红色。点击进入 `accident` 场景，使用 Page 7 四张 layout reference 的竖排结构和对应 debris_page1–4 独立素材，文字为可选择的网页文字。碎石置于文字上方，支持指针拖动、手／抓取光标和聚焦后的方向键移动。四个关键词 hover 变为 #9f0808，点击显示眼睛光标 500ms，再淡入下一画面。测试 URL 使用 accidentPage 保存画面，普通模式与测试模式分别保存进度。最后一句进入 `constellation` 的白色清物阶段，复用房间 LayeringObjects 18 件素材，盖住 LyingBody_small。通过图像透明度遮罩判断真实遮挡，忽略透明外框和不足 0.5% 的细小边缘；所有物品的可见图案移离身体后才能点击，解锁时将身体按钮提升至物品上方以避免透明边缘截获点击，身体放大并淡入 LyingBody_large，背景转黑。依次点击 20 个星星热区使用 constellation1–20 图层连线，当前目标略微发亮。完成后加载 ceramic-turntable.gif 于画面中央，GIF 加载成功才开启滚动与下方夜晚文字。进入／退出场景会重置连线、拖动和动画，未完成时始终锁定滚动。
