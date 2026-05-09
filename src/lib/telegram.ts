export async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  if (!botToken || !chatId) return false;
  
  const token = botToken.trim();
  const id = chatId.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: id,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API Error:', errorData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    // You can also show an alert here or handle it differently if needed,
    // but typically we just return false
    return false;
  }
}
