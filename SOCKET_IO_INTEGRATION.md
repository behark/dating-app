# Socket.IO Integration for Real-Time Features

## Overview
This guide covers Socket.IO integration for real-time video calls, voice messages, and activity updates.

## Backend Socket.IO Implementation

### Video Call Events

```javascript
// server.js or socket-handler.js

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins chat room
  socket.on('join-room', (matchId) => {
    socket.join(`match-${matchId}`);
    socket.join(`user-${socket.userId}`);
  });

  // Video call initiated
  socket.on('video-call:initiate', ({ matchId, callId, recipientId }) => {
    io.to(`user-${recipientId}`).emit('video-call:incoming', {
      callId,
      callerId: socket.userId,
      matchId
    });
  });

  // Video call accepted
  socket.on('video-call:accept', ({ matchId, callId }) => {
    io.to(`match-${matchId}`).emit('video-call:accepted', {
      callId,
      acceptedBy: socket.userId
    });
  });

  // Video call declined
  socket.on('video-call:decline', ({ matchId, callId }) => {
    io.to(`match-${matchId}`).emit('video-call:declined', {
      callId,
      declinedBy: socket.userId
    });
  });

  // Video call ended
  socket.on('video-call:end', ({ matchId, callId, duration }) => {
    io.to(`match-${matchId}`).emit('video-call:ended', {
      callId,
      duration,
      endedBy: socket.userId
    });
  });

  // ICE candidate for WebRTC
  socket.on('video-call:ice-candidate', ({ matchId, candidate }) => {
    io.to(`match-${matchId}`).emit('video-call:ice-candidate', {
      candidate,
      from: socket.userId
    });
  });

  // WebRTC offer
  socket.on('video-call:offer', ({ matchId, offer }) => {
    io.to(`match-${matchId}`).emit('video-call:offer', {
      offer,
      from: socket.userId
    });
  });

  // WebRTC answer
  socket.on('video-call:answer', ({ matchId, answer }) => {
    io.to(`match-${matchId}`).emit('video-call:answer', {
      answer,
      from: socket.userId
    });
  });

  // Voice message sent
  socket.on('voice-message:sent', ({ matchId, messageId, duration }) => {
    io.to(`match-${matchId}`).emit('voice-message:received', {
      messageId,
      sender: socket.userId,
      duration
    });

    // Log activity
    UserActivity.logActivity(socket.userId, 'message', {
      matchId,
      type: 'voice'
    });
  });

  // User started typing voice message
  socket.on('voice-message:start', ({ matchId }) => {
    io.to(`match-${matchId}`).emit('voice-message:recording', {
      userId: socket.userId
    });
  });

  // User cancelled voice message
  socket.on('voice-message:cancel', ({ matchId }) => {
    io.to(`match-${matchId}`).emit('voice-message:cancelled', {
      userId: socket.userId
    });
  });

  // Activity tracking
  socket.on('user:active', () => {
    // Update user last active time
    User.findByIdAndUpdate(socket.userId, {
      lastActivityAt: new Date(),
      isOnline: true
    });

    UserActivity.logActivity(socket.userId, 'login');
  });

  socket.on('user:inactive', () => {
    User.findByIdAndUpdate(socket.userId, {
      isOnline: false
    });
  });

  // Profile boost update notification
  socket.on('profile:boosted', ({ userId }) => {
    io.to(`user-${userId}`).emit('profile:boosted-active', {
      endsAt: new Date(Date.now() + 30 * 60000) // 30 min from now
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    User.findByIdAndUpdate(socket.userId, {
      isOnline: false
    });
  });
});
```

## Frontend Socket.IO Integration

### Video Call Manager Hook

```javascript
// src/hooks/useVideoCall.js

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';

export const useVideoCall = () => {
  const { socket } = useChat();
  const [inCall, setInCall] = useState(false);
  const [callId, setCallId] = useState(null);
  const [callerId, setCallerId] = useState(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(async () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] }
      ]
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('video-call:ice-candidate', {
          matchId: currentMatchId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [socket]);

  // Initiate call
  const initiateCall = useCallback(async (matchId, recipientId) => {
    try {
      const callId = `call-${Date.now()}`;
      setCallId(callId);

      // Get local stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      localStreamRef.current = stream;

      // Initialize peer connection
      const pc = await initializePeerConnection();

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('video-call:offer', {
        matchId,
        offer: offer.toJSON(),
        callId
      });

      // Notify recipient
      socket.emit('video-call:initiate', {
        matchId,
        callId,
        recipientId
      });

      setInCall(true);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  }, [socket, initializePeerConnection]);

  // Accept incoming call
  const acceptCall = useCallback(async (matchId, offer) => {
    try {
      // Get local stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      localStreamRef.current = stream;

      // Initialize peer connection
      const pc = await initializePeerConnection();

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('video-call:answer', {
        matchId,
        answer: answer.toJSON()
      });

      socket.emit('video-call:accept', {
        matchId,
        callId
      });

      setInCall(true);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  }, [socket, initializePeerConnection]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback((candidate) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  // Handle remote answer
  const handleRemoteAnswer = useCallback(async (answer) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    }
  }, []);

  // End call
  const endCall = useCallback((matchId, duration = 0) => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    socket.emit('video-call:end', {
      matchId,
      callId,
      duration
    });

    setInCall(false);
    setCallId(null);
  }, [socket, callId]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('video-call:accepted', () => {
      // Call was accepted, ready to communicate
    });

    socket.on('video-call:declined', () => {
      setInCall(false);
      setCallId(null);
    });

    socket.on('video-call:ice-candidate', ({ candidate }) => {
      handleIceCandidate(candidate);
    });

    socket.on('video-call:answer', ({ answer }) => {
      handleRemoteAnswer(answer);
    });

    socket.on('video-call:ended', () => {
      setInCall(false);
    });

    return () => {
      socket.off('video-call:accepted');
      socket.off('video-call:declined');
      socket.off('video-call:ice-candidate');
      socket.off('video-call:answer');
      socket.off('video-call:ended');
    };
  }, [socket, handleIceCandidate, handleRemoteAnswer]);

  return {
    inCall,
    callId,
    initiateCall,
    acceptCall,
    endCall,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current
  };
};
```

