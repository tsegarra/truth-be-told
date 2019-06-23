import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import { Players } from '../api/players.js';

import Game from './Game.js';

let loggedIn = false;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: '',
    };

    this.setUser = this.setUser.bind(this);
    this.logout = this.logout.bind(this);
  }

  setUser(user) {
    this.setState({
      user: user,
    });
  }

  logout() {
    this.setState({ user: ''});
  }

  render() {
    const playerListItems = this.props.players.map((player) => 
      <li key={player._id}><button onClick={() => {this.setUser(player.name)}}>{player.name}</button></li>
    );
    if (this.state.user) {
      return (
        <div className="game-container">
          <Game
            players={this.props.players}
            logout={this.logout}
            me={this.state.user}
            turn="Ajma" />
        </div>
      );
    } else {
      return (
        <div className="login-container">
          <h1>Select your name, or add new</h1>
          <ul>
            {playerListItems}
          </ul>
          <input name="new-username" placeholder="New player" />
          <button>Add new player</button>
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
