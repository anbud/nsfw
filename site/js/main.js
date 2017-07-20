var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
var len = 5
var prefCount = 5

var prefetched = []

var order = []
var index = 0

var generate = function(target) {
	var str = ''

	for (var i = 0; i < len; i++) {
		var charIndex = Math.round(Math.random() * chars.length)
		str += chars.charAt(charIndex)
	}

	var url = 'http://i.imgur.com/' + str + 'b.jpg'

	$('#' + target).attr('src', url)
}

var setImage = function(url) {
	$('#image').attr('src', url)
	order.push(url)
	index++
}

var first = function() {
	generate('prefetch')
	
	if (localStorage) {
		var url = localStorage.getItem('last')

		if (url) {
			setImage(url)
		} else {
			next()
		}
	} else {
		var cookie = document.cookie.match('(^|;) ?last=([^;]*)(;|$)')

		if (cookie && cookie[2]) {
			setImage(cookie[2])
		} else {
			next()
		}
	}
}

var next = function() {
	if (index >= order.length - 1) {
		if (prefetched.length > 0) {
			setImage(prefetched.pop())
		} else {
			$.post('http://localhost:3000/api/random', {
				last: $('#image').attr('src')
			}, function(data) {
				var d = JSON.parse(data)

				if (d.status === 200) {
					setImage(d.data)
				}
			})
		}
	} else {
		$('#image').attr('src', order[++index])
	}
}

var prev = function() {
	if (order.length > 0 && index > 0) {
		$('#image').attr('src', order[--index])
	}
}

$(document).ready(function() {
	first()
	
	$('#next').on('click', next)
	$('#prev').on('click', prev)

	$('#prefetch').on('error', function() {
		generate('prefetch')
	})

	$('#image').on('load', function() {
		try {
			if (localStorage) {
				localStorage.setItem('last', $('#image').attr('src'))
			} else {
				var expires = new Date()
	            expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000))
	            document.cookie = 'last=' + $('#image').attr('src') + ';expires=' + expires.toUTCString()
			}
		} catch (e) {}
	})

	$('#prefetch').on('load', function() {
		var obj = $('#prefetch')

		if (obj.attr('src') === '') {
			return
		}

		if (((obj.naturalWidth() == 161) && (obj.naturalHeight() == 81)) || ((obj.naturalWidth() == 83) && (obj.naturalHeight() == 22))) {
			generate('prefetch')
		} else {
			var ur = obj.attr('src').slice(0, obj.attr('src').length - 5)

			$.post('http://localhost:3000/api/check', {
		    	url: ur + 'm.jpg'
			}, function(data) {
				if (!JSON.parse(data).data) {
					generate('prefetch')
				} else {
					prefetched.push(ur + '.jpg')

					if (prefetched.length < prefCount) {
						generate('prefetch')
					}
				}
			})
		}
	})
})
