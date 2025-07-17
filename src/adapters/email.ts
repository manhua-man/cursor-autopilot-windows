import nodemailer from 'nodemailer';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Adapter } from '.';

export default function Email(cfg: any): Adapter {
  /* ---------- resolve runtime cfg ---------- */
  const port   = Number(cfg.port) || 587;          // Gmail recommend 587 STARTTLS
  const secure = cfg.secure ?? false;              // false = plain → STARTTLS
  const agent  = cfg.proxy ? new SocksProxyAgent(cfg.proxy) : undefined;

  console.log('[EmailAdapter] Config:', {
    host: cfg.host || 'smtp.gmail.com',
    port,
    secure,
    user: cfg.user ? cfg.user.substring(0, 3) + '***' : 'undefined',
    proxy: cfg.proxy || 'none'
  });

  /* ---------- build transport -------------- */
  const smtp = nodemailer.createTransport({
    host:   cfg.host || 'smtp.gmail.com',
    port,
    secure,
    auth:   { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 30000,    // Increase to 30 seconds
    socketTimeout:      30000,   // Increase to 30 seconds
    greetingTimeout:    10000,   // Add greeting timeout
    tls: { 
      rejectUnauthorized: false,
      servername: cfg.host || 'smtp.gmail.com' // Explicitly set servername
    },
    agent: agent,
    debug: true,                 // Enable debug logging
    logger: {
      debug: (msg: string) => console.log('[EmailAdapter] DEBUG:', msg),
      info: (msg: string) => console.log('[EmailAdapter] INFO:', msg),
      error: (msg: string) => console.error('[EmailAdapter] ERROR:', msg)
    }
  } as any);

  // Make verification optional to avoid blocking extension startup
  let isVerified = false;
  
  // Verify connection asynchronously
  setTimeout(() => {
    smtp.verify((err) => {
      if (err) {
        console.error('[EmailAdapter] SMTP verify failed:', err.message);
        console.error('[EmailAdapter] Full error:', err);
        
        // Provide helpful debugging information
        if ((err as any).code === 'ETIMEDOUT') {
          console.error('[EmailAdapter] TROUBLESHOOTING:');
          console.error('1. Check your internet connection');
          console.error('2. Verify SMTP server settings (host, port)');
          console.error('3. Check if firewall is blocking the connection');
          console.error('4. Try different ports: 587 (STARTTLS), 465 (SSL), 25 (plain)');
          console.error('5. For Gmail, ensure you have enabled 2FA and created an app password');
        }
      } else {
        console.log('[EmailAdapter] SMTP connection verified successfully');
        isVerified = true;
      }
    });
  }, 1000); // Delay verification by 1 second

  let replyHandler: (r: string) => void = () => {};

  return {
    /** send() returns void → async + await */
    async send(s) {
      try {
        console.log('[EmailAdapter] Attempting to send email...');
        
        const result = await smtp.sendMail({
          from: cfg.user,
          to:   cfg.to,
          subject: '[Cursor] Summary',
          text: `${s.summary}\nCurrent Status: ${s.current_status}\n\nReply 1=continue`
        });
        
        console.log('[EmailAdapter] Email sent successfully, messageId:', result.messageId);
      } catch (error: any) {
        console.error('[EmailAdapter] Send failed:', error.message);
        
        // Provide specific error handling
        if ((error as any).code === 'ETIMEDOUT') {
          console.error('[EmailAdapter] Connection timeout - email may not be sent');
        } else if ((error as any).code === 'EAUTH') {
          console.error('[EmailAdapter] Authentication failed - check username/password');
        } else if ((error as any).code === 'ECONNREFUSED') {
          console.error('[EmailAdapter] Connection refused - check host/port settings');
        }
        
        // Don't throw error to prevent extension from crashing
        console.error('[EmailAdapter] Email sending failed, but continuing...');
      }
    },
    onReply: h => replyHandler = h            // TODO: Poll IMAP
  };
}
