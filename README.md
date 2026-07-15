# 锦福添丁｜GitHub Pages 静态版

这是零 npm、零 Node 运行依赖的纯静态版本。

## 在当前仓库发布

1. 将仓库推送到 GitHub。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择分支 `main`，目录选择 `/docs`，然后保存。

发布完成后，地址通常为：

`https://你的用户名.github.io/仓库名/`

## 单独建立仓库

也可以把 `docs` 文件夹内的全部文件上传到一个新仓库的根目录，然后在 Pages 设置中选择 `main / (root)`。

页面只包含：

- `index.html`
- `style.css`
- `app.js`
- `celebration-bg.jpg`
- `.nojekyll`

抽奖进度保存在当前浏览器的 `localStorage` 中，不依赖服务器。

转盘奖项覆盖 ¥88–¥1,288。页面会从符合条件的三次中奖组合中随机选择一组，确保三次累计金额在 ¥2,000–¥2,500 之间；当前组合池的总体数学期望约为 ¥2,235.43。