### Voice Message Handler

```javascript
// src/hooks/useVoiceMessage.js

import { useCallback, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import MediaMessagesService from '../services/MediaMessagesService';

export const useVoiceMessage = (authToken) => {
  const { socket } = useChat();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaService = new MediaMessagesService(authToken);

  // Start recording
  const startRecording = useCallback(async (matchId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioChunksRef.current = [];

        // Upload and send
        const duration = mediaRecorder.stream.getTracks()[0].enabled ? 0 : 0;
        
        socket.emit('voice-message:sent', {
          matchId,
          duration,
          messageId: `msg-${Date.now()}`
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      socket.emit('voice-message:start', { matchId });
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [socket]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  // Cancel recording
  const cancelRecording = useCallback((matchId) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      audioChunksRef.current = [];
      setIsRecording(false);

      socket.emit('voice-message:cancel', { matchId });
    }
  }, [isRecording, socket]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording
  };
};
```

### Activity Tracking

```javascript
// src/hooks/useActivityTracking.js

import { useEffect } from 'react';
import { useChat } from '../context/ChatContext';

export const useActivityTracking = () => {
  const { socket } = useChat();

  useEffect(() => {
    if (!socket) return;

    // Emit active status
    socket.emit('user:active');

    // Set up activity timer
    let inactivityTimer;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        socket.emit('user:inactive');
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Listen to user interactions
    const handleActivity = () => {
      socket.emit('user:active');
      resetInactivityTimer();
    };

    document.addEventListener('touchstart', handleActivity);
    document.addEventListener('keypress', handleActivity);

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      socket.emit('user:inactive');
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('keypress', handleActivity);
    };
  }, [socket]);
};
```

## Real-Time UI Updates

### Video Call Component

```javascript
import { useVideoCall } from '../hooks/useVideoCall';

const VideoCallComponent = ({ matchId, recipientId, visible, onClose }) => {
  const {
    inCall,
    initiateCall,
    acceptCall,
    endCall,
    localStream,
    remoteStream
  } = useVideoCall();

  return (
    <Modal visible={visible && inCall}>
      {/* Video streams */}
      <Video source={{ uri: localStream }} style={styles.localVideo} />
      <Video source={{ uri: remoteStream }} style={styles.remoteVideo} />

      {/* Controls */}
      <TouchableOpacity onPress={() => endCall(matchId)}>
        <Text>End Call</Text>
      </TouchableOpacity>
    </Modal>
  );
};
```

### Voice Message Component

```javascript
import { useVoiceMessage } from '../hooks/useVoiceMessage';

const VoiceMessageComponent = ({ matchId, authToken }) => {
  const {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceMessage(authToken);

  return (
    <View>
      <TouchableOpacity
        onPress={() => startRecording(matchId)}
        disabled={isRecording}
      >
        <Ionicons name="mic" size={24} />
      </TouchableOpacity>

      {isRecording && (
        <>
          <TouchableOpacity onPress={stopRecording}>
            <Text>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => cancelRecording(matchId)}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
```

## Performance Considerations

1. **Connection pooling**: Reuse socket connection across app
2. **Debouncing**: Debounce activity events (max 1 per 5 seconds)
3. **Message batching**: Batch multiple events into single emit
4. **Resource cleanup**: Always clean up streams and peer connections
5. **Error recovery**: Implement fallback for connection failures

## Deployment Checklist

- [ ] TURN server configured for NAT traversal
- [ ] SSL certificates valid for Socket.IO WSS
- [ ] CORS configured properly on backend
- [ ] ICE candidates properly filtered
- [ ] Resource limits set on server (max connections, message size)
- [ ] Logging configured for debugging
- [ ] Monitoring alerts set up for connection issues
