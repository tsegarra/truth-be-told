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
