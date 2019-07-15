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
