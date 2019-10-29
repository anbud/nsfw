const apiUrl = 'http://localhost:3200' // 'https://nsfw.ngrok.io'

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const len = 5
const prefCount = 10

let prefetched = []
let prefetchedApi = []

let order = []
let index = -1

let generationActive = false
let currentOverlay = ''

let model
let modelLoaded = false

const getCode = (url, fullSize) => {
	return url.replace(/http[s|]\:\/\/i\.imgur\.com\//, '').slice(0, fullSize ? -4 : -5)
}

const prefetch = (count = 10) => {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest()

		request.open('POST', `${apiUrl}/api/random`, true)

		request.onload = function() {
			data = JSON.parse(this.response)

			if (data.status === 200) {
				if (!~order.indexOf(data.data) || Math.random() > 0.4) {
					prefetchedApi.push(...data.data)

					resolve()
				}
			}
		}

		request.onerror = () => reject({
			error: 'Invalid request.'
		})

		request.send(JSON.stringify({
			last: prefetchedApi[prefetchedApi.length - 1],
			count: count
		}))
	})
}

const generate = target => {
	if (!modelLoaded) {
		return
	}

	generationActive = true

	let str = ''

	for (let i = 0; i < len; i++) {
		str += chars.charAt(Math.round(Math.random() * chars.length))
	}

	document.getElementById(target).src = `https://i.imgur.com/${str}b.jpg`
}

const persistData = (key, value) => {
	try {
		if (localStorage) {
			localStorage.setItem(key, value)
		} else {
			let expires = new Date()

	        expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000))
	        document.cookie = `${key}=${value};expires=${expires.toUTCString()}`
		}
	} catch (e) {}
}

const loadData = key => {
	if (localStorage) {
		let url = localStorage.getItem(key)

		if (url) {
			return url
		}
	} else {
		let cookie = document.cookie.match(`(^|;) ?${key}=([^;]*)(;|$)`)

		if (cookie && cookie[2]) {
			return cookie[2]
		}
	}
}

const setImage = (code, move) => {
	document.getElementById('image').src = `https://i.imgur.com/${code}.jpg`

	if (!move) {
		order.push(code)
		index++
	}

	if (index <= 0) {
		document.querySelector('.prev').style.display = 'none'
	} else {
		document.querySelector('.prev').style.display = 'block'
	}
}

const loadModel = () => {
	nsfwjs.load('/model/').then(m => {
		model = m

		modelLoaded = true

		generate('prefetch')
	})
}

const next = () => {
	if (index >= order.length - 1) {
		if (prefetched.length > 0) {
			setImage(prefetched.shift())

			if (prefetched.length < prefCount && !generationActive) {
				generate('prefetch')
			}
		} else if (prefetchedApi.length > 0) {
			setImage(prefetchedApi.shift())

			if (prefetchedApi.length < prefCount) {
				prefetch(prefCount - prefetchedApi.length)
			}		
		} else {
			prefetch().then(data => {
				setImage(prefetchedApi.shift())
			})
		}
	} else {
		setImage(order[++index], true)
	}
}

const prev = () => {
	if (order.length > 0 && index > 0) {
		setImage(order[--index], true)
	}
}

const download = () => {
	const url = document.querySelector('#image').src
	const link = document.createElement('a')
	link.href = url
	link.download = url

	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}

const showOverlay = name => {
	if (!currentOverlay) {
		currentOverlay = name

		document.querySelector(`#${name}`).style.display = 'block'
		document.querySelector('.container').style.display = 'none'
		document.querySelector('.overlay').style.display = 'flex'
	}
}

const hideOverlay = () => {
	if (currentOverlay) {
		document.querySelector(`#${currentOverlay}`).style.display = 'none'
		document.querySelector('.overlay').style.display = 'none'
		document.querySelector('.container').style.display = 'flex'

		window.location.hash = ''

		currentOverlay = ''
	}
}

const showDialog = () => {
	showOverlay('over18')

	document.querySelector('#over18-yes').addEventListener('click', () => {
		persistData('over18', 'true')

		hideOverlay()

		init()
	})

	document.querySelector('#over18-no').addEventListener('click', () => {
		persistData('over18', 'false')

		window.location = 'https://google.rs/'
	})
}

const init = () => {
	if (!!loadData('over18')) {
		prefetch()
		loadModel()
		
		let code = loadData('last')

		if (code) {
			setImage(code)
		} else {
			next()
		}

		if (window.location.hash) {
			if (window.location.hash === '#tos') {
				showOverlay('tos')
			} else if (window.location.hash === '#about') {
				showOverlay('about')
			} else if (window.location.hash === '#privacy') {
				showOverlay('privacy')
			}
		}
	} else {
		showDialog()
	}
}

document.addEventListener('DOMContentLoaded', () => {
	init()
	
	document.querySelector('.next').addEventListener('click', event => {
		event.preventDefault()

		next()
	})

	document.querySelector('.prev').addEventListener('click', event => {
		event.preventDefault()

		prev()
	})

	document.querySelector('.x').addEventListener('click', event => {
		event.preventDefault()

		hideOverlay()
	})

	document.querySelector('#btn-about').addEventListener('click', event => {
		event.preventDefault()

		showOverlay('about')
		window.location.hash = '#about'
	})

	document.querySelector('#btn-tos').addEventListener('click', event => {
		event.preventDefault()

		showOverlay('tos')
		window.location.hash = '#tos'
	})

	document.querySelector('#btn-privacy').addEventListener('click', event => {
		event.preventDefault()

		showOverlay('privacy')
		window.location.hash = '#privacy'
	})

	document.querySelector('#btn-download').addEventListener('click', event => {
		event.preventDefault()

		download()
	})

	document.querySelector('#prefetch').addEventListener('error', () => {
		generate('prefetch')
	})

	document.querySelector('#image').addEventListener('load', event => {
		persistData('last', getCode(event.target.src, true))
	})

	document.querySelector('#prefetch').addEventListener('load', event => {
		if (event.target.src === '') {
			generate('prefetch')
		}

		if ((event.target.naturalWidth === 161 && event.target.naturalHeight === 81)) {
			generate('prefetch')
		} else {
			let code = getCode(event.target.src)

		    model.classify(event.target, 1).then(predictions => {
		      	if (predictions[0].className === 'Porn') {
		      		prefetched.push(code)

		      		const request = new XMLHttpRequest()

					request.open('POST', `${apiUrl}/api/save`, true)
					request.send(JSON.stringify({
						code: code
					}))

					if (prefetched.length < prefCount) {
						generate('prefetch')
					} else {
						generationActive = false
					}
		      	} else {
		      		generate('prefetch')
		      	}
		    })
		}
	})
})

document.addEventListener('keydown', event => {
	if(event.which === 37) {
		prev()
	} else if(event.which === 39) {
		next()
	} else if (event.keyCode === 27) {
		hideOverlay()
	} else if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
        case 'a':
            event.preventDefault()
            showOverlay('about')
            break
        case 'o':
            event.preventDefault()
            download()
            break
        }
    }
})