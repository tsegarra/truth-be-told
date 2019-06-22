import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import { Players } from '../api/players.js';
import Player from './Player.js';

class Game extends Component {
  renderPlayers() {
    return this.props.players.map((player) =>
      <Player key={player._id} player={player} />
    );
  }

  render() {
    return (
      <div className="game-container">
        <h1>{this.props.turn}'s turn</h1>

        <h2>Card</h2>
        <div className="card">
          <p>I would go back to school for ______.</p>
        </div>

        <input name="answer" placeholder="Type your answer here" />

        <p>Still waiting for answers from Tom, Ryan, and Ajma.</p>

        <h3>Score</h3>
        <ul>
          <Player _id="1" name="Tom" score="10" turn="false" me="true" />
          <Player _id="2" name="Jill" score="15" turn="false" />
          <Player _id="3" name="Ryan" score="9" turn="false" />
          <Player _id="4" name="Ajma" score="0" turn="true" />
          <Player _id="5" name="Grace" score="10" turn="false" />
        </ul>
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    players: Players.find({}).fetch(),
  };
})(Game);
