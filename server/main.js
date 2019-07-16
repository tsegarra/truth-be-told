import { Meteor } from 'meteor/meteor';

import '../lib/collections.js';

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
    players.forEach(function(player) {
      // @TODO scores not correct -- there's a race condition here.
      if (!player.isTurn) {
        if (player.vote.isTurn) {
          console.log('adding 1 to ' + player.name + '\'s score which was ' + player.score);
          Players.update(player._id, { $set: {
            score: player.score + 1,
          }});
        }
        console.log('adding 1 to ' + player.vote.name + '\'s score which was ' + player.vote.score);
        Players.update(player.vote._id, { $set: {
          score: player.vote.score + 1,
        }});
      }
    });

    players.forEach(function(player) {
      if (player.score >= 20) {
        // @TODO end game
      }
    });

    Games.update(id, {$set: {
      state: 'results',
    }});
  },
});
