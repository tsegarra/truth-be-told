import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { withTracker } from 'meteor/react-meteor-data';

import { Players } from '../../api/players.js';

class StartGameButton extends Component {
  render() {
    if (this.props.show) {
      return (
        <p><button onClick={this.props.startGame}>All users submitted</button></p>
      );
    } else return null;
  }
}

class PreGameScreen extends Component {
  deletePlayer(player) {
    Players.remove(player._id);
  }

  createPlayer(name) {
    Players.insert({
      name: name,
      score: 0,
    });
  }

  handleUserSubmit(event) {
    event.preventDefault();

    const newUserName = ReactDOM.findDOMNode(this.refs.newUserName).value.trim();
    this.createPlayer(newUserName);
    ReactDOM.findDOMNode(this.refs.newUserName).value = '';
  }

  render() {
    const playerListItems = this.props.players.map((player) => {
      let userSelected = this.props.currentUser && this.props.currentUser._id == player._id;
      return (
        <li key={player._id}>
          <button 
              className={ userSelected ? 'selected' : '' }
              onClick={() => {this.props.setCurrentUser(player)}}>
            {player.name}
          </button>
          <button onClick={() => {this.deletePlayer(player)}}>&times;</button>
        </li>
      );
    });

    return (
      <div className="login-container">
        <p>Select your name, or add new</p>
        <ul>
          {playerListItems}
        </ul>

        <form onSubmit={this.handleUserSubmit.bind(this)}>
          <input ref="newUserName" placeholder="New player" />
          <input type="submit" value="Add new player" />
        </form>

        <StartGameButton
          startGame={this.props.startGame}
          show={!!this.props.currentUser} />
      </div>
    );
  }
}

export default withTracker(() => {
  return {
    players: Players.find({}).fetch(),
  };
})(PreGameScreen);
