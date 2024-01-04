import OpenAI from "openai"
import axios from "axios"
import "dotenv/config"
import { TwitterApi } from "twitter-api-v2"

// openai const
const openai = new OpenAI({
  apiKey: process.env.OPEN_KEY
})

// wordpress const
const DOMAIN = "wordpress-blog-of-your-preference"
const SITE = `${DOMAIN}/wp-json`
const API_WP = `${SITE}/wp/v2`
const POSTS = `${API_WP}/posts?_embed`
let page = 1
let perPage = 5

// telegram const
const botToken = process.env.TELEGRAM_TOKEN
const chatId = "@noesnoticia"
const url = `https://api.telegram.org/bot${botToken}/sendMessage`

const emojis = ["⚡️", "🇻🇪", "🚨", "⚠️", "🛑", "☀️"]

// facebook
const fb_url = `https://graph.facebook.com/v18.0/${process.env.FB_USER_ID}/feed`

// x
const tw_client = new TwitterApi({
  appKey: process.env.X_KEY,
  appSecret: process.env.X_SKEY,
  accessToken: process.env.X_AT,
  accessSecret: process.env.X_ATS
})
const twitterClient = tw_client.readWrite

const App = async () => {
  try {
    const response = await fetch(`${POSTS}&page=${page}&per_page=${perPage}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status ${response.status}`)
    }
    const data = await response.json()

    // get caracas time minus 5 minutes
    const actualTime = await axios({
      url: "https://api.api-ninjas.com/v1/worldtime?city=caracas",
      headers: { "X-Api-Key": process.env.NINJA },
      contentType: "application/json"
    })
    const date = await actualTime.data.date
    const time =
      (await actualTime.data.hour) +
      ":" +
      (actualTime.data.minute - 5) +
      ":" +
      actualTime.data.second
    const newFormat = date + "T" + time

    // Print the news got
    await Promise.all(
      data.map(async (item) => {
        let ran = Math.round(Math.random() * 5)
        if (item.date > newFormat && item.status === "publish") {
          if (
            item.categories.includes(55913) ||
            item.categories.includes(55914) ||
            item.categories.includes(55915)
          ) {
            const gptResponse = await openai.chat.completions.create({
              messages: [
                {
                  role: "user",
                  content: `
                  hazme un resumen de no más de 140 caracteres sobre esta noticia sin colocar de donde viene la fuente ni envolver en comillas dobles: ${item.content.rendered}
                  `
                }
              ],
              model: "gpt-3.5-turbo"
            })
            let page_url = "https://noesnoticia.com/"
            let telegram_text = `${emojis[ran]} ${gptResponse.choices[0].message.content}\n \n💙 <a href="${page_url}">noesnoticia_app</a>`
            let tw_text = `${emojis[ran]} ${gptResponse.choices[0].message.content}\n \n💙 ${page_url}`
            let fb_text = `${emojis[ran]} ${gptResponse.choices[0].message.content}`
            axios.post(url, {
              chat_id: chatId,
              text: telegram_text,
              parse_mode: "HTML"
            })
            twitterClient.v2.tweet(tw_text)
            axios.post(fb_url, {
              message: fb_text,
              access_token: process.env.FB_NENAPP_TOKEN,
              link: page_url
            })
          }
        }
      })
    )
  } catch (error) {
    console.log("This is the error:", error)
    throw error
  }
}

export { App }