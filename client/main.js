import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import '../lib/collections.js';
import '../lib/cards.js';

import './main.html';

function getCurrentPlayer() {
  var playerID = Session.get('playerID');
  
  if (playerID) {
    return Players.findOne(playerID);
  }
}

function generateAccessCode() {
  var code = '';
  var possible = 'AFGHIJKLOQRSUWXY23456789';

  for (let i = 0; i < 6; i++) {
    code += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return code;
}

function generateNewGame() {
  var game = {
    accessCode: generateAccessCode(),
    state: 'waitingForPlayers',
    card: Cards[Math.floor(Math.random()*Cards.length)],
    cardsBeenRead: false,
    turn: null,
    winners: null,
  };

  var gameID = Games.insert(game);
  game = Games.findOne(gameID);

  return game;
}

function generateNewPlayer(game, name) {
  var player = {
    gameID: game._id,
    name: name,
    isTurn: false,
    answer: null,
    vote: null,
    score: 0,
  };

  var playerID = Players.insert(player);

  return Players.findOne(playerID);
}

function getCurrentGame() {
  var gameID = Session.get('gameID');

  if (gameID) {
    return Games.findOne(gameID);
  }
}

function getAllPlayers() {
  var game = getCurrentGame();
  var currentPlayer = getCurrentPlayer();

  if (!game) {
    return null;
  }

  var players = Players.find({ 'gameID': game._id }, {'sort': {'createdAt': 1}}).fetch();

  players.forEach(function(player) {
    if (player._id === currentPlayer._id) {
      player.isCurrent = true;
    }
  });

  return players;
}

function leaveGame() {
  var player = getCurrentPlayer();
  
  Session.set('currentView', 'startMenu');
  Players.remove(player._id);

  Session.set('playerID', null);
}

function resetUserState() {
  var player = getCurrentPlayer();

  if (player) {
    Players.remove(player._id);
  }

  Session.set('gameID', null);
  Session.set('playerID', null);
  Session.set('playerExists', false);
}

Template.main.helpers({
  whichView: function() {
    return Session.get('currentView');
  },
});

Template.startMenu.events({
  'click #btn-new-game': function() {
    Session.set('currentView', 'createGame');
  },
  'click #btn-join-game': function() {
    Session.set('currentView', 'joinGame');
  },
});

Template.startMenu.rendered = function() {
  resetUserState();
};

Template.createGame.helpers({
  isLoading: function() {
    return Session.get('loading');
  },
});

Template.createGame.rendered = function() {
  $('#player-name').focus();
};

Template.createGame.events({
  'submit #create-game': function(event) {
    var playerName = event.target.playerName.value;

    if (!playerName || Session.get('loading')) {
      return false;
    }

    var game = generateNewGame();
    var player = generateNewPlayer(game, playerName);

    Meteor.subscribe('games', game.accessCode);

    Session.set('loading', true);

    Meteor.subscribe('players', game._id, function onReady() {
      Session.set('loading', false);
      
      Session.set('gameID', game._id);
      Session.set('playerID', player._id);
      Session.set('currentView', 'lobby');
    });

    return false;
  },
  'click .btn-back': function() {
    Session.set('currentView', 'startMenu');
    return false;
  },
});

Template.joinGame.events({
  'submit #join-game': function (event) {
    var accessCode = event.target.accessCode.value;
    var playerName = event.target.playerName.value;

    if (!playerName || Session.get('loading')) {
      return false;
    }

    accessCode = accessCode.trim();
    accessCode = accessCode.toUpperCase();

    Session.set('loading', true);

    Meteor.subscribe('games', accessCode, function onReady() {
      Session.set('loading', false);

      var game = Games.findOne({ accessCode: accessCode });

      if (game) {
        Meteor.subscribe('players', game._id, function onReady() {
          var existingPlayer = Players.findOne({ gameID: game._id, name: playerName });
          if (existingPlayer) {
            if (Session.get('playerExists')) {
              Session.set('gameID', existingPlayer.gameID);
              Session.set('playerID', existingPlayer._id);
              Session.set('currentView', 'lobby');
            } else {
              Session.set('playerExists', true);
            }
          } else {
            player = generateNewPlayer(game, playerName);
            Session.set('gameID', game._id);
            Session.set('playerID', player._id);
            Session.set('currentView', 'lobby');
          }
        });
      } else {
        alert('Invalid access code.');
      }
    });

    return false;
  },
  'click .btn-back': function() {
    Session.set('currentView', 'startMenu');
    return false;
  },
});

Template.joinGame.helpers({
  isLoading: function() {
    return Session.get('loading');
  },
  playerExists: function() {
    return Session.get('playerExists');
  },
});

Template.joinGame.rendered = function(event) {
  resetUserState();

  var urlAccessCode = Session.get('urlAccessCode');
  if (urlAccessCode) {
    $('#access-code').val(urlAccessCode);
    $('#player-name').focus();
  } else {
    $('#access-code').focus();
  }
};

Template.lobby.helpers({
  game: function() {
    return getCurrentGame();
  },
  player: function() {
    return getCurrentPlayer();
  },
  players: function() {
    return getAllPlayers();
  },
  isLoading: function() {
    var game = getCurrentGame();
    return game.state === 'settingUp';
  },
});

Template.lobby.events({
  'click .btn-leave': leaveGame,
  'click .btn-start': function() {
    var game = getCurrentGame();
    Games.update(game._id, {$set: {state: 'settingUp'}});
  },
  'click .btn-remove-player': function(event) {
    var playerID = $(event.currentTarget).data('player-id');
    Players.remove(playerID);
    return false;
  },
  'click .btn-edit-player': function(event) {
    var game = getCurrentGame();
    Session.set('currentView', 'joinGame');
    Session.set('urlAccessCode', game.accessCode);
  },
});

Template.gameView.rendered = function() {
  $('#answer').focus();
};

Template.gameView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  players: getAllPlayers,
});

