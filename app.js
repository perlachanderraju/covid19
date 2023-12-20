const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const dbpath = path.join(__dirname, 'covid19IndiaPortal.db')
const app = express()
app.use(express.json())
let db = null

const initialiseDBAndServer = async (request, response) => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
initialiseDBAndServer()

function authenticatToken(request, response, next) {
  let jwtcode = null
  const authheader = request.headers['authorization']
  if (authheader !== undefined) {
    jwtcode = authheader.split(' ')[1]
  } else {
    jwt.verify(jwtcode, 'chander', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid Jwt Token')
      } else {
        next()
      }
    })
  }
}

//api1
app.post('/login/', authenticatToken, async (request, response) => {
  const userdetails = request.body
  const {username, password} = userdetails
  const loginQuery = `select * from user
  where username='${username}'`
  const loginarray = await db.get(loginQuery)
  if (loginarray === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const ispasswordMatch = await bcrypt.compare(password, loginarray.password)
    if (ispasswordMatch === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'chander')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

module.exports = app;
