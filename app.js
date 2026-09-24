const STORAGE_KEY = 'tianjiao-prototype-v1';

const characters = [
  { id: 'zhou', name: '周钟辰', role: '校草学霸', tone: '理性、克制，喜欢有条理的交流。', greeting: '今天的课程还顺利吗？如果你愿意，可以和我聊聊。' },
  { id: 'zhu', name: '祝嘉', role: '田径体育生', tone: '阳光直接，训练后很容易疲惫。', greeting: '刚训练完，腿有点酸。你今天过得怎么样？' },
  { id: 'bai', name: '白传成', role: '游戏少爷', tone: '爱开玩笑，热衷分享游戏和新设备。', greeting: '来一局？输了的人负责买夜宵，怎么样？' },
  { id: 'wang', name: '王子俊', role: '学生干部', tone: '稳重负责，重视规则和彼此尊重。', greeting: '宿舍安排我刚整理完。有什么想聊的吗？' },
  { id: 'zhong', name: '钟景皓', role: '高冷男神', tone: '慢热寡言，但会注意细节。', greeting: '嗯，我在。你想说什么？' },
  { id: 'zhang', name: '张凌川', role: '帅气男模', tone: '自信开朗，重视仪态和照顾。', greeting: '今天的光线不错。你看起来有心事。' },
  { id: 'luo', name: '罗景熙', role: '清瘦公子', tone: '文雅敏感，喜欢安静的陪伴。', greeting: '夜里很安静。坐一会儿也好。' }
];

const positiveWords = ['谢谢', '理解', '辛苦', '关心', '可以吗', '愿意吗', '尊重', '休息', '喜欢', '聊聊'];
const boundaryWords = ['偷', '强迫', '睡着', '昏迷', '不许拒绝', '无意识'];

const defaultState = () => ({
  selected: 'zhou',
  stats: Object.fromEntries(characters.map(c => [c.id, { affection: 10, trust: 10, messages: 0, paused: false }])),
  chats: {}
});
let state = loadState();

const $ = (selector) => document.querySelector(selector);
const character = () => characters.find(c => c.id === state.selected);

function loadState() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; }
  catch { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function clamp(n) { return Math.max(0, Math.min(100, n)); }
function currentChat() { return state.chats[state.selected] || []; }
function addMessage(sender, text) {
  state.chats[state.selected] ||= [];
  state.chats[state.selected].push({ sender, text });
  saveState();
  renderChat();
}
function adjust(affection, trust) {
  const stats = state.stats[state.selected];
  stats.affection = clamp(stats.affection + affection);
  stats.trust = clamp(stats.trust + trust);
  stats.messages += 1;
  saveState();
  renderStatus();
  renderCharacters();
}

function renderCharacters() {
  $('#character-list').innerHTML = characters.map(c => {
    const s = state.stats[c.id];
    return `<button class="character-button ${c.id === state.selected ? 'active' : ''}" data-id="${c.id}" type="button">${c.name}<span>${c.role} · 好感 ${s.affection}</span></button>`;
  }).join('');
  document.querySelectorAll('.character-button').forEach(button => button.addEventListener('click', () => selectCharacter(button.dataset.id)));
}
function renderHeader() {
  const c = character();
  $('#character-header').innerHTML = `<h2>${c.name}</h2><p>20岁 · ${c.role} · ${c.tone}</p>`;
}
function renderChat() {
  const log = $('#chat-log');
  const messages = currentChat();
  if (!messages.length) {
    log.innerHTML = `<div class="message character"><div class="bubble"><small>${character().name}</small>${character().greeting}</div></div>`;
  } else {
    log.innerHTML = messages.map(m => `<div class="message ${m.sender}"><div class="bubble"><small>${m.sender === 'player' ? '你' : character().name}</small>${escapeHtml(m.text)}</div></div>`).join('');
  }
  log.scrollTop = log.scrollHeight;
  renderChoices();
}
function renderChoices() {
  const c = character();
  $('#choices').innerHTML = [
    `今天辛苦了，想聊聊你的近况吗？`,
    `如果你累了可以休息，我会尊重你的决定。`,
    `我可以陪你，但你随时可以拒绝或结束。`
  ].map(text => `<button class="choice-button" type="button" data-text="${text}">${text}</button>`).join('');
  document.querySelectorAll('.choice-button').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.text)));
}
function renderStatus() {
  const s = state.stats[state.selected];
  const ready = s.affection >= 70 && s.trust >= 60;
  $('#status-card').innerHTML = `
    <div><div class="stat-label"><span>好感度</span><b>${s.affection}/100</b></div><div class="meter"><i style="width:${s.affection}%"></i></div></div>
    <div><div class="stat-label"><span>信任度</span><b>${s.trust}/100</b></div><div class="meter"><i style="width:${s.trust}%"></i></div></div>
    <div><span class="tag">${ready ? '可提出亲密互动请求' : '继续建立信任'}</span></div>
    <div class="stat-label"><span>本次聊天</span><b>${s.messages} 条</b></div>`;
}
function escapeHtml(value) { return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch])); }
function selectCharacter(id) { state.selected = id; saveState(); renderAll(); }

function sendMessage(text) {
  const clean = text.trim();
  if (!clean) return;
  const stats = state.stats[state.selected];
  addMessage('player', clean);
  const hasBoundary = boundaryWords.some(word => clean.includes(word));
  const isPositive = positiveWords.some(word => clean.includes(word));
  let reply;
  let affection = 1;
  let trust = 1;
  if (hasBoundary) {
    reply = '我不接受在无法表达意愿时被接触。请尊重我的边界；如果你愿意，我们可以在我清醒并明确同意的情况下继续聊天。';
    affection = -4; trust = -8;
  } else if (isPositive) {
    reply = `${character().name}认真听完后点了点头：“谢谢你这样说。和你聊天让我觉得被尊重，也更愿意慢慢了解你。”`;
    affection = 3; trust = 3;
  } else {
    reply = `${character().name}想了想：“我明白了。我们可以慢慢聊，不用急着决定任何事。”`;
    affection = 2; trust = 1;
  }
  adjust(affection, trust);
  setTimeout(() => addMessage('character', reply), 180);
}

$('#chat-form').addEventListener('submit', event => { event.preventDefault(); const input = $('#message-input'); sendMessage(input.value); input.value = ''; });
$('#pause-btn').addEventListener('click', () => { state.stats[state.selected].paused = true; saveState(); addMessage('character', '那我们先暂停一下。等你准备好时再继续。'); });
$('#end-btn').addEventListener('click', () => addMessage('character', '好的，今天就聊到这里。谢谢你尊重我的选择。'));
$('#reset-btn').addEventListener('click', () => { if (confirm('确定要清除所有本地测试进度吗？')) { state = defaultState(); saveState(); renderAll(); } });
function renderAll() { renderCharacters(); renderHeader(); renderChat(); renderStatus(); }
renderAll();
