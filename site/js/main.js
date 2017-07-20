var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
var len = 5
var prefCount = 5

var prefetched = []

var generate = function(target) {
	var str = ''

	for (var i = 0; i < len; i++) {
		var charIndex = Math.round(Math.random() * chars.length)
		str += chars.charAt(charIndex)
	}

	var url = 'http://i.imgur.com/' + str + 'b.jpg'

	$('#' + target).attr('src', url)
}

var next = function() {
	if (prefetched.length > 0) {
		$('#image').attr('src', prefetched.pop())
	} else {
		$.post('http://localhost:3000/api/random', {
			last: $('#image').attr('src')
		}, function(data) {
			var d = JSON.parse(data)

			if (d.status === 200) {
				$('#image').attr('src', d.data)
			}
		})
	}
}

$(document).ready(function() {
	generate('prefetch')
	next()
	
	$('#image').on('click', next)

	$('#prefetch').on('error', function() {
		generate('prefetch')
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
