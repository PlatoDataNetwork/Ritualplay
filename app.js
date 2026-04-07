const express = require('express')
const configureMiddleware = require('./middleware')
const configureRoutes = require('./routes')

const app = express()

configureMiddleware(app)
configureRoutes(app)

module.exports = app