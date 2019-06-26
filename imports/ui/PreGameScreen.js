import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class StartGameButton extends Component {
  render() {
    if (this.props.show) {
      return (
        <p><button onClick={this.props.startGame}>All users submitted</button></p>
      );
    } else return null;
  }
}

export default class PreGameScreen extends Component {
  handleUserSubmit(event) {
    event.preventDefault();

    const newUserName = ReactDOM.findDOMNode(this.refs.newUserName).value.trim();
    this.props.createPlayer(newUserName);
    ReactDOM.findDOMNode(this.refs.newUserName).value = '';
  }

  render() {
    const playerListItems = this.props.players.map((player) => {
      let userSelected = this.props.currentUser && this.props.currentUser._id == player._id;
      return (
        <li key={player._id}>
          <button 
              className={ userSelected ? 'selected' : '' }
              onClick={() => {this.props.setUser(player)}}>
            {player.name}
          </button>
          <button onClick={() => {this.props.deletePlayer(player)}}>&times;</button>
        </li>
      );
    });

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

        <StartGameButton
          startGame={this.props.startGame}
          show={!!this.props.currentUser} />
      </div>
    );
  }
}
