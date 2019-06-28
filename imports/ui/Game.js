import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import { GameStateVariables } from '../api/gameStateVariables.js';
import GameScreen from './GameScreen.js';

class Game extends Component {
  constructor(props) {
    super(props);

    if (this.props.gameStateVariables.length < 1) {
      GameStateVariables.insert({
        turnIndex: 0,
        phase: "preGame",
      });
      this.state = {
        currentUser: null,
        phase: "preGame",
        turnIndex: 0,
      };
    } else {
      this.state = {
        currentUser: null,
        phase: this.props.gameStateVariables[0].phase,// || "preGame",
        turnIndex: this.props.gameStateVariables[0].turnIndex,// || 0,
      };
    }
  }

  setPhase(phase) {
    GameStateVariables.update(this.props.gameStateVariables[0]._id, {
      $set: { phase: phase }
    });
  }

  render() {
    return (
      <div>
        <GameScreen
          phase={this.props.gameStateVariables[0].phase}
          currentUser={this.state.currentUser}
          turnIndex={this.state.turnIndex}
          setCurrentUser={(user) => {this.setState({ currentUser: user })}}
          setPhase={(phase) => { this.setPhase(phase) }} />
        <hr />
        <p><strong>Phase:</strong> {this.props.gameStateVariables[0].phase}</p>
        <button onClick={() => {this.setPhase("preGame")}}>Reset game</button>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    gameStateVariables: GameStateVariables.find({}).fetch(),
  };
})(Game);
