import React, { Component } from 'react';
import { Players } from '../api/players.js';
import { withTracker } from 'meteor/react-meteor-data';

import PreGameScreen from './screens/PreGameScreen.js';
import PreRoundScreen from './screens/PreRoundScreen.js';

class GameScreen extends Component {
  render() {
    if (!this.props.currentUser || this.props.phase == "preGame") {
      return (<PreGameScreen
        currentUser={this.props.currentUser}
        setCurrentUser={this.props.setCurrentUser}
        startGame={() => { this.props.setPhase("preRound") }}
      />);
    } else if (this.props.phase == "preRound") {
      return (<PreRoundScreen
        players={this.props.players}
        turnIndex={this.props.turnIndex}
        currentUser={this.props.currentUser}
        logout={() => { this.props.setCurrentUser(null) }}
      />);
    }
    return null;
  }
}

export default withTracker(() => {
  return {
    players: Players.find({}).fetch(),
  };
})(GameScreen);
