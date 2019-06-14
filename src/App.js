import React, { Component } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    console.log(faceapi.nets)
  }

  render() {
    return (
      <div className="App">
        this is for faceapi
      </div>
    );
  }
}

export default App;
