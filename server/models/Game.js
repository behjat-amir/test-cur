const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    score: {
      type: Number,
      default: 0
    }
  }],
  rounds: [{
    drawer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    word: String,
    guessedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String,
      timeToGuess: Number
    }],
    startTime: Date,
    endTime: Date
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
});

module.exports = mongoose.model('Game', gameSchema); 