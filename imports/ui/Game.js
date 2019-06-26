import React, { Component } from 'react';

import GameScreen from './GameScreen.js';

export default class Game extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null,
      phase: "preGame",
      turnIndex: 0,
    };
  }

  render() {
    return (<GameScreen
      phase={this.state.phase}
      currentUser={this.state.currentUser}
      turnIndex={this.state.turnIndex}
      setCurrentUser={(user) => {this.setState({ currentUser: user })}}
      setPhase={(phase) => {this.setState({ phase: phase })}}
    />);
  }
}
