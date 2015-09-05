'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Mentor = mongoose.model('Mentor'),
  _ = require('lodash');

/**
 * Create a mentor
 */
exports.create = function(req, res) {
  var mentor = new Mentor(req.body);
  mentor.user = req.user;

  mentor.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(mentor);
    }
  });
};

/**
 * Show the current mentor
 */
exports.read = function(req, res) {
  console.log('sagadsgdasgasd');

  res.json(req.mentor);
};

/**
 * Update a mentor
 */
exports.update = function(req, res) {
  var mentor = req.mentor;

  mentor = _.extend(mentor, req.body);

  mentor.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(mentor);
    }
  });
};

/**
 * Delete an mentor
 */
exports.delete = function(req, res) {
  var mentor = req.mentor;

  mentor.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json({
        mentor: mentor,
        status: 'deleted'
      });
    }
  });
};

/**
 * List of Mentors
 */
exports.list = function(req, res) {
  Mentor.find().where({
    role: 'mentor'
  }).sort('-created').populate('user', 'userName').exec(function(err, mentors) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(mentors);
    }
  });
};

/**
 * Mentor middleware
 */
exports.mentorByID = function(req, res, next, id) {
  Mentor.findById(id).populate('user', 'userName').exec(function(err, mentor) {
    if (err) return next(err);
    if (!mentor) return next(new Error('Failed to load mentor ' + id));
    req.mentor = mentor;
    next();
  });
};

exports.getRequests = function(req, res) {
  Mentor.find({_id: req.mentor.id}, {requests: { $elemMatch: {status: 'pending'}}}).populate('requests.from').exec(function(err, mentor) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(mentor);
    }
  });
};

exports.getLearners = function(req, res) {
  Mentor.find({_id: req.mentor.id}, {requests: { $elemMatch: {status: 'accepted'}}}).exec(function(err, mentor) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(mentor);
    }
  });

};

exports.requestMentor = function(req, res) {
  Mentor.findById(req.mentor.id, function(err, mentor) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    if (mentor.requests.length) {
      var match = _.find(mentor.requests, function(request) {
        debugger;
        return request.from.toString() === req.user.id;
      })
      if (typeof match !== 'undefined') {
        return res.status(400).send({
          message: 'You already requested this mentor'
        });
      }
    }
    mentor.requests.push({
      'from': req.user.id,
      'status': 'pending'
    });

    mentor.save(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.status(200).send({
          message: 'Request succesfully sent'
        });
      }
    });

  });
};

exports.acceptRequest = function(req, res) {
  Mentor.find({
    _id: req.mentor.id
  }).select({
    requests: {
      $elemMatch: {
        from: req.user.id,
        status: 'pending'
      }
    }
  }).exec(function(err, mentor) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      mentor.requests = {
        'from': req.user.id,
        'status': 'accepted'
      };

      mentor.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.status(200).send({
            message: 'Request has been accepted'
          });
        }
      });
    }
  });
};

exports.declineRequest = function(req, res, next, id) {
  Mentor.find({
    _id: request.mentor.id
  }).select({
    requests: {
      $elemMatch: {
        from: req.user.id,
        status: 'pending'
      }
    }
  }).exec(function(err, mentor) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      mentor.requests = {
        'from': req.user,
        'status': 'rejected'
      };

      mentor.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.status(200).send({
            message: 'Request has been declined'
          });
        }
      });
    }
  });
};

exports.upvoteMentor = function(req, res) {
  console.log('htii')
    // Mentor.findById(req.mentor.id, function(err, mentor) {
    //   if (err) {
    //     return res.status(400).send({
    //       message: errorHandler.getErrorMessage(err)
    //     });
    //   } else {
    //     mentor.reviews.push(req.user.id);

  //     res.status(200).send({message: 'You have updated your mentor'});
  //   }

  // });
};

exports.downvoteMentor = function(req, res, next, id) {
  Mentor.findById(req.mentor.id, function(err, mentor) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {

      var index = mentor.reviews.indexOf(req.user.id);

      if (index > -1) {

        mentor.reviews.splice(index, 1);
        return res.status(200).send({
          message: 'You have downvoted your mentor'
        });

      } else {
        res.status(403).send({
          message: 'You cannot downcote this user'
        });
      }
    }
  });
};

// * Mentor authorization middleware
// */
exports.hasAuthorization = function(req, res, next) {
  if (req.mentor.id !== req.user.id) {
    return res.status(403).send({
      message: 'User is not authorized'
    });
  }
  next();
};