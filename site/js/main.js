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

	var url = 'http://i.imgur.com/' + str + 't.jpg'

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

	generate('prefetch')
}

$(document).ready(function() {
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

		if (((obj.width() == 161) && (obj.height() == 81)) || ((obj.width() == 83) && (obj.height() == 22))) {
			generate('prefetch')
		} else {
			$.post('http://localhost:3000/api/check', {
		    	url: obj.attr('src').slice(0, obj.attr('src').length - 5) + 'm.jpg'
			}, function(data) {
				if (!JSON.parse(data).data) {
					generate('prefetch')
				} else {
					prefetched.push(obj.attr('src').slice(0, obj.attr('src').length - 5) + '.jpg')

					if (prefetched.length < prefCount) {
						generate('prefetch')
					}
				}
			})
		}
	})
})
