const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const GameModel = require('./models/Game');
const Game = require('./game');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Game state
const games = new Map();
const users = new Map();

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('joinRoom', async ({ roomId, username }) => {
    try {
      socket.join(roomId);
      users.set(socket.id, { username, roomId });
      
      // Create or update user in database
      let user = await User.findOne({ username }).exec();
      if (!user) {
        user = await User.create({ username });
      }
      
      if (!games.has(roomId)) {
        games.set(roomId, new Game(roomId));
        // Create game in database
        await GameModel.create({
          roomId,
          status: 'waiting'
        });
      }
      
      const game = games.get(roomId);
      const players = game.addPlayer({ id: socket.id, username, userId: user._id });
      
      // Update game in database
      await GameModel.findOneAndUpdate(
        { roomId },
        { 
          $push: { 
            players: {
              userId: user._id,
              username,
              score: 0
            }
          }
        }
      ).exec();
      
      io.to(roomId).emit('playerJoined', {
        players,
        message: `${username} joined the room`
      });

      socket.emit('gameState', {
        ...game.getGameState(),
        word: game.currentDrawer === socket.id ? game.word : null
      });

      if (players.length >= 2 && !game.roundInProgress) {
        game.startRound();
        io.to(roomId).emit('gameState', {
          ...game.getGameState(),
          word: null
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });

  // Handle drawing
  socket.on('draw', (data) => {
    const { roomId, type } = data;
    const game = games.get(roomId);
    if (game) {
      // Forward all drawing data to all clients in the room regardless of drawer status
      // This ensures all drawing data is properly shared
      if (game.currentDrawer === socket.id) {
        // If this is from the current drawer, forward to other clients
        socket.to(roomId).emit('drawing', data);
      } else if (type === 'clear') {
        // Allow clear event to be processed by all
        socket.to(roomId).emit('drawing', data);
      }
    }
  });

  // Handle guesses
  socket.on('guess', async ({ roomId, guess }) => {
    try {
      const game = games.get(roomId);
      const user = users.get(socket.id);
      
      if (game && user) {
        if (game.checkGuess(socket.id, guess)) {
          game.addScore(socket.id, 100);
          
          // Update user stats in database
          await User.findOneAndUpdate(
            { username: user.username },
            { 
              $inc: { 
                totalScore: 100,
                wordsGuessed: 1
              }
            }
          ).exec();
          
          // Update game in database
          await GameModel.findOneAndUpdate(
            { roomId },
            {
              $push: {
                'rounds.$[round].guessedBy': {
                  userId: user.userId,
                  username: user.username,
                  timeToGuess: game.roundDuration - game.timeLeft
                }
              }
            },
            {
              arrayFilters: [{ 'round.word': game.word }]
            }
          ).exec();
          
          // Notify everyone about the correct guess
          io.to(roomId).emit('correctGuess', {
            username: user.username,
            scores: game.players
          });
          
          // Check if all players have guessed correctly
          const allGuessed = game.checkAllGuessed();
          
          if (allGuessed) {
            const currentWord = game.word;
            // Send a message that everyone guessed correctly
            io.to(roomId).emit('systemMessage', {
              message: `All players have guessed the word: ${currentWord}!`
            });
            
            // Send round end animation trigger
            io.to(roomId).emit('roundEnd', {
              word: currentWord,
              scores: game.players
            });
            
            // End the current round
            game.endRound();
            
            // Start a new round with the next drawer after a short delay
            setTimeout(async () => {
              game.selectNextDrawer();
              if (game.startRound()) {
                // Get the current drawer's user info
                const drawerSocketId = game.currentDrawer;
                const drawerUser = users.get(drawerSocketId);
                console.log(`New round starting with drawer: ${drawerUser ? drawerUser.username : 'Unknown'} (${drawerSocketId})`);
                
                // Update game in database with new round
                if (drawerUser) {
                  await GameModel.findOneAndUpdate(
                    { roomId },
                    {
                      $push: {
                        rounds: {
                          drawer: drawerUser.userId, // Use userId instead of socket.id
                          word: game.word,
                          startTime: new Date()
                        }
                      }
                    }
                  ).exec();
                }
                
                // Send new round animation trigger
                io.to(roomId).emit('newRound', {
                  drawer: drawerUser ? drawerUser.username : 'Unknown',
                  previousWord: currentWord
                });
                
                // Notify all clients about the new game state
                const gameState = game.getGameState();
                io.to(roomId).emit('gameState', {
                  ...gameState,
                  word: null // Don't send the word to everyone
                });
                
                // Send the word only to the new drawer
                if (drawerSocketId) {
                  io.to(drawerSocketId).emit('gameState', gameState);
                }
              }
            }, 5000); // Increased delay to 5 seconds to show animations
          } else {
            // If not all players have guessed, let the remaining players know how many are left
            const remainingGuessers = game.getRemainingGuessers();
            if (remainingGuessers.length > 0) {
              io.to(roomId).emit('systemMessage', {
                message: `${user.username} guessed correctly! Waiting for ${remainingGuessers.length} more player(s).`
              });
            }
          }
        } else {
          socket.to(roomId).emit('newGuess', {
            username: user.username,
            guess
          });
        }
      }
    } catch (error) {
      console.error('Error handling guess:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      const user = users.get(socket.id);
      if (user) {
        const game = games.get(user.roomId);
        if (game) {
          const players = game.removePlayer(socket.id);
          
          // Update game in database
          if (players.length === 0) {
            await GameModel.findOneAndUpdate(
              { roomId: user.roomId },
              { 
                status: 'finished',
                endedAt: new Date()
              }
            ).exec();
            games.delete(user.roomId);
          } else {
            await GameModel.findOneAndUpdate(
              { roomId: user.roomId },
              { 
                $pull: { 
                  players: { 
                    username: user.username 
                  } 
                } 
              }
            ).exec();
            
            io.to(user.roomId).emit('playerLeft', {
              players,
              message: `${user.username} left the room`
            });
            
            if (game.roundInProgress) {
              io.to(user.roomId).emit('gameState', {
                ...game.getGameState(),
                word: null
              });
            }
          }
        }
        users.delete(socket.id);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// API Routes
app.get('/api/users/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .sort('-totalScore')
      .limit(10)
      .select('username totalScore wordsGuessed gamesPlayed')
      .exec();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

app.get('/api/users/:username/stats', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username totalScore wordsGuessed gamesPlayed')
      .exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user stats' });
  }
});

const PORT = process.env.PORT || 5000;

// Start server only after connecting to database
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 