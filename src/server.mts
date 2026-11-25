import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import service from './service.mjs';

// The database client and the port both arrive through the service
// declaration — never from process.env.
const { db } = service.load();
const port = service.port();

interface NoteRow {
  id: number;
  title: string;
  createdAt: Date;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPage(notes: NoteRow[]): string {
  const items = notes
    .map(
      (note) =>
        `      <li>#${note.id} — ${escapeHtml(note.title)} <small>${escapeHtml(
          note.createdAt.toISOString(),
        )}</small></li>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Notes on Compute</title>
  </head>
  <body>
    <h1>Notes</h1>
    <p>A tiny app served by Prisma Compute, reading its database through its service declaration.</p>
    <form method="post" action="/notes">
      <input name="title" placeholder="Write a note" required />
      <button type="submit">Add</button>
    </form>
    <ul id="notes">
${items || '      <li>No notes yet.</li>'}
    </ul>
  </body>
</html>
`;
}

function send(res: ServerResponse, status: number, body: string, type = 'text/plain; charset=utf-8'): void {
  res.writeHead(status, { 'content-type': type });
  res.end(body);
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/health') {
    send(res, 200, 'ok');
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/notes')) {
    const notes = await db.client.orm.public.Note
      .select('id', 'title', 'createdAt')
      .orderBy((note) => note.id.desc())
      .limit(50)
      .all();
    send(res, 200, renderPage(notes), 'text/html; charset=utf-8');
    return;
  }

  if (req.method === 'POST' && url.pathname === '/notes') {
    let body = '';
    req.setEncoding('utf8');
    for await (const chunk of req) body += chunk;
    const title = (new URLSearchParams(body).get('title') ?? '').trim();
    if (title === '') {
      send(res, 400, 'A note needs a title.');
      return;
    }
    await db.client.orm.public.Note.create({ title });
    res.writeHead(303, { location: '/' });
    res.end();
    return;
  }

  send(res, 404, 'not found');
}

// Keep the process alive on unexpected errors; the platform restarts a
// crash-looping service, but a logged error is easier to read.
process.on('uncaughtException', (error) => console.error(error));
process.on('unhandledRejection', (error) => console.error(error));

createServer((req, res) => {
  void handle(req, res).catch((error: unknown) => {
    console.error(error);
    if (!res.headersSent) send(res, 500, 'internal error');
    else res.end();
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`web listening on 0.0.0.0:${port}`);
});
