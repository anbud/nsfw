var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
var len = 5

var prefetched = []

var generate = function(target) {
	target = target || 'loading'

	var str = ''

	for (var i = 0; i < len; i++) {
		var charIndex = Math.round(Math.random() * chars.length)
		str += chars.charAt(charIndex)
	}

	var url = 'http://i.imgur.com/' + str + 't.jpg'

	$('#' + target).attr('src', url)
}

var prefetch = function(count) {
	for (var i = 0; i < prefetched.length - count, i++) {
		generate('prefetch')
	}
}

var getFirst = function() {
	$.post('http://localhost:3000/api/random', function(data) {
		var d = JSON.parse(data)

		if (d.status === 200) {
			$('#image').attr('src', d.data)
		} else {
			generate()
		}
	})

	prefetch(3)
}

var next = function() {
	if (prefetch.length > 0) {
		$('#image').attr('src', prefetched.pop())

		prefetch(3)
	} else {
		generate()
	}
}

$(document).ready(function() {
	getFirst()
	
	$('#image').on('click', next)

	$('#loading').on('load', function() {
		var obj = $('#loading')

		if (obj.attr('src') === "") {
			return
		}

		if (((obj.width() == 161) && (obj.height() == 81)) || ((obj.width() == 83) && (obj.height() == 22))) {
			generate()
		} else {
			$.post('http://localhost:3000/api/check', {
		    	url: obj.attr('src').slice(0, obj.attr('src').length - 5) + 'm.jpg'
			}, function(data) {
				if (!JSON.parse(data).data) {
					generate()
				} else {
					$('#image').attr('src', obj.attr('src').slice(0, obj.attr('src').length - 5) + '.jpg')
					obj.attr('src', '')
				}
			})
		}
	})

	$('#prefetch').on('load', function() {
		var obj = $('#prefetch')

		if (obj.attr('src') === "") {
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
				}
			})
		}
	})
})
