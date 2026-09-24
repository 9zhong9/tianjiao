# 宿舍日记：脚边的信任

这是一个可直接运行的 AI 对话网站原型：7 名成年虚构大学室友，拥有独立的对话记录、好感度和信任度。

## 本地启动

需要 Node.js 18 或更高版本：

```bash
npm install
cp .env.example .env
# 编辑 .env，填写 OPENAI_API_KEY
npm start
```

然后打开 http://localhost:3000。不要直接双击 `index.html`，因为 AI 请求需要由 Node 服务转发。

可配置项：

- `OPENAI_API_KEY`：服务端 API 密钥，绝不要提交到 GitHub
- `OPENAI_BASE_URL`：OpenAI 兼容接口地址，默认 `https://api.openai.com/v1`
- `OPENAI_MODEL`：模型名称，默认 `gpt-4o-mini`
- `PORT`：网站端口，默认 `3000`

## 已实现

- 每个角色独立 AI 对话
- 本地保存聊天记录、好感度和信任度
- 通过后端调用模型，前端不暴露密钥
- 体贴/尊重边界的消息提升关系数值
- 越界倾向触发拒绝方向的系统规则和关系下降
- 暂停互动、结束对话、重置进度
- 所有角色均为 20 岁成年虚构人物
- 角色无法表达意愿时不发生接触，亲密互动必须有明确、持续、可撤回的同意

## 部署

可部署到任何支持 Node.js 18 的服务（例如 Render、Railway、Fly.io 或自有服务器）。部署时在平台的 Environment Variables 中配置 `.env` 中的变量，不要上传 `.env` 文件。

本项目只提供非露骨、基于明确同意的互动；模型服务商、托管平台和所在地法律的其他规则仍然适用。
