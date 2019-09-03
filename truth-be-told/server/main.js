import { Meteor } from 'meteor/meteor';

import '../lib/collections.js';
import '../lib/cards.js';

function cleanUpGamesAndPlayers() {
  var cutOff = moment().subtract(2, 'hours').toDate().getTime();

  var numGamesRemoved = Games.remove({
    createdAt: {$lt: cutOff}
  });

  var numPlayersRemoved = Players.remove({
    createdAt: {$lt: cutOff}
  });
}

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
        answer: null,
        previousAnswer: null,
        vote: null,
        score: 0,
      }});
      if (index === turnId) {
        turnName = player.name;
      }
    });

    Games.update(id, {$set: {
      state: 'inProgress',
      turn: turnName,
      cardsBeenRead: false,
      dupesExist: false,
    }});
  }
});

Players.find({'answer': {$ne: null} }).observeChanges({
  added: function(id) {
    var currentPlayer = Players.findOne({_id: id});
    var players = Players.find({gameID: currentPlayer.gameID});

    var allAnswersAreIn = true;
    players.forEach(function(player) {
      if (!player.answer) {
        allAnswersAreIn = false;
      }
    });

    if (allAnswersAreIn) {
      Games.update(currentPlayer.gameID, { $set: {
        state: 'review',
      }});
    }
  },
});

Players.find({'vote': {$ne: null} }).observeChanges({
  added: function(id) {
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

    var winners = [];
    players.forEach(function(player) {
      if (player.score >= 20) {
        winners.push(player);
      }
    });

    Games.update(id, {$set: {
      state: 'results',
      winners: winners,
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
        previousAnswer: null,
        vote: null,
        isTurn: index === nextTurnIndex,
      }});
      if (index === nextTurnIndex) turnName = player.name;
    });

    Games.update(id, { $set: {
      card: Cards[Math.floor(Math.random()*Cards.length)],
      cardsBeenRead: false,
      state: 'inProgress',
      dupesExist: false,
      turn: turnName,
    }});
  },
});

var MyCron = new Cron(60000);

MyCron.addJob(5, cleanUpGamesAndPlayers);
