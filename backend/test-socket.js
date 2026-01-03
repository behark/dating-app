// Simple test script to verify Socket.io functionality
const io = require('socket.io-client');

// Connect to the server
const socket = io('http://localhost:3000', {
  auth: {
    userId: 'test-user-1'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');

  // Join a test room
  socket.emit('join_room', 'test-match-123');
  console.log('Joined room: test-match-123');

  // Send a test message
  setTimeout(() => {
    socket.emit('send_message', {
      matchId: 'test-match-123',
      content: 'Hello from test client!',
      type: 'text'
    });
    console.log('Sent test message');
  }, 1000);

  // Start typing
  setTimeout(() => {
    socket.emit('typing_start', 'test-match-123');
    console.log('Started typing');
  }, 2000);

  // Stop typing
  setTimeout(() => {
    socket.emit('typing_stop', 'test-match-123');
    console.log('Stopped typing');
  }, 3000);
});

socket.on('joined_room', (data) => {
  console.log('Successfully joined room:', data);
});

socket.on('new_message', (data) => {
  console.log('Received message:', data);
});

socket.on('user_typing', (data) => {
  console.log('Typing status:', data);
});

socket.on('message_sent', (data) => {
  console.log('Message sent confirmation:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Keep the script running for 10 seconds
setTimeout(() => {
  socket.disconnect();
  console.log('Test completed');
  process.exit(0);
}, 10000);