Template.gameView.events({
  'submit #card-form': function() {
    var answer = event.target.answer.value;
    if (!answer) {
      FlashMessages.sendError('Please enter an answer.');
      return false;
    }

    var player = getCurrentPlayer();
    Players.update(player._id, {$set: {
      answer: answer,
      duplicate: false,
    }});

    return false;
  },
  'click .btn-change-answer': function(event) {
    var player = getCurrentPlayer();
    Players.update(player._id, {$set: {previousAnswer: player.answer}});
    Players.update(player._id, {$set: {answer: null}});
    return false;
  },
});

Template.reviewView.helpers({
  player: getCurrentPlayer,
  players: getAllPlayers,
  game: getCurrentGame,
});

Template.reviewView.events({
  'submit #review-answers': function(event) {
    var game = getCurrentGame();
    var players = getAllPlayers();
    var isDuplicate, anyDuplicates = false;
    players.forEach(function (player) {
      isDuplicate = $('#answer-' + player._id).prop('checked');
      if (isDuplicate) {
        anyDuplicates = true;
        Players.update(player._id, {$set: {
          previousAnswer: player.answer,
          answer: null,
          duplicate: true,
        }});
      }
    });

    if (anyDuplicates) {
      Games.update(game._id, {$set: {
        state: 'inProgress',
      }});
    } else {
      Games.update(game._id, {$set: {
        state: 'voting',
        randomPlayers: _.shuffle(players),
      }});
    }
    return false;
  },
});

Template.voteView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  players: getAllPlayers,
  equals: function(a, b) { return a === b; },
});

Template.voteView.events({
  'click .btn-show-cards': function(event) {
    var game = getCurrentGame();
    Games.update(game._id, {$set: {cardsBeenRead: true}});
    return false;
  },
  'click .btn-vote': function(event) {
    var player = getCurrentPlayer();
    var id = $(event.target).attr('data-id');
    var playerVotedFor = Players.findOne(id);
    Players.update(player._id, {$set: {vote: playerVotedFor}});
    return false;
  },
});

function getWinningMessage() {
  var game = getCurrentGame();
  if (!game.winners || game.winners.length < 1) return null;
  if (game.winners.length == 1) {
    return game.winners[0].name + ' has won.';
  }
  var message = game.winners[0].name;
  for (var i = 1; i < game.winners.length; i++) {
    message += ', ' + game.winners[i].name;
  }
  message += ' have won.';
  return message;
}

Template.resultsView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  players: getAllPlayers,
  winningMessage: getWinningMessage,
  scores: function() {
    var players = getAllPlayers();
    var scores = [], score;
    players.forEach(function(player) {
      score = {};
      score['name'] = player.name;
      score['scores'] = [];
      for (var i = 0; i < 20; i++) {
        score['scores'].push(i < player.score);
      }
      scores.push(score);
    });
    return scores;
  },
});

Template.resultsView.events({
  'click .btn-next-round': function(event) {
    var game = getCurrentGame();
    Games.update(game._id, {$set: {state: 'settingUpNextRound'}});
    return false;
  },
  'click .btn-new-game': function(event) {
    var game = getCurrentGame();
    Games.update(game._id, {$set: {state: 'settingUp'}});
    return false;
  },
});

function trackGameState() {
  var gameID = Session.get('gameID');
  var playerID = Session.get('playerID');
  
  if (!gameID || !playerID) {
    return;
  }

  var game = Games.findOne(gameID);
  var player = Players.findOne(playerID);

  if (!game || !player) {
    Session.set('gameID', null);
    Session.set('playerID', null);
    Session.set('currentView', 'startMenu');
    return;
  }

  if (game.state === 'inProgress') {
    Session.set('currentView', 'gameView');
  } else if (game.state === 'waitingForPlayers') {
    Session.set('currentView', 'lobby');
  } else if (game.state === 'review') {
    Session.set('currentView', 'reviewView');
  } else if (game.state === 'voting') {
    Session.set('currentView', 'voteView');
  } else if (game.state === 'results') {
    Session.set('currentView', 'resultsView');
  }
}

Tracker.autorun(trackGameState);

Router.route('/', function() {
  this.render('main');
  Session.set('currentView', 'startMenu');
});
