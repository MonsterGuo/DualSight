# DualSight 打包指南（Windows）

本文档记录 DualSight 从 Web 应用打包为 Windows 安装包（Electron + electron-builder/NSIS）的完整方式，方便后期修改配置、图标、版本号与输出位置。

## 1. 技术方案

| 项 | 选型 |
|---|---|
| 桌面壳 | Electron 44（主进程 ESM） |
| 安装包 | electron-builder 26，NSIS 向导式安装程序（x64） |
| Web 构建 | Vite + React 18 + TypeScript |
| 主进程编译 | `tsc -p tsconfig.electron.json` → `dist-electron/` |

## 2. 相关文件

| 文件 | 作用 |
|---|---|
| `electron/main.ts` | Electron 主进程：窗口尺寸（1440×900，最小 960×600）、深色背景、菜单条隐藏、外部链接交给系统浏览器、生产环境加载 `dist/index.html` |
| `tsconfig.electron.json` | 主进程 TS 编译配置（输出 CommonJS 无关的 ESM 到 `dist-electron/`） |
| `build/icon.ico` | **唯一图标源**：应用 exe、安装器、卸载器、快捷方式统一引用 |
| `build/icon.svg` | 图标设计源文件（26×26，蓝紫渐变双镜头） |
| `build/installer.nsh` | NSIS 钩子：安装/卸载后执行 `ie4uinit` 强制刷新 Windows 图标缓存，避免替换同路径 exe 后快捷方式仍显示旧图标 |
| `scripts/make-icon.mjs` | 零依赖光栅化脚本：由设计生成多尺寸 `icon.ico`（256/128/64/32/16） |
| `scripts/dist-win.mjs` | Windows 打包入口：注入预置工具链路径后调用 electron-builder |
| `package.json` 的 `build` 字段 | electron-builder 唯一生效配置源 |

## 3. 一键打包

```bash
npm run dist:win
```

该命令依次执行：

1. `npm run build:web` — `tsc --noEmit && vite build`，产物在 `dist/`
2. `npm run build:electron` — 编译主进程到 `dist-electron/`
3. `node scripts/dist-win.mjs` — 注入工具链环境变量并执行 electron-builder

产物默认在 `release/`：

- `DualSight-Setup-1.0.0.exe` — **安装包（分发这个）**
- `win-unpacked/` — 免安装的解压版（含 `DualSight.exe`，可直接运行验证）
- `*.blockmap` — 增量更新用，可忽略

> 注意：不要直接用 `npx electron-builder`。本机环境会拦截目录重命名，导致工具链解压阶段报 `EPERM rename ... .tmp`。`dist:win` 脚本通过预置工具链绕过此问题。

## 4. 为什么需要预置工具链（dist-win.mjs）

electron-builder 首次打包要下载并解压 7-Zip、NSIS、nsis-resources 到缓存目录，解压后会把 `xxx.tmp` 重命名为正式名。本环境禁止目录重命名，必现 EPERM。

绕开方式：把工具链提前解压到 `.cache/tools/`，再用环境变量告诉 builder 直接使用：

| 环境变量 | 指向 |
|---|---|
| `ELECTRON_BUILDER_7ZIP_PATH` | `.cache/tools/7zip/bin/7za.exe` |
| `ELECTRON_BUILDER_NSIS_DIR` | `.cache/tools/nsis`（含 `Bin/makensis.exe`、`elevate.exe`） |
| `ELECTRON_BUILDER_NSIS_RESOURCES_DIR` | `.cache/tools/nsis-resources`（插件目录） |

Electron 本体则在 package.json 中用 `"electronDist": "node_modules/electron/dist"` 直接复制，同样绕过下载重命名。若 `node_modules/electron/dist` 不存在（如刚装完依赖 postinstall 未跑），执行：

```bash
node node_modules/electron/install.js
```

### 换电脑 / 缓存丢失时如何重建工具链

`.cache/` 已被 .gitignore 忽略。首次在新机器上可让 builder 先下载压缩包（下载不受影响，只有重命名失败），随后手动解压：

