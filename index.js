const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const exec = require('child_process').exec
const Redis = require('ioredis')
const minify = require('express-minify')
const compression = require('compression')

const app = express()
const redis = new Redis()

app.listen(3200)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cors())

app.use(compression())
app.use(minify())
app.use(express.static('site'))

app.get('/', (req, res) => {
	res.send('NSFW.rs API Endpoints')
})

app.post('/api/random', (req, res) => {
	redis.srandmember('nsfw', Number(req.body.count || 10) + 1).then(data => {
		if (data && data.length > 0) {
			data = data.filter(i => i !== req.body.last)

			res.send(JSON.stringify({
				status: 200,
				data: data
			}))
		} else {
			res.send(JSON.stringify({
				status: 404,
				error: '[404] Data not found.'
			}))
		}
	})
})

app.post('/api/save', (req, res) => {
	if (req.body.code) {
		redis.sadd('nsfw', req.body.code)

		res.send(JSON.stringify({
			status: 200,
			data: true
	    }))
	} else {
		res.send(JSON.stringify({
			status: 400,
			error: '[400] Missing code parameter.'
		}))
	}
})


