import { useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { useSocket } from '../../context/SocketContext';
import { useMeetingStore } from '../../store/meetingStore';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';

export default function MeetingManager() {
  const { socket, emitWebRTCSignal } = useSocket();
  const { currentRoom, members } = useRoomStore();
  const { user: authUser } = useAuthStore();
  const {
  isInMeeting,
  localStream,
  localScreenStream,
  meetingParticipants,
  isScreenSharing
} = useMeetingStore();

  function createPeer(targetUserId, incomingSignal, stream, initiator = false, isScreen = false) {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', signal => {
      if (emitWebRTCSignal) {
        emitWebRTCSignal(targetUserId, signal, isScreen);
      }
    });

    peer.on('stream', userStream => {
      if (isScreen) {
        useMeetingStore.getState().addParticipant({ id: targetUserId, screenStream: userStream, isSharingScreen: true });
      } else {
        useMeetingStore.getState().addParticipant({ id: targetUserId, stream: userStream });
      }
    });

    peer.on('error', err => {
      console.warn(`Peer error (${isScreen ? 'screen' : 'video'}):`, err);
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    return peer;
  }

  const peersRef = useRef({});
  const screenPeersRef = useRef({});
  const lastLocalStreamRef = useRef(null);
  const lastScreenStreamRef = useRef(null);

  useEffect(() => {
    if (localStream) lastLocalStreamRef.current = localStream;
    if (localScreenStream) lastScreenStreamRef.current = localScreenStream;
  }, [localStream, localScreenStream]);

  useEffect(() => {
    if (!socket || !currentRoom) return;

    const handleWebRTCSignal = async ({ senderUserId, signal, isScreen }) => {
      const ref = isScreen ? screenPeersRef : peersRef;
      let peer = ref.current[senderUserId];
      
      const { localStream: freshLocalStream } = useMeetingStore.getState();
      const streamToUse = isScreen ? null : freshLocalStream; // We don't send screen stream in response to screen peer offer usually, but wait, the screen sharer initiates!

      if (!peer) {
        // We received a signal from someone. 
        peer = createPeer(senderUserId, signal, streamToUse, false, isScreen);
        ref.current[senderUserId] = peer;
      } else {
        peer.signal(signal);
      }
    };

    const handleMeetingJoin = ({ userId, name, audioEnabled = true, videoEnabled = true }) => {
      const { isInMeeting: freshIsInMeeting, localStream: freshLocalStream, isScreenSharing: freshSharing, localScreenStream: freshScreenStream } = useMeetingStore.getState();
      
      if (freshIsInMeeting) {
        const peer = createPeer(userId, null, freshLocalStream, true, false);
        peersRef.current[userId] = peer;
        useMeetingStore.getState().addParticipant({ id: userId, name, audioEnabled, videoEnabled });

        // If I am sharing screen, I should also initiate a screen peer to the new user!
        if (freshSharing && freshScreenStream) {
  if (!screenPeersRef.current[userId]) {
    const screenPeer = createPeer(
      userId,
      null,
      freshScreenStream,
      true,
      true
    );

    screenPeersRef.current[userId] = screenPeer;
  }
}
      }
    };

    const handleMeetingLeave = ({ userId }) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
      }
      if (screenPeersRef.current[userId]) {
        screenPeersRef.current[userId].destroy();
        delete screenPeersRef.current[userId];
      }
      useMeetingStore.getState().removeParticipant(userId);
    };

    const handleScreenShareStart = ({ userId }) => {
      // Just mark them as sharing. We wait for their WebRTC signal to actually show the stream.
      useMeetingStore.getState().addParticipant({ id: userId, isSharingScreen: true });
    };

    const handleScreenShareStop = ({ userId }) => {
      useMeetingStore.getState().addParticipant({ id: userId, isSharingScreen: false, screenStream: null });
      if (screenPeersRef.current[userId]) {
        screenPeersRef.current[userId].destroy();
        delete screenPeersRef.current[userId];
      }
    };

    socket.on('webrtc:signal', handleWebRTCSignal);
    socket.on('meeting:join', handleMeetingJoin);
    socket.on('meeting:leave', handleMeetingLeave);
    socket.on('screen_share:start', handleScreenShareStart);
    socket.on('screen_share:stop', handleScreenShareStop);

    return () => {
      socket.off('webrtc:signal', handleWebRTCSignal);
      socket.off('meeting:join', handleMeetingJoin);
      socket.off('meeting:leave', handleMeetingLeave);
      socket.off('screen_share:start', handleScreenShareStart);
      socket.off('screen_share:stop', handleScreenShareStop);
    };
  }, [socket, currentRoom]);

  // When I start screen sharing, push a peer connection to EVERY online room member,
  // not just the people who happen to have joined the audio/video call.
  // Screen sharing should be visible to the whole room, joining the call is a separate thing.
  useEffect(() => {
    if (!isScreenSharing || !localScreenStream) {
      return;
    }

    const selfId = authUser?.id || authUser?._id;

    (members || []).forEach((m) => {
      const u = m.user || m;
      const uid = u._id || u.id;

      if (!uid || uid === selfId) return;
      if (u.isOnline === false) return; // skip members who aren't currently connected
      if (screenPeersRef.current[uid]) return; // already sharing with this person

      const screenPeer = createPeer(uid, null, localScreenStream, true, true);
      screenPeersRef.current[uid] = screenPeer;
    });

    return () => {
      // Don't destroy them just because the member list changed.
      // They are destroyed when screen sharing actually stops.
    };
  }, [isScreenSharing, localScreenStream, members]);

    // Connect to participants who were already in the meeting
  useEffect(() => {
    if (!isInMeeting || !localStream) return;

    const participants = useMeetingStore.getState().meetingParticipants;

    participants.forEach((participant) => {
      if (!participant.id || peersRef.current[participant.id]) return;

      const peer = createPeer(
        participant.id,
        null,
        localStream,
        true,
        false
      );

      peersRef.current[participant.id] = peer;
    });
  }, [isInMeeting, localStream, meetingParticipants]);

    // Connect to participants who were already in the meeting
  useEffect(() => {
    if (!isInMeeting || !localStream) return;

    const participants = useMeetingStore.getState().meetingParticipants;

    participants.forEach((participant) => {
      if (!participant.id || peersRef.current[participant.id]) return;

      const peer = createPeer(
        participant.id,
        null,
        localStream,
        true,
        false
      );

      peersRef.current[participant.id] = peer;
    });
  }, [isInMeeting, localStream, meetingParticipants]);

  // Clean up on unmount or when leaving meeting
  useEffect(() => {
    if (!isInMeeting) {
      Object.values(peersRef.current).forEach(peer => peer.destroy());
      peersRef.current = {};
      Object.values(screenPeersRef.current).forEach(peer => peer.destroy());
      screenPeersRef.current = {};
      
      if (lastLocalStreamRef.current) {
        lastLocalStreamRef.current.getTracks().forEach(track => track.stop());
        lastLocalStreamRef.current = null;
      }
      if (lastScreenStreamRef.current) {
        lastScreenStreamRef.current.getTracks().forEach(track => track.stop());
        lastScreenStreamRef.current = null;
      }
    }
  }, [isInMeeting]);

  return null;
}
