import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data';
import { Players } from '../api/players.js';

import PreGameScreen from './PreGameScreen.js';
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
    if (this.state.currentUser && this.state.phase == "preRound") {
      return (<GameScreen
        phase={this.state.phase}
        currentUser={this.state.currentUser}
        turnIndex={this.state.turnIndex}
        logout={() => { this.setState({currentUser: null})}}
      />);
    } else {
      return (<PreGameScreen
        currentUser={this.state.currentUser}
        setUser={(user) => {this.setState({ currentUser: user })}}
        startGame={() => {this.setState({ phase: "preRound" })}}
      />);
    }
  }
}
