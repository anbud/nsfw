/* natural.js */
!function(n){for(var t,e=["Width","Height"];t=e.pop();)!function(t,e){n.fn[t]=t in new Image?function(){return this[0][t]}:function(){var n,t,r=this[0];return"img"===r.tagName.toLowerCase()&&((n=new Image).src=r.src,t=n[e]),t}}("natural"+t,t.toLowerCase())}(jQuery);

/* swipe.js */
/**
 * jquery.detectSwipe v2.1.3
 * jQuery Plugin to obtain touch gestures from iPhone, iPod Touch, iPad and Android
 * http://github.com/marcandre/detect_swipe
 * Based on touchwipe by Andreas Waltl, netCU Internetagentur (http://www.netcu.de)
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {

  $.detectSwipe = {
    version: '2.1.2',
    enabled: 'ontouchstart' in document.documentElement,
    preventDefault: false,
    threshold: 20
  };

  var startX,
    startY,
    isMoving = false;

  function onTouchEnd() {
    this.removeEventListener('touchmove', onTouchMove);
    this.removeEventListener('touchend', onTouchEnd);
    isMoving = false;
  }

  function onTouchMove(e) {
    if ($.detectSwipe.preventDefault) { e.preventDefault(); }
    if(isMoving) {
      var x = e.touches[0].pageX;
      var y = e.touches[0].pageY;
      var dx = startX - x;
      var dy = startY - y;
      var dir;
      var ratio = window.devicePixelRatio || 1;
      if(Math.abs(dx) * ratio >= $.detectSwipe.threshold) {
        dir = dx > 0 ? 'left' : 'right'
      }
      else if(Math.abs(dy) * ratio >= $.detectSwipe.threshold) {
        dir = dy > 0 ? 'up' : 'down'
      }
      if(dir) {
        onTouchEnd.call(this);
        $(this).trigger('swipe', dir).trigger('swipe' + dir);
      }
    }
  }

  function onTouchStart(e) {
    if (e.touches.length == 1) {
      startX = e.touches[0].pageX;
      startY = e.touches[0].pageY;
      isMoving = true;
      this.addEventListener('touchmove', onTouchMove, false);
      this.addEventListener('touchend', onTouchEnd, false);
    }
  }

  function setup() {
    this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
  }

  function teardown() {
    this.removeEventListener('touchstart', onTouchStart);
  }

  $.event.special.swipe = { setup: setup };

  $.each(['left', 'up', 'down', 'right'], function () {
    $.event.special['swipe' + this] = { setup: function(){
      $(this).on('swipe', $.noop);
    } };
  });
}));

/* main.js */

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
	return url.replace('https', 'http').replace('http://i.imgur.com/', '').slice(0, fullSize ? -4 : -5)
}

const prefetch = () => {
	$.post(`${apiUrl}/api/random`, {
		last: prefetchedApi[prefetchedApi.length - 1]
	}, data => {
		data = JSON.parse(data)

		if (data.status === 200) {
			if (!~order.indexOf(data.data) || Math.random() > 0.4) {
				prefetchedApi.push(data.data)
			}
		}

		if (prefetchedApi.length < prefCount) {
			prefetch()
		}
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

	let url = `https://i.imgur.com/${str}b.jpg`

	$(`#${target}`).attr('src', url)
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
		let cookie = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)')

		if (cookie && cookie[2]) {
			return cookie[2]
		}
	}
}

const setImage = (code, move) => {
	$('#image').attr('src', '')

	$('#image').fadeOut(100, () => {
		$('#image').attr('src', `https://i.imgur.com/${code}.jpg`)
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

const loadModel = () => {
	nsfwjs.load('/model/').then(m => {
		model = m

		modelLoaded = true
		generate('prefetch')
	})
}

const init = () => {
	loadModel()

	if (!!loadData('over18')) {
		prefetch()
		
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
				prefetch()
			}		
		} else {
			$.post(`${apiUrl}/api/random`, {
				last: getCode($('#image').attr('src'), true)
			}, data => {
				data = JSON.parse(data)

				if (data.status === 200) {
					setImage(d.data)
				}
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

const showOverlay = name => {
	if (!currentOverlay) {
		currentOverlay = name

		$(`#${name}`).show()
		$('.container').hide()
		$('.overlay').fadeIn(300)
		$('.footer .menu').animate({
			'margin-right': '10px'
		})
	}
}

const hideOverlay = () => {
	if (currentOverlay) {
		$(`#${currentOverlay}`).hide()
		$('.overlay').fadeOut(300)
		$('.container').show()
		$('.footer .menu').animate({
			'margin-right': '200px'
		})

		window.location.hash = ''

		currentOverlay = ''
	}
}

const showDialog = () => {
	showOverlay('over18')

	$('#over18-yes').on('click', () => {
		persistData('over18', 'true')

		hideOverlay()

		init()
	})

	$('#over18-no').on('click', () => {
		persistData('over18', 'false')

		window.location = 'https://google.rs/'
	})
}

$(document).ready(() => {
	init()
	
	$('.next').on('click', event => {
		event.preventDefault()

		next()
	})

	$('.prev').on('click', event => {
		event.preventDefault()

		prev()
	})

	$('.x').on('click', event => {
		event.preventDefault()

		hideOverlay()
	})

	$('#btn-about').on('click', event => {
		event.preventDefault()

		showOverlay('about')
		window.location.hash = '#about'
	})

	$('#btn-tos').on('click', event => {
		event.preventDefault()

		showOverlay('tos')
		window.location.hash = '#tos'
	})

	$('#btn-privacy').on('click', event => {
		event.preventDefault()

		showOverlay('privacy')
		window.location.hash = '#privacy'
	})

	$('#btn-report').on('click', event => {
		event.preventDefault()

		showOverlay('report')
	})

	$('#btn-share').on('click', event => {
		event.preventDefault()

		showOverlay('share')
	})

	$('#prefetch').on('error', () => {
		generate('prefetch')
	})

	$('#image').on('load', () => {
		persistData('last', getCode($('#image').attr('src'), true))
	})

	$('#prefetch').on('load', () => {
		let obj = $('#prefetch')

		if (obj.attr('src') === '') {
			return
		}

		if (((obj.naturalWidth() == 161) && (obj.naturalHeight() == 81)) || ((obj.naturalWidth() == 83) && (obj.naturalHeight() == 22))) {
			generate('prefetch')
		} else {
			let code = getCode(obj.attr('src'))

		    model.classify(obj[0], 1).then(predictions => {
		      	if (predictions[0].className === 'Porn') {
		      		prefetched.push(code)

		      		$.post(`${apiUrl}/api/save`, {
		      			code: code
		      		}, data => {})

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

$(document).keydown(event => {
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
        case 'r':
            event.preventDefault()
            showOverlay('report')
            break
        case 's':
            event.preventDefault()
            showOverlay('share')
            break
        }
    }
})

$(document).on('swipeleft', event => {
	event.preventDefault()

	next()
})

$(document).on('swiperight', event => {
	event.preventDefault()

	prev()
})
