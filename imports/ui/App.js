import React, { Component } from 'react';

import Game from './Game.js';

export default class App extends Component {
  render() {
    return (
      <div className="container">
        <Game turn="Ajma" />
      </div>
    );
  }
}
