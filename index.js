import { http } from "@google-cloud/functions-framework"
import { App } from "./app.js"

http("helloHttp", (req, res) => {
  res.send(`Hello ${req.query.name || req.body.name || "World"}!`)
  App()
})
