# 水子地藏 / Mizuko Jizō

一个以小说为基础、通过点击与拖动展开的响应式互动叙事项目。

## 开始开发

```bash
npm install
npm run dev
```

常用检查：

```bash
npm run typecheck
npm run lint
npm run build
```

## 项目地图

- `app/`：页面入口和全局样式
- `components/cursor/`：全站鼠标状态、热点和切换逻辑
- `components/story/`：跨章节共享的叙事组件
- `content/`：章节顺序、标题和内容元数据
- `lib/`：不属于单一章节的配置和工具
- `mouse/`：原始鼠标图片
- `Page*_asset/`：原始章节素材，暂时保留原目录
- `docs/`：开发计划和内容接入说明

鼠标状态通过 `data-cursor` 声明：

```tsx
<button data-cursor="hand">可点击</button>
<div data-cursor="hand">可拖动；按下时全局自动切为 grab</div>
<div data-cursor="key">持有钥匙时的区域</div>
```

自定义鼠标只在支持悬停的精确指针设备上启用；触屏与键盘用户继续使用浏览器原生行为。
