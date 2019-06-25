import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { withTracker } from 'meteor/react-meteor-data';
import { Players } from '../api/players.js';

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

    this.setUser = this.setUser.bind(this);
    this.startGame = this.startGame.bind(this);
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

  setUser(user) {
    this.setState({
      currentUser: user,
    });
  }

  startGame() {
    this.setState({ gameBegun: true });
  }

  logout() {
    this.setState({ currentUser: null });
  }

  handleChange(event) {
    this.setState({ answer: event.target.value });
  }

  handleUserSubmit(event) {
    event.preventDefault();

    const newUserName = ReactDOM.findDOMNode(this.refs.newUserName).value.trim();

    Players.insert({
      name: newUserName,
      score: 0,
    });

    ReactDOM.findDOMNode(this.refs.newUserName).value = '';
  }

  deletePlayer(id) {
    Players.remove(id);
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
      const playerListItems = this.props.players.map((player) => 
        <li key={player._id}>
          <button onClick={() => {this.setUser(player)}}>{player.name}</button>
          { this.state.currentUser && this.state.currentUser.name == player.name ? <span>!</span> : '' }
          <button onClick={() => {this.deletePlayer(player._id)}}>&times;</button>
        </li>
      );

      return (
        <div className="login-container">
          <h1>Select your name, or add new</h1>
          <ul>
            {playerListItems}
          </ul>
          <form onSubmit={this.handleUserSubmit.bind(this)}>
            <input ref="newUserName" placeholder="New player" />
            <input type="submit" value="Add new player" />
          </form>
          { this.state.currentUser ? <p><button onClick={this.startGame}>All users submitted</button></p> : '' }
        </div>
      );
    }
  }
}

export default withTracker(() => {
  return {
    players: Players.find({}).fetch(),
  };
})(Game);
