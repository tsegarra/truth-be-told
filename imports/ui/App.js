import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { withTracker } from 'meteor/react-meteor-data';

import { Players } from '../api/players.js';

import Game from './Game.js';

let loggedIn = false;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      gameBegun: false,
      turnId: 0,
    };

    this.setUser = this.setUser.bind(this);
    this.setAnswer = this.setAnswer.bind(this);
    this.logout = this.logout.bind(this);
    this.nextTurn = this.nextTurn.bind(this);
    this.startGame = this.startGame.bind(this);
  }

  setUser(user) {
    this.setState({
      user: user,
    });
  }

  logout() {
    this.setState({ user: null });
  }

  nextTurn() {
    this.setState((state) => {
      return {
        turnId: (state.turnId + 1) % this.props.players.length
      }
    });
  }

  handleSubmit(event) {
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

  startGame() {
    this.setState({
      gameBegun: true,
    });
  }

  setAnswer(user, answer) {
    Players.update(user._id, {
      $set: { answer: answer },
    });
  }

  render() {
    if (this.state.user && this.state.gameBegun) {
      return (
        <div className="game-container">
          <Game
            players={this.props.players}
            logout={this.logout}
            nextTurn={this.nextTurn}
            me={this.state.user}
            setAnswer={this.setAnswer}
            turn={this.props.players[this.state.turnId].name} />
        </div>
      );
    } else {
      const playerListItems = this.props.players.map((player) => 
        <li key={player._id}>
          <button onClick={() => {this.setUser(player)}}>{player.name}</button>
          { this.state.user && this.state.user.name == player.name ? <span>!</span> : '' }
          <button onClick={() => {this.deletePlayer(player._id)}}>&times;</button>
        </li>
      );

      return (
        <div className="login-container">
          <h1>Select your name, or add new</h1>
          <ul>
            {playerListItems}
          </ul>
          <form onSubmit={this.handleSubmit.bind(this)}>
            <input ref="newUserName" placeholder="New player" />
            <input type="submit" value="Add new player" />
          </form>
          { this.state.user ? <p><button onClick={this.startGame}>All users submitted</button></p> : '' }
        </div>
      );
    }
  }
}

export default withTracker(() => {
  return {
    players: Players.find({}).fetch(),
  };
})(App);
