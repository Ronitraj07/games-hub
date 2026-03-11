import type { IncomingMessage, ServerResponse } from 'http';

const BREVO_API_KEY = process.env.BREVO_API_KEY ?? '';
const FROM_EMAIL   = process.env.BREVO_FROM_EMAIL ?? 'noreply@shizzandsparkles.fun';
const FROM_NAME    = 'Couple Games Hub';

// Game emoji map
const GAME_EMOJI: Record<string, string> = {
  tictactoe:         '💗',
  wordscramble:      '🔮',
  memorymatch:       '🌸',
  connect4:          '💎',
  triviaquiz:        '✨',
  rockpaperscissors: '🫧',
  pictionary:        '🎴',
  mathduel:          '⚡',
  truthordare:       '🔥',
};

const getGameEmoji = (gameType: string) =>
  GAME_EMOJI[gameType.toLowerCase().replace(/[^a-z]/g, '')] ?? '🎮';

const buildHtml = ({
  fromName,
  gameName,
  roomCode,
  roomUrl,
}: {
  fromName: string;
  gameName: string;
  roomCode: string;
  roomUrl: string;
}) => {
  const emoji = getGameEmoji(gameName);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Game Invite</title>
</head>
<body style="margin:0;padding:0;background:#fdf2f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f8;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(236,72,153,0.12);">

        <!-- Header gradient -->
        <tr>
          <td style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:36px 40px;text-align:center;">
            <div style="font-size:56px;margin-bottom:12px;">${emoji}</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Game Invite!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">${fromName} is challenging you to a game</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;text-align:center;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">Game</p>
            <p style="margin:0 0 28px;color:#111827;font-size:22px;font-weight:700;text-align:center;">${emoji} ${gameName}</p>

            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;text-align:center;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">Room Code</p>
            <div style="background:#fdf2f8;border:2px dashed #f9a8d4;border-radius:16px;padding:20px;text-align:center;margin-bottom:28px;">
              <span style="font-size:38px;font-weight:900;letter-spacing:0.35em;color:#ec4899;font-family:monospace;">${roomCode}</span>
            </div>

            <div style="text-align:center;margin-bottom:28px;">
              <a href="${roomUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;box-shadow:0 4px 16px rgba(236,72,153,0.35);">
                Join Game →
              </a>
            </div>

            <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.6;">
              Or open <a href="${roomUrl}" style="color:#ec4899;text-decoration:none;font-weight:600;">Couple Games Hub</a>
              and enter code <strong style="font-family:monospace;color:#7c3aed;">${roomCode}</strong> manually.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fdf2f8;padding:20px 40px;text-align:center;border-top:1px solid #fce7f3;">
            <p style="margin:0;color:#d1d5db;font-size:12px;">Couple Games Hub &nbsp;·&nbsp; Private & exclusive 💕</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

/** Read the full body of an IncomingMessage as a string */
const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end',  () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const json = (res: ServerResponse, status: number, body: unknown) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Only POST
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  if (!BREVO_API_KEY) {
    return json(res, 500, { error: 'BREVO_API_KEY env var not set on Vercel' });
  }

  let body: Record<string, string> = {};
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const { toEmail, toName, fromName, gameName, roomCode, roomUrl } = body;

  if (!toEmail || !fromName || !gameName || !roomCode || !roomUrl) {
    return json(res, 400, {
      error: 'Missing required fields: toEmail, fromName, gameName, roomCode, roomUrl',
    });
  }

  const payload = {
    sender:      { name: FROM_NAME, email: FROM_EMAIL },
    to:          [{ email: toEmail, name: toName ?? toEmail.split('@')[0] }],
    subject:     `${fromName} is inviting you to play ${gameName}! 🎮`,
    htmlContent: buildHtml({ fromName, gameName, roomCode, roomUrl }),
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: {
        'api-key':      BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[send-invite] Brevo error:', response.status, text);
      return json(res, 502, { error: 'Brevo API error', detail: text });
    }

    const data = await response.json() as { messageId?: string };
    return json(res, 200, { ok: true, messageId: data.messageId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-invite] fetch error:', message);
    return json(res, 500, { error: message });
  }
}
