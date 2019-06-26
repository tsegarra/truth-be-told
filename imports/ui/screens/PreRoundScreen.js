import React, { Component } from 'react';

class Card extends Component {
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

export default class PreRoundScreen extends Component {
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

