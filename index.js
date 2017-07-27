const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const exec = require('child_process').exec
const Redis = require('ioredis')
const minify = require('express-minify')
const compression = require('compression')

const app = express()
const redis = new Redis()

app.listen(3000)

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
	redis.srandmember('nsfw', 2).then(data => {
		if (data && data.length > 0) {
			data = data.filter(i => i !== req.body.last)

			res.send(JSON.stringify({
				status: 200,
				data: data[0]
			}))
		} else {
			res.send(JSON.stringify({
				status: 404,
				error: '[404] Data not found.'
			}))
		}
	})
})

app.post('/api/check', (req, res) => {
	if (req.body.code) {
		redis.get(req.body.code).then(data => {
			if (data === null) {
				exec(`python ./python/classify_nsfw.py --model_def python/nsfw_model/deploy.prototxt --pretrained_model python/nsfw_model/resnet_50_1by2_nsfw.caffemodel http://i.imgur.com/${req.body.code}m.jpg`, (err, stdout, stderr) => {
					let r = Number(stdout) > 0.5
					redis.set(req.body.code, r ? 1 : 0)

					if (r) {
						redis.sadd('nsfw', req.body.code)
					}

					res.send(JSON.stringify({
				    	status: 200,
				   		data: r
				    }))
				})
			} else {
				res.send(JSON.stringify({
				    status: 200,
				   	data: data === 1
				}))
			}
		})
	} else {
		res.send(JSON.stringify({
			status: 400,
			error: '[400] Missing code parameter.'
		}))
	}
})


