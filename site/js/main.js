const apiUrl = 'http://localhost:3200' // 'https://nsfw.ngrok.io'

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const prefCount = 10

let prefetched = []
let prefetchedApi = []

let order = []
let index = -1

let generationActive = false
let currentOverlay = ''

let canDelegateToWorker = typeof OffscreenCanvas !== 'undefined'

let model
let modelLoaded = false

let worker

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')
canvas.width = 160
canvas.height = 160

const getCode = (url, fullSize) => {
    return url
        .replace(/http[s|]\:\/\/i\.imgur\.com\//, '')
        .slice(0, fullSize ? -4 : -5)
}

const prefetch = (count = 10) => {
    return new Promise((resolve, reject) => {
        fetch(`${apiUrl}/api/random`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                last: prefetchedApi[prefetchedApi.length - 1],
                count: count,
            }),
        })
            .then(res => {
                if (res.ok) {
                    res.json().then(data => {
                        if (!~order.indexOf(data.data) || Math.random() > 0.4) {
                            prefetchedApi.push(...data.data)

                            resolve()
                        }
                    })
                } else {
                    reject({
                        error: 'Invalid request.',
                    })
                }
            })
            .catch(err => {
                reject({
                    error: 'Invalid request.',
                })
            })
    })
}

const generate = target => {
    if (!modelLoaded) {
        return
    }

    generationActive = true

    let str = ''

    let len = Math.random() < 0.5 ? 5 : 7

    for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const url = `https://i.imgur.com/${str}b.jpg`

    fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
    })
        .then(res => {
            if (res.ok && res.type === 'cors') {
                document.querySelector(`#${target}`).src = url
            } else {
                generate('prefetch')
            }
        })
        .catch(err => {
            generate('prefetch')
        })
}

const persistData = (key, value) => {
    try {
        if (localStorage) {
            localStorage.setItem(key, value)
        } else {
            let expires = new Date()

            expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000)
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
    document.querySelector('#image').src = `https://i.imgur.com/${code}.jpg`

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
    const url = `https://imgur.com/download/${getCode(
        document.querySelector('#image').src,
        true
    )}/`
    const link = document.createElement('a')
    link.href = url
    link._target = 'blank'

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
    if (canDelegateToWorker) {
        worker = new Worker('/js/worker.js')

        worker.addEventListener('message', event => {
            if (event.data.data.loaded) {
                modelLoaded = true

                return generate('prefetch')
            }

            if (event.data.data.result) {
                prefetched.push(event.data.data.code)

                fetch(`${apiUrl}/api/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: event.data.data.code,
                    }),
                })

                if (prefetched.length < prefCount) {
                    generate('prefetch')
                } else {
                    generationActive = false
                }
            } else {
                generate('prefetch')
            }
        })
    } else {
        loadModel()
    }

    if (!!loadData('over18')) {
        prefetch()

        let code = loadData('last')

        if (code) {
            setImage(code)
        } else {
            next()
        }

        if (window.location.hash) {
            if (window.location.hash === '#about') {
                showOverlay('about')
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
        if (event.target.src.includes('/loader.apng')) {
            return
        }

        if (event.target.src === '') {
            generate('prefetch')
        }

        if (
            event.target.naturalWidth === 161 &&
            event.target.naturalHeight === 81
        ) {
            generate('prefetch')
        } else {
            let code = getCode(event.target.src)

            if (canDelegateToWorker) {
                context.clearRect(0, 0, 160, 160)
                context.drawImage(event.target, 0, 0)

                worker.postMessage({
                    img: context.getImageData(
                        0,
                        0,
                        event.target.width,
                        event.target.height
                    ),
                    code: code,
                })
            } else {
                model.classify(event.target, 1).then(predictions => {
                    if (predictions[0].className === 'Porn') {
                        prefetched.push(code)

                        fetch(`${apiUrl}/api/save`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                code: code,
                            }),
                        })

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
        }
    })
})

document.addEventListener('keydown', event => {
    if (event.which === 37) {
        prev()
    } else if (event.which === 39) {
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
