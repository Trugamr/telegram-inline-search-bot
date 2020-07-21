// Environment variables setup
require('dotenv').config()

const Telegraf = require('telegraf')
const axios = require('axios')
const { TELEGRAM_BOT_TOKEN, PIXABAY_API_KEY } = process.env

const bot = new Telegraf(TELEGRAM_BOT_TOKEN)

bot.command(['start', 'help'], ctx => {
  const message = `
Welcome to Search BOT!
Use the inline mode below
@truSeachBOT p <search image>
@truSeachBOT w <search wiki>
`
  ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Search Pixabay Image',
            switch_inline_query_current_chat: 'p '
          }
        ],
        [
          {
            text: 'Search Wiki Article',
            switch_inline_query_current_chat: 'w '
          }
        ]
      ]
    }
  })
})

// Inline query
bot.inlineQuery(['start', 'help'], ctx => {
  const message = `
Welcome to Search BOT!
Use the inline mode below
@truSeachBOT p <search image>
@truSeachBOT w <search wiki>
  `
  const results = [
    {
      type: 'article',
      id: 1,
      title: 'Help Reference',
      input_message_content: {
        message_text: message
      },
      description: 'Sends help message on how to use the BOT',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Search Pixabay Image',
              switch_inline_query_current_chat: 'p '
            }
          ],
          [
            {
              text: 'Search Wiki Article',
              switch_inline_query_current_chat: 'w '
            }
          ]
        ]
      }
    }
  ]

  ctx.answerInlineQuery(results)
})

bot.inlineQuery(/w\s.+/, async ctx => {
  const query = ctx.inlineQuery.query.split(' ').splice(1).join(' ')

  try {
    const response = await axios({
      url: 'https://en.wikipedia.org/w/api.php',
      params: {
        action: 'opensearch',
        format: 'json',
        limit: 20,
        search: query
      }
    })

    const data = response.data
    const titles = data[1]
    const links = data[3]

    if (!titles) return

    const results = titles.map((title, index) => ({
      type: 'article',
      id: index,
      title,
      input_message_content: {
        message_text: `${title}\n${links[index]}`
      },
      description: links[index],
      reply_markup: {
        inline_keyboard: [
          [{ text: `Share ${title}`, switch_inline_query: title }]
        ]
      }
    }))

    ctx.answerInlineQuery(results)
  } catch (error) {
    console.log('FAILED TO GET WIKI ARTICLES', error)
  }
})

bot.inlineQuery(/p\s.+/, async ctx => {
  const query = ctx.inlineQuery.query.split(' ').splice(1).join(' ')

  try {
    const response = await axios({
      method: 'GET',
      url: 'https://pixabay.com/api/',
      params: {
        key: PIXABAY_API_KEY,
        q: encodeURI(query),
        image_type: 'photo'
      }
    })

    const data = response.data
    const images = data.hits
    const results = images.map((image, index) => ({
      type: 'photo',
      id: index,
      thumb_url: image.previewURL,
      photo_url: image.webformatURL,
      caption: `[Source](${image.webformatURL})\n[Large Image](${image.largeImageURL})`,
      photo_width: 300,
      photo_height: 200,
      parse_mode: 'Markdown'
    }))

    ctx.answerInlineQuery(results)
  } catch (error) {
    console.log('FAILED TO GET PHOTOS', error)
  }
})

// Start polling
bot.launch()
