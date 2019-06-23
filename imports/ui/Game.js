import React, { Component } from 'react';

import Player from './Player.js';

export default class Game extends Component {
  constructor(props) {
    super(props);

    this.state = {
      score: {
        'Tom': 10,
        'Jill': 15,
        'Ryan': 9,
        'Ajma': 0,
        'Grace': 10,
      },
    };
  }

  render() {
    const playerList = this.props.players.map((player) =>
      <Player
        key={player._id}
        name={player.name}
        score={this.state.score[player.name]}
        turn={this.props.turn==player.name}
        me={this.props.me==player.name} />
    );

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
          {playerList}
        </ul>

        <button onClick={this.props.logout}>Log out</button>
      </div>
    );
  }
}
