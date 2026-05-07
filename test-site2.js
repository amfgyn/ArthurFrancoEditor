import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (response.status() === 404) console.log('404:', response.url());
  });
  await page.goto('https://arthur-franco-editor.vercel.app', { waitUntil: 'networkidle0' });
  await browser.close();
})();
