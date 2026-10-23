// Renders index.html to an A5 PDF with Chromium via Playwright.
// Usage: NODE_PATH=/opt/node-tools/node_modules node render.cjs [out.pdf]
const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
  const out = process.argv[2] || path.join(__dirname, 'asuu-travel-taniltsuulga-v3.pdf');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'index.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Layout report: free space between the last block and the footer rule, in pt.
  const info = await page.evaluate(() => {
    const px2pt = v => Math.round(v * 72 / 96 * 10) / 10;
    return [...document.querySelectorAll('.page')].map((p, i) => {
      const top = p.getBoundingClientRect().top;
      const last = p.querySelector('main').lastElementChild.getBoundingClientRect();
      const foot = p.querySelector('footer').getBoundingClientRect();
      return { page: i + 1, lastBottom: px2pt(last.bottom - top), footerTop: px2pt(foot.top - top), slack: px2pt(foot.top - last.bottom) };
    });
  });
  console.log(JSON.stringify(info));

  await page.pdf({ path: out, width: '5.8268in', height: '8.2677in', printBackground: true, preferCSSPageSize: false,
    margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await browser.close();
  console.log('wrote', out);
})();
