import React, { Component } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

const TINY_FACE_DETECTOR = 'tiny_face_detector'

function getCurrentFaceDetectionNet() {
  return faceapi.nets.ssdMobilenetv1

}

function isFaceDetectionModelLoaded() {
  return !!getCurrentFaceDetectionNet().params
}

function getFaceDetectorOptions(minConfidence) {
  return new faceapi.SsdMobilenetv1Options({ minConfidence })
}



class App extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.video = React.createRef();
    this.time = React.createRef()
    this.fips = React.createRef();
    this.state = {
      minConfidence: 0.8,
      withBoxes: true,
      withFaceLandmarks: true,
      forwardTimes: [],
      avgTimeInMs: '',
    }
  }

  updateTimeStats(timeInMs) {
    const { forwardTimes } = this.state;
    const newForwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30)
    const avgTimeInMs = newForwardTimes.reduce((total, t) => total + t) / newForwardTimes.length
    this.setState({
      forwardTimes: newForwardTimes,
      avgTimeInMs
    })
  }

  async onPlay() {
    const videoEl = this.video.current;
    const { withBoxes, withFaceLandmarks, minConfidence } = this.state;
    if (!videoEl.currentTime || videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
      return setTimeout(() => this.onPlay(videoEl))

    console.log('play')
    const options = getFaceDetectorOptions(minConfidence)
    console.log(options, 'options')

    const ts = Date.now()

    const drawBoxes = withBoxes
    const drawLandmarks = withFaceLandmarks

    let task = faceapi.detectAllFaces(videoEl, options)
    task = withFaceLandmarks ? task.withFaceLandmarks() : task
    const results = await task.withFaceExpressions()

    this.updateTimeStats(Date.now() - ts)

    const canvas = this.canvas.current
    const dims = faceapi.matchDimensions(canvas, videoEl, true)

    const resizedResults = faceapi.resizeResults(results, dims)
    if (drawBoxes) {
      faceapi.draw.drawDetections(canvas, resizedResults)
    }
    if (drawLandmarks) {
      faceapi.draw.drawFaceLandmarks(canvas, resizedResults)
    }
    faceapi.draw.drawFaceExpressions(canvas, resizedResults)
    setTimeout(() => this.onPlay(videoEl))
  }

  async run() {
    // load face detection and face landmark models
    // await changeFaceDetector(TINY_FACE_DETECTOR)
    await [faceapi.loadFaceDetectionModel('/'), faceapi.loadFaceLandmarkModel('/'), faceapi.loadFaceExpressionModel('/')]

    // changeInputSize(416)

    // start processing frames
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
    const videoEl = this.video.current
    videoEl.srcObject = stream
  }

  componentDidMount() {
    this.run()
  }

  render() {
    const { avgTimeInMs } = this.state;
    return (
      <div className="App">
        <div className="video-container">
          <video ref={this.video} onLoadedMetadata={this.onPlay} autoPlay muted></video>
          <canvas ref={this.canvas} id="overlay" />
        </div>
        <div>
          <span>{`${Math.round(avgTimeInMs)} ms`}</span>
          <span>{`${faceapi.round(1000 / avgTimeInMs)}`}</span>
        </div>
      </div>
    );
  }
}

export default App;
