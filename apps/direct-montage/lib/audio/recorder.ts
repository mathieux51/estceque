import { toPcm24, wavHeader } from './wav'

/**
 * Runs in the audio thread: copies the microphone's samples in blocks of 4096
 * frames, each with the context frame it was captured at, so the take can be
 * placed exactly against playback (both use the same AudioContext clock).
 */
const WORKLET = `
class TakeRecorder extends AudioWorkletProcessor {
  constructor() {
    super()
    this.chunk = new Float32Array(4096)
    this.filled = 0
    this.first = -1
    this.active = true
    this.port.onmessage = () => {
      this.flush()
      this.active = false
      this.port.postMessage({ done: true })
    }
  }
  flush() {
    if (this.filled === 0) return
    this.port.postMessage({ frame: this.first, data: this.chunk.slice(0, this.filled) })
    this.filled = 0
    this.first = -1
  }
  process(inputs) {
    if (!this.active) return false
    const input = inputs[0] && inputs[0][0]
    if (input) {
      if (this.first < 0) this.first = currentFrame
      this.chunk.set(input, this.filled)
      this.filled += input.length
      if (this.filled + 128 > this.chunk.length) this.flush()
    }
    return true
  }
}
registerProcessor('take-recorder', TakeRecorder)
`

const loaded = new WeakSet<BaseAudioContext>()

export interface Take {
  /** Mono samples at `sampleRate`. */
  samples: Float32Array
  sampleRate: number
  /** Context time, in seconds, at which the first sample reached the context. */
  startTime: number
  /** Delay between the sound in the room and the samples, from the browser. */
  inputLatency: number
}

/** Records the microphone into memory, in the given audio context. */
export class TakeRecorder {
  private chunks: Float32Array[] = []
  private firstFrame = -1
  private finished: Promise<void>
  private markFinished = () => {}
  private analyser: AnalyserNode
  private levelSamples = new Float32Array(1024)

  private constructor(
    private context: AudioContext,
    private stream: MediaStream,
    private source: MediaStreamAudioSourceNode,
    private node: AudioWorkletNode,
    private sink: GainNode
  ) {
    this.finished = new Promise((resolve) => (this.markFinished = resolve))
    node.port.onmessage = (event) => {
      const message = event.data as {
        done?: boolean
        frame?: number
        data?: Float32Array
      }
      if (message.done) {
        this.markFinished()
        return
      }
      if (message.data) {
        if (this.firstFrame < 0) this.firstFrame = message.frame ?? 0
        this.chunks.push(message.data)
      }
    }
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = this.levelSamples.length
    source.connect(this.analyser)
  }

  /** Asks for the microphone, without the voice processing of calls. */
  static async open(context: AudioContext): Promise<TakeRecorder> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    try {
      if (!loaded.has(context)) {
        const url = URL.createObjectURL(
          new Blob([WORKLET], { type: 'text/javascript' })
        )
        try {
          await context.audioWorklet.addModule(url)
        } finally {
          URL.revokeObjectURL(url)
        }
        loaded.add(context)
      }
      const source = context.createMediaStreamSource(stream)
      const node = new AudioWorkletNode(context, 'take-recorder', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
        channelCountMode: 'explicit',
      })
      // The node only runs when connected to the output; it stays silent, so
      // the microphone is never heard (no feedback through the speakers).
      const sink = context.createGain()
      sink.gain.value = 0
      source.connect(node)
      node.connect(sink)
      sink.connect(context.destination)
      return new TakeRecorder(context, stream, source, node, sink)
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop())
      throw error
    }
  }

  /** Peak level of the microphone right now (linear, 1 = full scale). */
  level(): number {
    this.analyser.getFloatTimeDomainData(this.levelSamples)
    let peak = 0
    for (const value of this.levelSamples)
      peak = Math.max(peak, Math.abs(value))
    return peak
  }

  async stop(): Promise<Take> {
    this.node.port.postMessage('stop')
    await Promise.race([
      this.finished,
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ])
    this.release()
    const length = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const samples = new Float32Array(length)
    let offset = 0
    for (const chunk of this.chunks) {
      samples.set(chunk, offset)
      offset += chunk.length
    }
    const settings = this.stream.getAudioTracks()[0]?.getSettings() as
      | (MediaTrackSettings & { latency?: number })
      | undefined
    return {
      samples,
      sampleRate: this.context.sampleRate,
      startTime: Math.max(0, this.firstFrame) / this.context.sampleRate,
      inputLatency: settings?.latency ?? 0,
    }
  }

  /** Stops without keeping anything. */
  cancel() {
    this.node.port.postMessage('stop')
    this.release()
  }

  private release() {
    this.stream.getTracks().forEach((track) => track.stop())
    this.source.disconnect()
    this.analyser.disconnect()
    this.node.disconnect()
    this.sink.disconnect()
  }
}

/** A mono take as a 24-bit WAV file, the way it is kept in the browser. */
export function takeToWav(
  samples: Float32Array,
  sampleRate: number
): ArrayBuffer {
  const header = wavHeader(samples.length, 1, sampleRate, 24)
  const pcm = toPcm24([samples])
  const file = new Uint8Array(header.byteLength + pcm.byteLength)
  file.set(new Uint8Array(header), 0)
  file.set(pcm, header.byteLength)
  return file.buffer
}
