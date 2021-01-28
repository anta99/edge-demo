const express = require('express')
const fetch = require('node-fetch')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000

// static
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/assets', express.static(__dirname + 'public/assets'))

// variables
app.set('views', './views')
app.set('view engine', 'ejs')

// routes
app.get('/', async (req, res) => {
	const { NODE_ENV, REGIONS_API, IP_API, TEST_IP } = process.env

	// get client ip
	const remoteAddress =
		req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		(req.connection.socket ? req.connection.socket.remoteAddress : null)

	const ip = NODE_ENV === 'development' ? TEST_IP : remoteAddress

	try {
		// get client ip info
		const client = await getJson(`${IP_API}/${ip}`)
		NODE_ENV === 'development' && console.log(client)

		if (client.status === 'fail') {
			throw new Error(`Can't get IP location, ${client.message}`)
		}

		// get all regions
		const regions = await getJson(REGIONS_API)
		NODE_ENV === 'development' && console.log(regions)

		// response data
		const data = {
			client,
			regions,
		}

		const headers = {
			protocol: req.protocol,
			method: req.method,
			...req.headers,
		}

		const env = Object.keys(process.env)
			.filter(key => !key.startsWith('npm_'))
			.reduce((obj, key) => {
				obj[key] = process.env[key]
				return obj
			}, {})

		res.render('index', { data, headers, env })
	} catch (error) {
		res.send({ error: error.message, ip })
	}
})

app.get('/ping', (req, res) => {
	res.header({ 'Timing-Allow-Origin': '*' })
	res.send('pong')
})

// utils
async function getJson(url) {
	const res = await fetch(url)
	return await res.json()
}

// listener
app.listen(port, () =>
	console.log(`App listening on port: http://localhost:${port}`),
)
