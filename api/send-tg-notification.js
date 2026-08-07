function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uploaderName, albumName, photoCount, location } = req.body || {};

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram Bot Token or Chat ID is not configured in environment variables.');
    return res.status(200).json({ 
      success: false, 
      message: 'Telegram 變數 (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID) 未設定於 Vercel 環境變數中' 
    });
  }

  const emoji = '📸';
  const timeStr = new Date().toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' });
  
  let message = `${emoji} <b>【家族雲端相簿 - 新相片上傳】</b>\n\n`;
  message += `👤 <b>上傳成員：</b> ${escapeHtml(uploaderName || '家族成員')}\n`;
  message += `📁 <b>目標相簿：</b> ${escapeHtml(albumName || '未分類相簿')}\n`;
  message += `🔢 <b>上傳張數：</b> ${photoCount || 1} 張照片\n`;
  if (location) {
    message += `📍 <b>拍攝地點：</b> ${escapeHtml(location)}\n`;
  }
  message += `⏰ <b>時間：</b> ${timeStr}\n\n`;
  message += `🔗 <b>點此前往查看相簿：</b> <a href="https://brave-hubble.vercel.app">家族雲端相簿</a>`;

  try {
    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(tgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).json({ error: data.description || 'Failed to send Telegram message' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return res.status(500).json({ error: error.message });
  }
}
