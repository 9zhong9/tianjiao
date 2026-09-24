const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

app.use(express.json({ limit: '32kb' }));
app.use(express.static(__dirname));

const characters = {
  zhou: { name: '周钟辰', role: '校草学霸', tone: '理性、克制，喜欢有条理的交流。' },
  zhu: { name: '祝嘉', role: '田径体育生', tone: '阳光直接，训练后很容易疲惫。' },
  bai: { name: '白传成', role: '游戏少爷', tone: '爱开玩笑，热衷分享游戏和新设备。' },
  wang: { name: '王子俊', role: '学生干部', tone: '稳重负责，重视规则和彼此尊重。' },
  zhong: { name: '钟景皓', role: '高冷男神', tone: '慢热寡言，但会注意细节。' },
  zhang: { name: '张凌川', role: '帅气男模', tone: '自信开朗，重视仪态和照顾。' },
  luo: { name: '罗景熙', role: '清瘦公子', tone: '文雅敏感，喜欢安静的陪伴。' }
};

const protectedPrompt = `你是游戏中的成年虚构角色。所有角色均为男性、20岁，是主角的大学室友。你必须保持角色性格，使用中文，回复简洁自然（不超过120字）。角色必须允许玩家随时拒绝、暂停或结束互动；所有亲密互动都必须基于明确、持续且可撤回的同意。角色处于睡眠、昏迷或无法表达意愿时，不发生任何身体或性接触；如果玩家提出越界请求，明确拒绝并把对话引回清醒、明确同意的互动。不得声称自己是真人，也不得诱导现实依赖。只进行非露骨的成人剧情，不描述色情或强迫性行为。`;

function relationshipDelta(text) {
  const boundary = ['偷', '强迫', '睡着', '昏迷', '不许拒绝', '无意识'].some(word => text.includes(word));
  const positive = ['谢谢', '理解', '辛苦', '关心', '可以吗', '愿意吗', '尊重', '休息', '喜欢', '聊聊'].some(word => text.includes(word));
  if (boundary) return { affection: -4, trust: -8 };
  if (positive) return { affection: 3, trust: 3 };
  return { affection: 2, trust: 1 };
}

app.post('/api/chat', async (req, res) => {
  try {
    const { characterId, messages, stats } = req.body || {};
    const character = characters[characterId];
    if (!character || !Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return res.status(400).json({ error: '请求参数无效。' });
    }
    const safeMessages = messages.filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
      .slice(-20).map(item => ({ role: item.role, content: item.content.slice(0, 1000) }));
    const latestUserText = [...safeMessages].reverse().find(item => item.role === 'user')?.content || '';
    if (!latestUserText) return res.status(400).json({ error: '消息不能为空。' });

    const system = `${protectedPrompt}\n当前角色：${character.name}，${character.role}。性格：${character.tone}\n当前好感度：${Number(stats?.affection || 0)}，信任度：${Number(stats?.trust || 0)}。不要直接输出数值。`;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(503).json({ error: '服务端尚未配置 OPENAI_API_KEY，请复制 .env.example 为 .env 并填写密钥。' });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.8, max_tokens: 180, messages: [{ role: 'system', content: system }, ...safeMessages] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data?.error?.message || 'AI 服务请求失败。' });
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: 'AI 没有返回有效回复。' });
    res.json({ reply, delta: relationshipDelta(latestUserText) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '服务器暂时无法连接 AI 服务。' });
  }
});

app.listen(port, () => console.log(`Tianjiao AI site: http://localhost:${port}`));