```powershell
# 7za（builder 已下载的缓存在 .cache/electron-builder/.../*.tmp，或自行获取 7za）
# NSIS 与 nsis-resources 归档：
#   nsis-3.0.4.1.7z
#   nsis-resources-3.4.1.7z
# 来源：https://github.com/electron-userland/electron-builder-binaries/releases
New-Item -ItemType Directory -Force .cache/tools/nsis,.cache/tools/nsis-resources | Out-Null
7za x nsis-3.0.4.1.7z        -o.cache/tools/nsis           -y
7za x nsis-resources-3.4.1.7z -o.cache/tools/nsis-resources -y
```

7za.exe 自身放到 `.cache/tools/7zip/bin/7za.exe` 即可。

## 5. 常见修改

### 5.1 改版本号

改 `package.json` 的 `"version"`。安装包名由模板自动生成（当前为 `DualSight-Setup-<version>.exe`）。

### 5.2 改应用名

- `package.json` → `build.productName`（安装目录、exe 名）与 `build.nsis.shortcutName`（快捷方式名）
- 顶栏文字在 `src/components/Toolbar.tsx`
- 网页标题在 `index.html` 的 `<title>`

### 5.3 改输出位置

改 `package.json` 的 `build.directories.output`：

```json
"directories": { "output": "D:/Releases/DualSight" }
```

支持绝对路径。建议用独立子目录，避免与其他项目产物混杂。也可用命令行临时覆盖：

```
--config.directories.output=D:/Releases/DualSight
```

### 5.4 改安装包文件名

改 `build.nsis.artifactName`，可用变量：

```json
"artifactName": "${productName}-Setup-${version}.${ext}"
```

### 5.5 改图标（单一来源，只改一个文件）

1. 更新 `build/icon.svg`（设计源）
2. 重新生成 ico：

   ```bash
   node scripts/make-icon.mjs
   # 可选：输出 256px 预览图检查效果
   node scripts/make-icon.mjs preview.png
   ```

3. `package.json` 中三处图标均指向 `build/icon.ico`：`build.win.icon`（exe）、`build.nsis.installerIcon`（安装器）、`build.nsis.uninstallerIcon`（卸载器），无需逐个改
4. **快捷方式图标缓存**：Windows 按 exe 路径缓存图标，同路径覆盖后桌面/开始菜单可能仍显示旧图标。`build/installer.nsh` 已在安装/卸载结束时自动执行 `ie4uinit -ClearIconCache` + `ie4uinit -show`（经 `build.nsis.include` 引入）；手动排查时可重启资源管理器或注销
5. 网页 favicon 与顶栏 logo 是独立内联 SVG，需分别改 `index.html` 与 `src/components/Toolbar.tsx`
6. **清空 `release/` 后重新打包**，避免 NSIS 复用旧资源：

   ```bash
   Remove-Item -Recurse -Force release
   npm run dist:win
   ```

> 验证真实图标要从 exe 提取，不要只看资源管理器缩略图（缓存可能骗人）。

### 5.6 改窗口外观

`electron/main.ts` 中的 `BrowserWindow` 选项：`width/height/minWidth/minHeight/backgroundColor` 等。

### 5.7 安装行为

`build.nsis`：

- `oneClick: false` — 向导式安装（true 则一键静默安装）
- `allowToChangeInstallationDirectory` — 允许自选目录
- `createDesktopShortcut` / `createStartMenuShortcut` — 快捷方式
- `perMachine`（未设置，默认当前用户安装）

## 6. 图标设计规格

- 画布 26×26，圆角矩形 `rx=6`
- 背景对角渐变：`#2d6aff`（左上）→ `#7b3fff`（右下）
- 两个白色描边镜头圆（圆心 8.5/17.5，半径 5，描边 1.5，不透明度 0.9）
- 中间桥接横线 (11,13)→(15,13)
- 两个高光圆点（半径 1，不透明度 0.7）

## 7. 验证清单

打包后建议依次确认：

1. `release/win-unpacked/DualSight.exe` 能启动且不闪退
2. 从 Setup exe 提取图标为新图标（非旧缓存）
3. 全新目录安装一遍：桌面/开始菜单快捷方式、卸载入口正常
4. 应用内示例图片/视频可加载（确认 `vite.config.ts` 的 `base: './'` 未被改回，否则 file:// 下资源 404）

## 8. 已忽略的生成物（.gitignore）

`node_modules/`、`dist/`、`dist-electron/`、`release/`、`.cache/`、`*.tsbuildinfo` 均不入库；图标源与脚本（`build/`、`scripts/`、`electron/`）需要提交。
