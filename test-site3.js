import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));
  await page.goto('https://arthur-franco-editor.vercel.app', { waitUntil: 'networkidle0' });
  const html = await page.content();
  console.log(html.substring(0, 500));
  await browser.close();
})();
