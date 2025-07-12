const puppeteer = require('puppeteer');

async function scrapePage(url) {
  const browser = await puppeteer.launch({ headless: true }); // Optional: headless is true by default
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' }); // wait for full load

  // Get full HTML after any JS rendering is done
  const html = await page.content();

  await browser.close();
  return html;
}

module.exports = scrapePage;