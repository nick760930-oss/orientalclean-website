// 連線層：用 Supabase Realtime 的 broadcast 頻道當中繼（主機權威）
// 主機跑完整遊戲並廣播畫面狀態；同伴只送按鍵、接收畫面。
// 這裡只負責房間與收發訊息，遊戲邏輯在 game.js。
'use strict';

const NET = (() => {
  // 與官網共用的 Supabase 專案；publishable key 本來就是公開給瀏覽器用的
  const SB_URL = 'https://qculqsczmhnyfdhnbvpo.supabase.co';
  const SB_KEY = 'sb_publishable_UNPIfvsEdwtHrAzVXeRD0A_ZrSnc42p';
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的 I O 0 1

  let client = null;
  let channel = null;
  let open = false;

  function makeCode() {
    let s = '';
    for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return s;
  }

  function disconnect() {
    if (channel && client) client.removeChannel(channel);
    channel = null;
    open = false;
  }

  function connect(code, handlers) {
    if (!window.supabase || !window.supabase.createClient) {
      handlers.status('CHANNEL_ERROR');
      return;
    }
    if (!client) client = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
    disconnect();
    const ch = client.channel('starsand-room-' + code, { config: { broadcast: { self: false, ack: false } } });
    channel = ch;
    // 只處理目前這條頻道的事件；舊頻道的 CLOSED 回呼不能蓋掉新頻道的狀態
    ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
      if (ch === channel) handlers.message(payload);
    });
    ch.subscribe((status) => {
      if (ch !== channel) return;
      open = status === 'SUBSCRIBED';
      handlers.status(status);
    });
  }

  function send(msg) {
    if (!open || !channel) return;
    channel.send({ type: 'broadcast', event: 'msg', payload: msg }).catch(() => {});
  }

  function isOpen() { return open; }

  return { makeCode, connect, disconnect, send, isOpen };
})();
