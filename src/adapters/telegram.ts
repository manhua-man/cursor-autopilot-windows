import TelegramBot from 'node-telegram-bot-api';
import { Adapter } from '.';
export default function Telegram(cfg:any): Adapter {
  const bot = new TelegramBot(cfg.token, { polling:true });
  let replyHandler:(r:string)=>void = ()=>{};
  bot.on('message', (m: any)=>{ if(m.chat.id.toString()===cfg.chatId) replyHandler(m.text||''); });
  return {
    send: async (s)=> { await bot.sendMessage(cfg.chatId, `📝 *Summary*\n${s.summary}\n\n➡️ *Current Status*: ${s.current_status}\n\nReply 1=continue`, { parse_mode:'Markdown' }); },
    onReply: (h)=> replyHandler = h,
    dispose: ()=> bot.stopPolling()
  };
} 