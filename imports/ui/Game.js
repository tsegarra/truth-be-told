import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Player from './Player.js';

export default class Game extends Component {
  constructor(props) {
    super(props);

    this.state = {
      youHaveAnswered: this.props.answer != '',
      answer: this.props.me.answer,
    };
  }

  handleChange() {
    const answer = ReactDOM.findDOMNode(this.refs.answer).value.trim();

    this.setState({ answer: answer });
  }

  handleSubmit(event) {
    event.preventDefault();

    const answer = ReactDOM.findDOMNode(this.refs.answer).value.trim();

    if (answer != '') {
      this.props.setAnswer(this.props.me, answer);
      this.setState({ youHaveAnswered: true, answer: answer });
    }
  }

  render() {
    const playerList = this.props.players.map((player) =>
      <Player
        key={player._id}
        player={player}
        turn={this.props.turn==player.name}
        me={this.props.me.name==player.name} />
    );

    return (
      <div className="game-container">
        <h3>{this.props.turn}'s turn</h3>

        <div className="card">
          <p>I would go back to school for ______.</p>
        </div>

        { !this.state.youHaveAnswered ?
          <form onSubmit={this.handleSubmit.bind(this)}><input
            ref="answer"
            value={this.state.answer}
            onChange={this.handleChange.bind(this)}
            placeholder={this.props.turn==this.props.me.name ? "Type your answer here" : "Type an answer for " + this.props.turn + " here" } />
          <input type="submit" value="Save" /></form> :
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

        <button onClick={this.props.nextTurn}>Next turn</button>
        <button onClick={this.props.logout}>Log out</button>
      </div>
    );
  }
}
