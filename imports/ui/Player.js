import React, { Component } from 'react';

export default class Player extends Component {
  render() {
    return (
      <li className={ this.props.me ? 'me' : '' }>
        {this.props.name} ({this.props.score})
      </li>
    );
  }
}
