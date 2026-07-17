# NSCA-CPT 复习 App

个人刷题用网页。支持安装到 Android 主屏幕、离线打开、本地保存进度，以及可选的 Supabase 跨设备同步。

入口文件：`index.html`

## Android 安装

用 Android Chrome 打开公开网址，点右上角菜单中的“安装应用”或“添加到主屏幕”。安装后可从桌面图标进入，不需要通过 Android Studio 打开。

## Supabase 数据库

1. 创建 Supabase 项目。
2. 在 SQL Editor 运行 `supabase/migrations/001_study_progress.sql`。
3. 在 Authentication 的 URL Configuration 中，把正式网址设为 Site URL，并加入 Redirect URLs。
4. 从 Project Settings 的 API 页面取得 Project URL 和 anon public key。
5. 把两个公开值填入 `cloud-config.js`。不要把 `service_role` key 写入前端。

数据库启用了 Row Level Security。登录用户只能读写自己的进度。

## Vercel

仓库可直接导入 Vercel，不需要 Build Command，Output Directory 留空。`vercel.json` 已设置 Service Worker 的更新缓存策略。
