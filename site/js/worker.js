console.warn = () => {} // suppress tfjs warnings

if (typeof OffscreenCanvas !== 'undefined') {
    this.document = {
        readyState: 'complete',
        createElement: () => {
            return new OffscreenCanvas(640, 480)
        },
    }

    this.window = {
        screen: {
            width: 640,
            height: 480,
        },
    }

    this.HTMLVideoElement = OffscreenCanvas
    this.HTMLImageElement = function() {}
    class CanvasMock {
        getContext() {
            return new OffscreenCanvas(0, 0)
        }
    }

    // @ts-ignore
    this.HTMLCanvasElement = CanvasMock
}

importScripts(
    'https://cdn.jsdelivr.net/npm/setimmediate@1.0.5/setImmediate.min.js'
)
importScripts('https://unpkg.com/@tensorflow/tfjs@1.2.8/dist/tf.min.js')
importScripts('https://unpkg.com/nsfwjs@2.1.0/dist/nsfwjs.min.js')

let model
let loaded = false

onmessage = event => {
    if (!loaded) {
        return postMessage({
            error: 'Model not loaded.',
        })
    }

    model.classify(event.data.img, 1).then(predictions => {
        postMessage({
            data: {
                code: event.data.code,
                result: predictions[0].className === 'Porn',
            },
        })
    })
}

this.window.nsfwjs.load('/model/').then(m => {
    model = m

    loaded = true

    postMessage({
        data: {
            loaded: true,
        },
    })
})
