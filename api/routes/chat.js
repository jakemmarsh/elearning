'use strict';

var when   = require('when');
var _      = require('lodash');
var models = require('../models');

/* ====================================================== */

exports.getRecipients = function(req, res) {

  var fetchRecipients = function(currentUserId, courseId) {
    var deferred = when.defer();

    models.Enrollment.findAll({
      where: { CourseId: courseId }
    }).then(function(enrollments) {
      models.User.findAll({
        where: { id: _.pluck(enrollments, 'UserId') }
      }).then(function(recipients) {
        // Return all users enrolled in the course except themselves
        deferred.resolve(_.reject(recipients, function(recipient) {
          return recipient.id === currentUserId;
        }));
      }).catch(function(err) {
        deferred.reject({ status: 500, body: err });
      });
    }).catch(function(err) {
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  var userId = 1; // TODO: don't hardcode this, use req.user.id

  fetchRecipients(userId, req.params.courseId).then(function(resp) {
    res.status(200).json(resp);
  }).catch(function(err) {
    res.status(err.status).json({ error: err.body });
  });

};

/* ====================================================== */

exports.getConversation = function(req, res) {

  var fetchConversation = function(courseId, userOneId, userTwoId) {
    var deferred = when.defer();

    models.Conversation.find({
      where: { CourseId: courseId, UserOneId: userOneId, UserTwoId: userTwoId },
      include: [models.Message]
    }).then(function(conversation) {
      if ( !conversation ) {
        deferred.reject({ status: 404, body: 'That conversation could not be found' });
      } else {
        deferred.resolve(conversation);
      }
    }).catch(function(err) {
      console.log('error finding conversation:', err);
      deferred.reject({ status: 500, body: err });
    });

    return deferred.promise;
  };

  fetchConversation(req.params.courseId, req.query.userOne, req.query.userTwo).then(function(resp) {
    res.status(200).json(resp);
  }).catch(function(err) {
    res.status(err.status).json({ error: err.body });
  });

};