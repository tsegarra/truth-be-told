import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import '../lib/collections.js';

import './main.html';

function getCurrentPlayer() {
  var playerID = Session.get('playerID');
  
  if (playerID) {
    return Players.findOne(playerID);
  }
}

function generateAccessCode() {
  var code = '';
  var possible = 'afghijkloqrsuwxy23456789';

  for (let i = 0; i < 6; i++) {
    code += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return code;
}

function generateNewGame() {
  var game = {
    accessCode: generateAccessCode(),
    state: 'waitingForPlayers',
    currentCard: null,
  };

  var gameID = Games.insert(game);
  game = Games.findOne(gameID);

  return game;
}

function generateNewPlayer(game, name) {
  var player = {
    gameID: game._id,
    name: name,
    turn: false,
    answer: '',
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
    accessCode = accessCode.toLowerCase();

    Session.set('loading', true);

    Meteor.subscribe('games', accessCode, function onReady() {
      Session.set('loading', false);

      var game = Games.findOne({ accessCode: accessCode });

      if (game) {
        Meteor.subscribe('players', game._id);
        player = generateNewPlayer(game, playerName);
        
        Session.set('gameID', game._id);
        Session.set('playerID', player._id);
        Session.set('currentView', 'lobby');
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
});

Template.joinGame.rendered = function(event) {
  resetUserState();

  $('#access-code').focus();
};

Template.lobby.helpers({
  game: function() {
    return getCurrentGame();
  },
  player: function() {
    return getCurrentPlayer();
  },
  players: function() {
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
  },
});

Template.gameView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  card: 'Truth be told, I am a giant ___.',
  myAnswer: function() {
    var answer = Session.get('myAnswer');
    if (answer) return answer;
    return 'no answer yet';
  },
});

Template.gameView.events({
  'submit #card-form': function() {
    var answer = event.target.answer.value;
    if (!answer) return false;

    var player = getCurrentPlayer();
    Players.update(player._id, {$set: {answer: answer}});

    //Session.set('myAnswer', answer);

    // @TODO update the UI depending on whose answers are in.
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
    Session.set('myAnswer', null);
    Session.set('currentView', 'startMenu');
    return;
  }

  if (game.state === 'inProgress') {
    Session.set('currentView', 'gameView');
  } else if (game.state === 'waitingForPlayers') {
    Session.set('currentView', 'lobby');
  }
}

Tracker.autorun(trackGameState);

Router.route('/', function() {
  this.render('main');
  Session.set('currentView', 'startMenu');
});
