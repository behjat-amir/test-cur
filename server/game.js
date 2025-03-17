const { getRandomWord } = require('./words');

class Game {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.currentDrawer = null;
    this.word = null;
    this.timeLeft = 0;
    this.roundDuration = 80; // seconds
    this.timer = null;
    this.roundInProgress = false;
    this.correctGuessers = new Set(); // Set of player IDs who have correctly guessed
  }

  addPlayer(player) {
    this.players.push({
      id: player.id,
      username: player.username,
      userId: player.userId,
      score: 0
    });

    // If this is the first player, make them the drawer
    if (this.players.length === 1) {
      this.currentDrawer = player.id;
      // Start round if not already started
      if (!this.roundInProgress) {
        this.startRound();
      }
    }

    return this.players;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    this.correctGuessers.delete(playerId); // Remove from correct guessers if present
    
    if (this.currentDrawer === playerId) {
      this.endRound();
      if (this.players.length > 0) {
        this.selectNextDrawer();
        this.startRound();
      }
    } else {
      // If a guesser left, check if all remaining players have guessed
      this.checkAllGuessed();
    }

    return this.players;
  }

  startRound() {
    if (this.roundInProgress || this.players.length < 1) return false;

    // Make sure current drawer is still in the game
    const drawerExists = this.players.some(player => player.id === this.currentDrawer);
    if (!drawerExists && this.players.length > 0) {
      console.log('Current drawer not found in players list, selecting new drawer');
      this.selectNextDrawer();
    }

    this.roundInProgress = true;
    this.word = getRandomWord();
    this.timeLeft = this.roundDuration;
    this.correctGuessers.clear(); // Clear correct guessers for new round

    console.log(`Round started with word: ${this.word}, drawer: ${this.currentDrawer}`);

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endRound();
        // Start new round with next drawer
        this.selectNextDrawer();
        this.startRound();
      }
    }, 1000);

    return true;
  }

  endRound() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.roundInProgress = false;
    this.word = null;
    this.timeLeft = 0;
    this.correctGuessers.clear();
  }

  selectNextDrawer() {
    if (this.players.length <= 1) return false;
    
    const currentIndex = this.players.findIndex(player => player.id === this.currentDrawer);
    let nextIndex = (currentIndex + 1) % this.players.length;
    
    // Skip any players who might have disconnected
    while (nextIndex !== currentIndex && !this.players[nextIndex].id) {
      nextIndex = (nextIndex + 1) % this.players.length;
      
      // If we've gone around all players and back to the current drawer, just keep them
      if (nextIndex === currentIndex) {
        break;
      }
    }
    
    // Set the new drawer
    this.currentDrawer = this.players[nextIndex].id;
    console.log(`New drawer selected: ${this.players[nextIndex].username} (${this.currentDrawer})`);
    return true;
  }

  checkGuess(playerId, guess) {
    if (!this.roundInProgress || playerId === this.currentDrawer || !this.word) return false;
    const isCorrect = guess.toLowerCase() === this.word.toLowerCase();
    
    if (isCorrect) {
      this.correctGuessers.add(playerId);
      this.checkAllGuessed();
    }
    
    return isCorrect;
  }

  // Check if all players (except drawer) have guessed correctly
  checkAllGuessed() {
    // Don't check if there's no round in progress
    if (!this.roundInProgress) return false;
    
    // Count guessers (all players except drawer)
    const totalGuessers = this.players.filter(p => p.id !== this.currentDrawer).length;
    
    // Check if all guessers have correctly guessed
    const allGuessed = this.correctGuessers.size === totalGuessers && totalGuessers > 0;
    
    return allGuessed;
  }

  addScore(playerId, points) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.score += points;
    }
  }

  getGameState() {
    return {
      players: this.players,
      currentDrawer: this.currentDrawer,
      timeLeft: this.timeLeft,
      roundDuration: this.roundDuration,
      roundInProgress: this.roundInProgress,
      word: this.word,
      correctGuessers: Array.from(this.correctGuessers)
    };
  }

  isDrawer(playerId) {
    return this.currentDrawer === playerId;
  }
  
  // Get players who haven't guessed correctly yet
  getRemainingGuessers() {
    return this.players
      .filter(p => p.id !== this.currentDrawer && !this.correctGuessers.has(p.id))
      .map(p => p.username);
  }
}

module.exports = Game; 