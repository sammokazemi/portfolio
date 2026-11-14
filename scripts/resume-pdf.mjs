// Builds public/resume/Sam-Kazemi-Resume.pdf from `resume` in src/data/site.ts, in the layout of
// the original Google Docs export: one Letter page, Calibri 11pt, centered 13pt headings.
// Prints through headless Microsoft Edge over the DevTools protocol (Node 22's built-in WebSocket).
// usage: npm run resume:pdf   (set EDGE to the browser binary if it isn't in the default place)
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/resume/Sam-Kazemi-Resume.pdf');
const EDGE = process.env.EDGE ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORTFOLIO = 'https://sammokazemi.github.io/portfolio/';
const PHONE = '(925)565-3591';
// Content may run this far down the 792pt page; the Docs original ended at 760pt.
const MAX_BOTTOM = 770;

const { site, socials, resume } = await import(pathToFileURL(join(ROOT, 'src/data/site.ts')).href);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const link = (href, text) => `<a href="${href}">${esc(text)}</a>`;
const linkedin = socials.find((s) => s.icon === 'linkedin');
const github = socials.find((s) => s.icon === 'github');

// "GPA: 3.53/4.00, Honor Roll" renders as a bold label, the number, then italic honors.
const point = (p) => {
  const gpa = p.match(/^GPA: ([^,]+)(?:, (.*))?$/);
  if (gpa) return `<b>GPA:</b> ${esc(gpa[1])}${gpa[2] ? `, <i>${esc(gpa[2])}</i>` : ''}`;
  // Product names in a bullet link to the live product.
  return resume.links.reduce((h, l) => h.replace(esc(l.text), link(l.href, l.text)), esc(p));
};
const entry = (e) => `
  <div class="entry">
    <div class="row b"><span>${esc(e.name)}</span><span>${e.href ? link(e.href, e.location) : esc(e.location)}</span></div>
    <div class="row i"><span>${esc(e.role)}</span><span>${esc(e.dates)}</span></div>
    <ul>${e.points.map((p) => `<li>${point(p)}</li>`).join('')}</ul>
  </div>`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>MojtabaKazemi_Resume</title>
<style>
  @page { size: 612pt 792pt; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font: 11pt/14.05pt Calibri, Carlito, sans-serif; color: #000; font-variant-ligatures: none; }
  .page { width: 612pt; height: 792pt; padding: 58.6pt 35pt 0 39.2pt; overflow: hidden; }
  a { color: #1155cc; }
  h1 { margin: 0; font-size: 16pt; line-height: 19.5pt; text-align: center; }
  .contact { margin: 1.6pt -8pt 0; font-size: 10pt; line-height: 12pt; text-align: center; white-space: nowrap; }
  .rule { height: 3.25pt; margin: 4.9pt 0 0 -8.2pt; width: 549.75pt; background: #000; }
  h2 { margin: 3.4pt 0 0; font-size: 13pt; line-height: 16pt; text-align: center; text-transform: uppercase; }
  h2:first-of-type { margin-top: 7.6pt; }
  .entry + h2 { margin-top: 5pt; }
  .summary { margin: 0; line-height: 13.4pt; }
  .entry + .entry { margin-top: 4.5pt; }
  .row { display: flex; justify-content: space-between; }
  .b { font-weight: 700; }
  .i { font-style: italic; }
  ul { margin: 0; padding: 0; list-style: none; }
  li { position: relative; padding-left: 27pt; }
  li::before { content: '●'; position: absolute; left: 9pt; font: 11pt/14.05pt Arial, sans-serif; }
  .skills div { line-height: 15.45pt; }
</style></head>
<body><div class="page">
  <h1>${esc(site.legalName)}</h1>
  <p class="contact">US Citizen • ${link(`mailto:${site.email}`, site.email)} • ${PHONE} • ${link(PORTFOLIO, 'Website/Portfolio')} • LinkedIn: ${link(linkedin.href, linkedin.handle)} • Github: ${link(github.href, github.handle)}</p>
  <div class="rule"></div>
  <h2>Summary</h2><p class="summary">${esc(resume.summary)}</p>
  <h2>Education</h2>${resume.education.map(entry).join('')}
  <h2>Experience</h2>${resume.experience.map(entry).join('')}
  <h2>Projects</h2>${resume.projects.map(entry).join('')}
  <h2>Skills</h2><div class="skills">${resume.skills.map((s) => `<div><b>${esc(s.label)}:</b> ${esc(s.value)}</div>`).join('')}</div>
</div></body></html>`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const work = mkdtempSync(join(tmpdir(), 'resume-pdf-'));
const htmlFile = join(work, 'resume.html');
writeFileSync(htmlFile, html);

const port = 9300 + Math.floor(Math.random() * 500);
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(work, 'profile')}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
try {
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch { await sleep(250); }
  }
  if (!target) throw new Error(`Edge did not start (EDGE=${EDGE})`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else events.push(m.method);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

  await send('Page.enable');
  await send('Page.navigate', { url: pathToFileURL(htmlFile).href });
  for (let i = 0; i < 80 && !events.includes('Page.loadEventFired'); i++) await sleep(100);
  await evaluate('document.fonts.ready.then(() => true)');

  // The page is a fixed Letter sheet that clips overflow, so check the real content height.
  const bottom = await evaluate(`Math.round([...document.querySelectorAll('.page > *')].pop().getBoundingClientRect().bottom * 0.75 * 10) / 10`);
  if (bottom > MAX_BOTTOM) throw new Error(`Content ends at ${bottom}pt, past ${MAX_BOTTOM}pt: it no longer fits one page. Shorten the resume.`);

  const { data } = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  writeFileSync(OUT, Buffer.from(data, 'base64'));
  console.log(`Wrote ${OUT} (one page, content ends at ${bottom}pt of 792pt)`);
  ws.close();
} finally {
  // Killing the launcher leaves headless Edge's own process tree running; ask the browser to quit.
  try {
    const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    const browser = new WebSocket(webSocketDebuggerUrl);
    await new Promise((r) => { browser.onopen = r; });
    browser.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    for (let i = 0; i < 50; i++) {
      await sleep(100);
      try { await fetch(`http://127.0.0.1:${port}/json/version`); } catch { break; }
    }
  } catch {
    edge.kill();
  }
  await sleep(300);
  try { rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {}
}
