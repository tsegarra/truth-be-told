import React, { Component } from 'react';

import { withTracker } from 'meteor/react-meteor-data';
import { Players } from '../api/players.js';

import PreGameScreen from './PreGameScreen.js';

class Game extends Component {
  constructor(props) {
    super(props);

    this.state = {
      youHaveAnswered: false,
      answer: '',
      currentUser: null,
      gameBegun: false,
      turnId: 0,
    };

    this.persistAnswer = this.persistAnswer.bind(this);
    this.logout = this.logout.bind(this);
    this.nextTurn = this.nextTurn.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  nextTurn() {
    this.setState((state) => {
      return {
        turnId: (state.turnId + 1) % this.props.players.length
      }
    });
  }

  logout() {
    this.setState({ currentUser: null });
  }

  handleChange(event) {
    this.setState({ answer: event.target.value });
  }

  persistAnswer() {
    Players.update(this.state.currentUser._id, {
      $set: { answer: this.state.answer },
    });
  }

  render() {
    if (this.state.currentUser && this.state.gameBegun) {
      const playerList = this.props.players.map((player) =>
        <li key={player._id} className={ this.state.currentUser._id == player._id ? 'me' : '' }>
          {player.name} ({player.score})
          [{player.answer}]
        </li>
      );

      return (
        <div className="game-container">
          <h3>{this.props.players[this.state.turnId].name}'s turn</h3>

          <div className="card">
            <p>I would go back to school for ______.</p>
          </div>

          { !this.state.youHaveAnswered ?
            <div><input
              value={this.state.answer}
              onChange={this.handleChange}
              placeholder={this.props.players[this.state.turnId]==this.state.me ? "Type your answer here" : "Type an answer for " + this.props.players[this.state.turnId].name + " here" }
              />
            <button onClick={this.persistAnswer}>Save</button></div> :
            <div>
              <h3>Answer: {this.state.answer}</h3>
              <button onClick={() => {this.setState({ youHaveAnswered: false }); }}>Edit Answer</button>
            </div>
          }

          <p>Still waiting for answers from Tom, Ryan, and Ajma.</p>

          <h3>Score</h3>
          <ul>
            {playerList}
          </ul>

          <button onClick={this.nextTurn}>Next turn</button>
          <button onClick={this.logout}>Log out</button>
        </div>
      );
    } else {
      return (
        <PreGameScreen
          players={this.props.players}
          currentUser={this.state.currentUser}
          setUser={(user) => {this.setState({ currentUser: user })}}
          deletePlayer={(player) => {Players.remove(player._id)}}
          createPlayer={(name) => {Players.insert({name: name, score: 0})}}
          startGame={() => {this.setState({ gameBegun: true })}}
          />
      );
    }
  }
}

export default withTracker(() => {
  return {
    players: Players.find({}).fetch(),
  };
})(Game);
