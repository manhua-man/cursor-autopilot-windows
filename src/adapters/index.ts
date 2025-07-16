export interface Adapter {
  send(s:any): Promise<void>;
  onReply(h:(r:string)=>void): void;
  dispose?(): void;
}

import Email from './email';
import Telegram from './telegram';
import Feishu from './feishu';
export const adapterMap = {
  email: Email,
  telegram: Telegram,
  feishu: Feishu,
} as Record<string,(cfg:any)=>Adapter>; 