import { Meteor } from 'meteor/meteor';

import '../lib/collections.js';
import '../lib/cards.js';

Meteor.startup(() => {
  Games.remove({});
  Players.remove({});
});

Meteor.publish('games', function(accessCode) {
  return Games.find({ 'accessCode': accessCode });
});

Meteor.publish('players', function(gameID) {
  return Players.find({ 'gameID': gameID });
});

Games.find({'state': 'settingUp'}).observeChanges({
  added: function (id, state) {
    var players = Players.find({gameID: id});
    var turnId = Math.floor(Math.random() * players.count());
    var turnName = '';

    players.forEach(function(player, index) {
      Players.update(player._id, {$set: {
        isTurn: index === turnId,
      }});
      if (index === turnId) {
        turnName = player.name;
      }
    });

    Games.update(id, {$set: {
      state: 'inProgress',
      turn: turnName,
    }});
  }
});

Players.find({'answer': null}).observeChanges({
  // @TODO hand back duplicates only at the end?
  removed: function(id) {
    var currentPlayer = Players.findOne({_id: id});
    var players = Players.find({gameID: currentPlayer.gameID});

    var allAnswersAreIn = true;
    players.forEach(function(player) {
      if (player._id === currentPlayer._id) return false;
      if (player.answer == currentPlayer.answer) {
        var playerToUpdate = currentPlayer.isTurn ? player : currentPlayer;
        Players.update(playerToUpdate._id, {$set: {
          previousAnswer: playerToUpdate.answer,
          answer: null,
          duplicate: true,
        }});
        allAnswersAreIn = false;
        return;
      }
      if (!player.answer) allAnswersAreIn = false;
    });

    if (allAnswersAreIn) {
      Games.update(currentPlayer.gameID, { $set: {
        state: 'voting',
      }});
    }
  },
});

Players.find({'vote': null}).observeChanges({
  removed: function(id) {
    var currentPlayer = Players.findOne({_id: id});
    var numPlayersWithoutVotes = Players.find({gameID: currentPlayer.gameID, 'vote': null}).count();
    if (numPlayersWithoutVotes <= 1) {
      Games.update(currentPlayer.gameID, { $set: {
        state: 'scoring',
      }});
    }
  },
});

Games.find({'state': 'scoring'}).observeChanges({
  added: function (id, state) {
    var players = Players.find({gameID: id});
    var scores = {};
    players.forEach(function(player) {
      scores[player._id] = player.score;
    });
    players.forEach(function(player) {
      if (!player.isTurn) {
        if (player.vote.isTurn) scores[player._id]++;
        scores[player.vote._id]++;
      }
    });
    var playerIds = Object.keys(scores);
    for (var i = 0; i < playerIds.length; i++) {
      Players.update(playerIds[i], { $set: {
        score: scores[playerIds[i]],
      }});
    }

    // @TODO allow multiple winners
    var winner = null;
    players.forEach(function(player) {
      if (player.score >= 20) {
        winner = player;
      }
    });

    Games.update(id, {$set: {
      state: 'results',
      winner: winner,
    }});
  },
});

Games.find({'state': 'settingUpNextRound'}).observeChanges({
  added: function (id, state) {
    var players = Players.find({ 'gameID': id }, {'sort': {'createdAt': 1}});
    var turnIndex, nextTurnIndex;
    players.forEach(function(player, index) {
      if (player.isTurn) turnIndex = index;
    });
    nextTurnIndex = (turnIndex + 1) % players.count();

    var turnName;
    players.forEach(function(player, index) {
      Players.update(player._id, { $set: {
        answer: null,
        vote: null,
        isTurn: index === nextTurnIndex,
      }});
      if (index === nextTurnIndex) turnName = player.name;
    });

    Games.update(id, { $set: {
      card: Cards[Math.floor(Math.random()*Cards.length)],
      cardsBeenRead: false,
      state: 'inProgress',
      turn: turnName,
    }});
  },
});
