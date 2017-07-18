const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const exec = require('child_process').exec
const Redis = require('ioredis')

const app = express()
const redis = new Redis()

const getCode = url => {
	return url.replace('http://i.imgur.com/', '').slice(0, -5)
}

app.listen(3000)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cors())

app.get('/', (req, res) => {
	res.send('NSFW.rs API Endpoints')
})

app.post('/api/check', (req, res) => {
	if (req.body.url) {
		req.body.url = req.body.url.replace('https', 'http')
		let code = getCode(req.body.url)

		redis.get(code).then(data => {
			if (data === null) {
				exec(`python ./python/classify_nsfw.py --model_def python/nsfw_model/deploy.prototxt --pretrained_model python/nsfw_model/resnet_50_1by2_nsfw.caffemodel ${req.body.url}`, (err, stdout, stderr) => {
					let r = Number(stdout) > 0.5
					redis.set(getCode(req.body.url), r ? 1 : 0)

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
			error: '[400] Missing URL parameter.'
		}))
	}
})


