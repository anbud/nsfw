var apiUrl = 'http://localhost:3000'

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
var len = 5
var prefCount = 10

var prefetched = []
var prefetchedApi = []

var order = []
var index = -1

var generationActive = false

var getCode = function(url, fullSize) {
	return url.replace('https', 'http').replace('http://i.imgur.com/', '').slice(0, fullSize ? -4 : -5)
}

var prefetch = function() {
	$.post(apiUrl + '/api/random', {
		last: prefetchedApi[prefetchedApi.length - 1]
	}, function(data) {
		var d = JSON.parse(data)

		if (d.status === 200) {
			if (!~order.indexOf(d.data) || Math.random() > 0.4) {
				prefetchedApi.push(d.data)
			}
		}

		if (prefetchedApi.length < prefCount) {
			prefetch()
		}
	})
}

var generate = function(target) {
	generationActive = true

	var str = ''

	for (var i = 0; i < len; i++) {
		var charIndex = Math.round(Math.random() * chars.length)
		str += chars.charAt(charIndex)
	}

	var url = 'http://i.imgur.com/' + str + 'b.jpg'

	$('#' + target).attr('src', url)
}

var persistData = function(key, value) {
	try {
		if (localStorage) {
			localStorage.setItem(key, value)
		} else {
			var expires = new Date()

	        expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000))
	        document.cookie = key + '=' + value + ';expires=' + expires.toUTCString()
		}
	} catch (e) {}
}

var loadData = function(key) {
	if (localStorage) {
		var url = localStorage.getItem(key)

		if (url) {
			return url
		}
	} else {
		var cookie = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)')

		if (cookie && cookie[2]) {
			return cookie[2]
		}
	}
}

var setImage = function(code, move) {
	$('#image').attr('src', '')
	$('#image').fadeOut(100, function() {
		$('#image').attr('src', 'http://i.imgur.com/' + code + '.jpg')
		$('#image').fadeIn(500)
	})
	
	if (!move) {
		order.push(code)
		index++
	}

	if (index <= 0) {
		$('.prev').hide()
	} else {
		$('.prev').show()
	}
}

var showDialog = function() {
	persistData('over18', 'true')

	init()
}

var init = function() {
	if (!!loadData('over18')) {
		generate('prefetch')
		prefetch()
		
		var code = loadData('last')

		if (code) {
			setImage(code)
		} else {
			next()
		}
	} else {
		showDialog()
	}
}

var next = function() {
	if (index >= order.length - 1) {
		if (prefetched.length > 0) {
			setImage(prefetched.shift())

			if (prefetched.length < prefCount && !generationActive) {
				generate('prefetch')
			}
		} else if (prefetchedApi.length > 0) {
			setImage(prefetchedApi.shift())

			if (prefetchedApi.length < prefCount) {
				prefetch()
			}		
		} else {
			$.post(apiUrl + '/api/random', {
				last: getCode($('#image').attr('src'), true)
			}, function(data) {
				var d = JSON.parse(data)

				if (d.status === 200) {
					setImage(d.data)
				}
			})
		}
	} else {
		setImage(order[++index], true)
	}
}

var prev = function() {
	if (order.length > 0 && index > 0) {
		setImage(order[--index], true)
	}
}

$(document).ready(function() {
	init()
	
	$('.next').on('click', next)
	$('.prev').on('click', prev)

	$('#prefetch').on('error', function() {
		generate('prefetch')
	})

	$('#image').on('load', function() {
		persistData('last', getCode($('#image').attr('src'), true))
	})

	$('#prefetch').on('load', function() {
		var obj = $('#prefetch')

		if (obj.attr('src') === '') {
			return
		}

		if (((obj.naturalWidth() == 161) && (obj.naturalHeight() == 81)) || ((obj.naturalWidth() == 83) && (obj.naturalHeight() == 22))) {
			generate('prefetch')
		} else {
			var code = getCode(obj.attr('src'))

			$.post(apiUrl + '/api/check', {
		    	code: code
			}, function(data) {
				if (!JSON.parse(data).data) {
					generate('prefetch')
				} else {
					prefetched.push(code)

					if (prefetched.length < prefCount) {
						generate('prefetch')
					} else {
						generationActive = false
					}
				}
			})
		}
	})
})

$(document).keydown(function(event) {
	if(event.which === 37) {
		prev()
	} else if(event.which === 39) {
		next()
	}
})
