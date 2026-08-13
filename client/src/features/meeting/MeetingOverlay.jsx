import { useEffect, useRef, useState } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { roomService } from '../../services';
import { TbMicrophone, TbMicrophoneOff, TbVideo, TbVideoOff, TbPhoneOff, TbRecordMail, TbPlayerRecord, TbPlayerStop } from 'react-icons/tb';
import toast from 'react-hot-toast';

const VideoStream = ({ stream, isLocal, muted }) => {
  const videoRef = useRef(null);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.warn('Play error:', err);
        setPlayError(true);
      });
    }
  }, [stream]);

  return (
    <div className="w-full h-full relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || muted || false}
        className={`w-full h-full object-cover rounded-lg bg-surface-900 ${isLocal ? 'transform scale-x-[-1]' : ''}`}
      />
      {playError && !isLocal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <button 
            onClick={() => {
              videoRef.current?.play();
              setPlayError(false);
            }} 
            className="px-3 py-1 bg-primary-600 text-white rounded text-xs font-bold shadow hover:bg-primary-500"
          >
            Click to Play Audio
          </button>
        </div>
      )}
    </div>
  );
};

export default function MeetingOverlay({ roomId }) {
  const { isInMeeting, localStream, meetingParticipants, audioEnabled, videoEnabled, setMeetingState } = useMeetingStore();

  const { user } = useAuthStore();
  const { currentRoom, currentSession } = useRoomStore();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  if (!isInMeeting) return null;

  const isOwner = user?._id === currentRoom?.owner;

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !audioEnabled);
      setMeetingState({ audioEnabled: !audioEnabled });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !videoEnabled);
      setMeetingState({ videoEnabled: !videoEnabled });
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: true });
      
      // Combine local mic if available
      if (localStream && localStream.getAudioTracks().length > 0) {
        const audioContext = new AudioContext();
        const dest = audioContext.createMediaStreamDestination();
        audioContext.createMediaStreamSource(stream).connect(dest);
        audioContext.createMediaStreamSource(localStream).connect(dest);
        const combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...dest.stream.getAudioTracks()
        ]);
        mediaRecorderRef.current = new MediaRecorder(combinedStream);
      } else {
        mediaRecorderRef.current = new MediaRecorder(stream);
      }

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        recordedChunksRef.current = [];
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());

        toast.loading('Saving recording...', { id: 'saveRecording' });
        const formData = new FormData();
        formData.append('recording', blob, 'session_recording.webm');
        
        try {
          await roomService.saveRecording(currentRoom._id, currentSession._id, formData);
          toast.success('Recording saved!', { id: 'saveRecording' });
        } catch (err) {
          toast.error('Failed to save recording', { id: 'saveRecording' });
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      
      await roomService.startRecording(currentRoom._id, currentSession._id);
      toast.success('Recording started');

      // Stop sharing logic if the user manually stops through the browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };
    } catch (err) {
      console.error(err);
      toast.error('Failed to start recording');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 w-64 max-h-[80vh] overflow-y-auto pointer-events-none">
      
      {/* Local Video & Recording Controls */}
      <div className="relative rounded-lg shadow-lg aspect-video bg-surface-900 pointer-events-auto border-2 border-primary-500/50">
        <VideoStream stream={localStream} isLocal={true} />
        
        {isOwner && (
          <div className="absolute top-2 left-2 z-10">
            {isRecording ? (
              <button onClick={handleStopRecording} className="flex items-center gap-1 bg-red-500/90 text-white px-2 py-1 rounded text-xs font-bold animate-pulse hover:bg-red-600 transition-colors">
                <TbPlayerStop size={14} /> Stop
              </button>
            ) : (
              <button onClick={handleStartRecording} className="flex items-center gap-1 bg-surface-800/80 hover:bg-surface-700 text-red-400 px-2 py-1 rounded text-xs font-bold transition-colors">
                <TbPlayerRecord size={14} /> Record
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded p-1">
          <button onClick={toggleAudio} className={`p-1.5 rounded ${!audioEnabled ? 'bg-red-500/80 text-white' : 'hover:bg-surface-800 text-surface-200'}`}>
            {audioEnabled ? <TbMicrophone size={14} /> : <TbMicrophoneOff size={14} />}
          </button>
          <button onClick={toggleVideo} className={`p-1.5 rounded ${!videoEnabled ? 'bg-red-500/80 text-white' : 'hover:bg-surface-800 text-surface-200'}`}>
            {videoEnabled ? <TbVideo size={14} /> : <TbVideoOff size={14} />}
          </button>
        </div>
      </div>

      {/* Participants Video */}
      {meetingParticipants.map(p => (
        <div key={p.id} className="relative rounded-lg shadow-lg aspect-video bg-surface-900 pointer-events-auto border border-surface-700">
          {p.stream ? (
            <VideoStream stream={p.stream} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-500">Connecting...</div>
          )}
          <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
            {p.name || 'Participant'}
          </div>
        </div>
      ))}
    </div>
  );
}
