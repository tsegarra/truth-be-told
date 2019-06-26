import React, { Component } from 'react';
import { Players } from '../api/players.js';
import { withTracker } from 'meteor/react-meteor-data';

import PreGameScreen from './PreGameScreen.js';

export class Card extends Component {
  render() {
    if (this.props.drawn) {
      return (
        <div className="card">
          <p>this is your card</p>
        </div>
      );
    } else {
      return (
        <button onClick={this.props.draw}>Draw card</button>
      );
    }
  }
}

export class PreRoundScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cardDrawn: false,
    };
  }

  render() {
    const currentUsersTurn = this.props.players[this.props.turnIndex]._id == this.props.currentUser._id;
    if (currentUsersTurn) {
      return(
        <div>
          <p>It's your turn.</p>
          <Card draw={() => { this.setState({cardDrawn:true}) }} drawn={this.state.cardDrawn} />
          <button onClick={this.props.logout}>Log out</button>
        </div>
      );
    } else {
      return(
        <div>
          <p>Waiting for card to be drawn.</p>
          <button onClick={this.props.logout}>Log out</button>
        </div>
      );
    }
  }
}

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
