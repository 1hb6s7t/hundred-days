# 一百天 · 给改变一点时间

面向日常使用的中文健身与英语计划网站。原生 HTML / CSS / JavaScript，GitHub Pages 托管，Supabase Auth + PostgreSQL 同步，无构建依赖。

## 功能

- 100天日历、每日任务、标准 / 忙碌日保底模式、历史补记与未来预览。
- 默认从 2026-10-19 周一开始，292.5小时英语、41次力量训练、5次测评。
- 社区 / 健身房动作切换、组数与要领、主食替换计算和蛋白来源参考。
- 每日5类AI提示词、官方材料入口、28篇网站新编听说短文与浏览器朗读。
- 实际学习计时、词块间隔复习、复盘、训练记录、体重 / 腰围趋势、四科测评记录。
- 邮箱账号登录、跨设备自动同步、离线暂存、JSON导入导出、主屏幕安装。

## 内容来源与适用范围

根据提供的「制定100天健身英语计划」V2会话正文重新编排。原会话的 ZIP / Excel / 500条提示词 / 28篇练习册附件未传入；本项目不声称完整迁移原附件。每日任务和提示词为依据正文重建，`practice.js` 中28篇为本站新编补充文本，不是官方讲稿或商业教材内容。

默认时间预算：首周工作日120分钟，之后150分钟；前两周周六210、周日180分钟，其后周六270、周日240分钟。模考替代常规英语。健身前两周周一/六、之后周一/三/六，含减量周。改变开始日期后按实际工作日/周末调度，因此总时数和次数可能变化。

这是一份可调整的执行工具，不保证100天达到特定体形或雅思成绩。按实际理解能力选择等级，按个人健康情况校准训练和饮食。

## 本地运行与检查

```sh
python3 -m http.server 4173
# 浏览 http://127.0.0.1:4173
node --test tests/*.test.js
```

所有静态资源使用相对路径，支持 `https://用户名.github.io/仓库名/` 子路径。无需第三方CDN、API代理或付费AI密钥。官方学习资源需联网。

## 部署

1. 把本目录推送到自己的 GitHub 仓库。
2. 在 Settings → Pages 选择 Deploy from a branch，`main` / `/ (root)`。
3. `.nojekyll` 禁用Jekyll；GitHub的内置Pages workflow发布静态文件。
4. `.github/workflows/check.yml` 在提交时运行数据与同步测试。

## Supabase 配置

本部署的公开项目地址与 publishable key 位于 `config.js`。它们不是管理员凭据。**禁止将 secret / service_role key 或数据库密码写入前端和Git。**

自行部署时：

1. 在自己的项目 SQL Editor 执行 `supabase.sql`（初始化一次）。
2. 替换 `config.js` 的 `url` 与公开 publishable key。
3. Authentication → URL Configuration：Site URL设为实际Pages地址。
4. 使用 Email + Password 登录。默认启用邮箱确认时，注册者需先验证邮箱；Supabase默认邮件服务有接收地址/频率限制，公开运营需配置自己的SMTP。本项目主要供项目所有者个人使用。
5. 手机与电脑使用相同网站地址、相同账号。访客记录可以登录后从账号面板合并，也可导出/导入。

`hundred_cells` 每个字段独立保存，主键 `(user_id, key)`。RLS只允许账号访问自己的行。`hundred_merge` 使用 invoker 权限，强制 `auth.uid()` 并原子接受较新的字段版本；两个设备编辑不同任务不会相互覆盖。同一字段采用逻辑时间戳，时间相同时以设备ID稳定决胜。

客户端在编辑后约1.2秒、页面切回前台、重新联网和每30秒尝试同步，失败保留本地数据并明确显示状态。网络请求有20秒超时，读取分页支持完整100天数据。设备时钟严重异常会影响同字段冲突排序，建议保持自动校时。

离线记录保存于浏览器。清除站点数据会删除未同步的记录；导出备份不包含登录凭据。不同账号的本地数据隔离，不自动把访客记录上传。

## 文件

- `plan.js`：日历规则、训练、饮食替换、AI提示词。
- `practice.js`：28篇原创练习、问题、答案、词块。
- `core.js`：日期、字段合并、导入校验、统计。
- `sync.js`：账号、会话续期、离线与同步。
- `app.js` / `style.css`：响应式界面与交互。
- `supabase.sql`：表、RLS策略、原子合并函数。
- `sw.js`：仅缓存本站静态文件，不缓存用户API响应。

## 资料入口

- [British Council 分级听力](https://learnenglish.britishcouncil.org/free-resources/listening)
- [Cambridge 发音词典](https://dictionary.cambridge.org/)
- [British Council 雅思练习](https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [GitHub Pages 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
