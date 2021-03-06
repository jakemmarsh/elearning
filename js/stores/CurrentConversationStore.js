'use strict';

var Reflux      = require('reflux');

var ChatAPI     = require('../utils/ChatAPI');
var ChatActions = require('../actions/ChatActions');

var CurrentConversationStore = Reflux.createStore({

  init: function() {
    this.conversation = null;

    this.listenTo(ChatActions.openConversation, this.openConversation);
  },

  openConversation: function(courseId, currentUserId, recipientId, cb) {
    cb = cb || function() {};

    console.log('open conversation with course:', courseId, 'recipient:', recipientId);

    ChatAPI.getConversation(courseId, currentUserId, recipientId).then(function(conversation) {
      this.conversation = conversation;
      cb(null, conversation);
      this.trigger(null, conversation);
    }.bind(this)).catch(function(err) {
      this.conversation = null;
      cb(err);
      this.trigger(err);
      console.log('error getting conversation:', err);
    }.bind(this));
  }

});

module.exports = CurrentConversationStore;