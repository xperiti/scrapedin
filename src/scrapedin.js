const puppeteer = require('puppeteer')
const login = require('./login')
const profile = require('./profile/profile')
const logger = require('./logger')

module.exports = async ({ cookies, email, password, isHeadless, hasToLog, hasToGetContactInfo, puppeteerArgs } = { isHeadless: true, hasToLog: false }) => {
  if (!hasToLog) {
    logger.stopLogging()
  }
  logger.info('scrapedin', 'initializing')

  const args = Object.assign({ headless: isHeadless, args: ['--no-sandbox'] }, puppeteerArgs)
  const browser = await puppeteer.launch(args)

  if (cookies) {
    logger.info('scrapedin', 'using cookies, login will be bypassed')
  } else if (email && password) {
    logger.info('scrapedin', 'email and password was provided, we\'re going to login...')

    try {
      await login(browser, email, password, logger)
    } catch (e) {
      await browser.close()
      throw e
    }
  } else {
    logger.warn('scrapedin', 'email/password and cookies wasn\'t provided, only public data will be collected')
  }

  const token = await getToken(browser)
  await browser.close()
  return token

  // return (url, waitMs) => profile(browser, cookies, url, waitMs, hasToGetContactInfo)
}

const getToken = async (browser) => {
  logger.info('scrapedin', 'getting user token')

  const linkedin = 'https://www.linkedin.com'
  const page = await browser.newPage()

  await page.goto(linkedin)

  const linkedinCookies = await page.cookies()

  const token = linkedinCookies.find(c => c.name === 'li_at')

  return token && token.value
}
