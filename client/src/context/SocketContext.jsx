import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import { useAuthStore } from "../store/authStore";
import { useRoomStore } from "../store/roomStore";
import { useChatStore } from "../store/chatStore";
import { useNotificationStore } from "../store/notificationStore";
import { useWhiteboardStore } from "../store/whiteboardStore";
import { useMeetingStore } from "../store/meetingStore";
import { useDocumentStore } from "../store/documentStore";
import { useFileStore } from "../store/fileStore";

import toast from "react-hot-toast";


// ============================================================
// SOCKET URL
// ============================================================

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.PROD
    ? "http://localhost:5000"
    : "http://localhost:5000");


// ============================================================
// CONTEXT
// ============================================================

const SocketContext = createContext(null);


// ============================================================
// EVENTS
// ============================================================

const EVENTS = {
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_JOINED: "room:joined",
  ROOM_ERROR: "room:error",

  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",

  CURSOR_MOVE: "cursor:move",
  CURSOR_LEAVE: "cursor:leave",

  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  WHITEBOARD_EVENT: "whiteboard:event",
  WHITEBOARD_CLEAR: "whiteboard:clear",

  EDITOR_YJS_SYNC: "editor:yjs:sync",
  EDITOR_YJS_UPDATE: "editor:yjs:update",
  EDITOR_YJS_AWARENESS: "editor:yjs:awareness",
  EDITOR_LANGUAGE_CHANGE: "editor:language_change",

  CHAT_MESSAGE: "chat:message",
  CHAT_MESSAGE_DELETED: "chat:message_deleted",
  CHAT_SEEN: "chat:seen",

  NOTIFICATION: "notification",

  DOCUMENT_CREATED: "document:created",
  FILE_CREATED: "file:created",

  PREVIEW_SYNC: "preview:sync",

  CODE_RUN: "code:run",
  CODE_OUTPUT: "code:output",

  MEETING_MEDIA_STATE: "meeting:media_state",

  SESSION_START: "session:start",
  SESSION_END: "session:end",
  SESSION_STATE: "session:state",

  PRESENTER_START: "presenter:start",
  PRESENTER_STOP: "presenter:stop",
  PRESENTER_STATE: "presenter:state",
};


// ============================================================
// SOCKET PROVIDER
// ============================================================

export function SocketProvider({ children }) {
  const socketRef = useRef(null);

  const { accessToken, isAuthenticated } = useAuthStore();

  const { setMembers } = useRoomStore();

  const {
    addMessage,
    removeMessage,
    addTypingUser,
    removeTypingUser,
  } = useChatStore();

  const { addNotification } = useNotificationStore();

  const applyRemoteEvent = useWhiteboardStore(
    (state) => state.applyRemoteEvent
  );

  const [isConnected, setIsConnected] = useState(false);


  // ============================================================
  // SOCKET CONNECTION
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    console.log("🔌 Connecting Socket.IO to:", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      // IMPORTANT: use a function, not a static object.
      // Socket.IO calls this fresh on every connect AND every
      // reconnection attempt, so it always sends the CURRENT
      // token from the store instead of a stale snapshot taken
      // when the socket was first created.
      auth: (cb) => {
        cb({ token: useAuthStore.getState().accessToken });
      },

      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,

      transports: ["websocket", "polling"],

      forceNew: true,
    });

    socketRef.current = socket;


    // ==========================================================
    // CONNECT
    // ==========================================================

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);

      setIsConnected(true);
    });


    // ==========================================================
    // DISCONNECT
    // ==========================================================

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);

      setIsConnected(false);
    });


    // ==========================================================
    // CONNECT ERROR
    // ==========================================================

    socket.on("connect_error", async (err) => {
      console.error("❌ Socket connection error:", err.message);

      if (
        err.message === "Invalid token" ||
        err.message === "Authentication required"
      ) {
        try {
          const { authService } = await import("../services/index.js");

          // This call goes through the axios interceptor in api.js,
          // which will refresh the access token on a 401 and update
          // the auth store. Because socket `auth` above is now a
          // function, the NEXT reconnection attempt will automatically
          // pick up the refreshed token.
          await authService.getMe();
        } catch (error) {
          console.error("❌ Token refresh failed:", error);

          useAuthStore.getState().logout();
        }
      }
    });


    // ==========================================================
    // ROOM JOINED
    // ==========================================================

    socket.on(
      EVENTS.ROOM_JOINED,
      ({
        room,
        members,
        whiteboardState,
        chatHistory,
        activeMeetingParticipants,
        activeMeetingMediaStates,
        activeScreenSharers,
        activeSession,
        presenterId,
      }) => {
        console.log("🏠 Room joined:", room?._id || room?.id);

        // Members
        setMembers(members || []);


        // ------------------------------------------------------
        // Whiteboard
        // ------------------------------------------------------

        if (whiteboardState?.length) {
          useWhiteboardStore
            .getState()
            .setInitialState(whiteboardState);
        }


        // ------------------------------------------------------
        // Chat history
        // ------------------------------------------------------

        if (chatHistory?.length) {
          useChatStore
            .getState()
            .setMessages(chatHistory);
        }


        // ------------------------------------------------------
        // Members map
        // ------------------------------------------------------

        const memberById = new Map(
          (members || []).map((member) => {
            const user = member.user || member;

            return [user._id || user.id, user];
          })
        );


        // ------------------------------------------------------
        // Active meeting participants
        // ------------------------------------------------------

        if (activeMeetingParticipants?.length) {
          activeMeetingParticipants.forEach((id) => {
            if (
              id !==
              useAuthStore.getState().user?.id
            ) {
              const user = memberById.get(id);

              useMeetingStore.getState().addParticipant({
                id,
                name: user?.name,
                avatar: user?.avatar,
                ...(activeMeetingMediaStates?.[id] || {}),
              });
            }
          });
        }


        // ------------------------------------------------------
        // Active screen sharers
        // ------------------------------------------------------

        if (activeScreenSharers?.length) {
          activeScreenSharers.forEach((id) => {
            if (
              id !==
              useAuthStore.getState().user?.id
            ) {
              const user = memberById.get(id);

              useMeetingStore.getState().addParticipant({
                id,
                name: user?.name,
                avatar: user?.avatar,
                isSharingScreen: true,
              });
            }
          });
        }


        // ------------------------------------------------------
        // Session
        // ------------------------------------------------------

        useRoomStore
          .getState()
          .setCurrentSession(activeSession || null);


        // ------------------------------------------------------
        // Presenter
        // ------------------------------------------------------

        useMeetingStore.getState().setMeetingState({
          presenterId: presenterId || null,
          presenterName: null,
        });
      }
    );


    // ==========================================================
    // ROOM ERROR
    // ==========================================================

    socket.on(EVENTS.ROOM_ERROR, ({ message }) => {
      toast.error(message);
    });

    socket.on("error", (error) => {
  console.error("❌ SOCKET SERVER ERROR:", error);
  toast.error(error?.message || "Socket error");
});


    // ==========================================================
    // USER ONLINE
    // ==========================================================

    socket.on(EVENTS.USER_ONLINE, ({ members }) => {
      if (members) {
        setMembers(members);
      }
    });


    // ==========================================================
    // USER OFFLINE
    // ==========================================================

    socket.on(EVENTS.USER_OFFLINE, ({ members }) => {
      if (members) {
        setMembers(members);
      }
    });


    // ==========================================================
    // WHITEBOARD
    // ==========================================================

    socket.on(EVENTS.WHITEBOARD_EVENT, ({ event }) => {
      applyRemoteEvent(event);
    });


    socket.on(EVENTS.WHITEBOARD_CLEAR, () => {
      useWhiteboardStore
        .getState()
        .clearCanvas();
    });


    // ==========================================================
    // CHAT
    // ==========================================================

    socket.on(EVENTS.CHAT_MESSAGE, ({ message }) => {
      addMessage(message);
    });


    socket.on(EVENTS.CHAT_MESSAGE_DELETED, ({ id }) => {
      removeMessage(id);
    });


    // ==========================================================
    // MEETING MEDIA
    // ==========================================================

    socket.on(
      EVENTS.MEETING_MEDIA_STATE,
      ({ userId, audioEnabled, videoEnabled }) => {
        useMeetingStore
          .getState()
          .updateParticipantMedia(userId, {
            audioEnabled,
            videoEnabled,
          });
      }
    );


    // ==========================================================
    // SESSION STATE
    // ==========================================================

    socket.on(
      EVENTS.SESSION_STATE,
      ({ recording, session, sessionId }) => {
        const currentSession =
          useRoomStore.getState().currentSession;

        if (recording && session) {
          useRoomStore
            .getState()
            .setCurrentSession(session);
        } else if (
          !recording &&
          sessionId === currentSession?._id
        ) {
          useRoomStore
            .getState()
            .setCurrentSession(null);
        }
      }
    );


    // ==========================================================
    // PRESENTER STATE
    // ==========================================================

    socket.on(
      EVENTS.PRESENTER_STATE,
      ({
        presenterId: nextPresenterId,
        name,
      }) => {
        const store =
          useMeetingStore.getState();

        store.setMeetingState({
          presenterId: nextPresenterId || null,
          presenterName: name || null,

          followPresenterId:
            nextPresenterId &&
            store.followPresenterId === nextPresenterId
              ? store.followPresenterId
              : nextPresenterId
                ? store.followPresenterId
                : null,
        });
      }
    );


    // ==========================================================
    // TYPING
    // ==========================================================

    socket.on(EVENTS.TYPING_START, (user) => {
      addTypingUser(user);
    });


    socket.on(EVENTS.TYPING_STOP, ({ userId }) => {
      removeTypingUser(userId);
    });


    // ==========================================================
    // NOTIFICATION
    // ==========================================================

    socket.on(EVENTS.NOTIFICATION, (notification) => {
      addNotification(notification);

      if (notification.type !== "cursor") {
        toast(notification.message, {
          icon: "🔔",
          duration: 3000,
        });
      }
    });


    // ==========================================================
    // DOCUMENT
    // ==========================================================

    socket.on(
      EVENTS.DOCUMENT_CREATED,
      ({ document }) => {
        useDocumentStore
          .getState()
          .addDocument(document);
      }
    );


    // ==========================================================
    // FILE
    // ==========================================================

    socket.on(
      EVENTS.FILE_CREATED,
      ({ file }) => {
        useFileStore
          .getState()
          .addFile(file);
      }
    );


    // ==========================================================
    // CLEANUP
    // ==========================================================

    return () => {
      console.log("🔌 Closing Socket.IO connection");

      socket.disconnect();

      socketRef.current = null;

      setIsConnected(false);
    };
  }, [isAuthenticated, accessToken]);


  // ============================================================
  // ROOM
  // ============================================================

  const joinRoom = (roomId, sessionId) => {
    socketRef.current?.emit(
      EVENTS.ROOM_JOIN,
      {
        roomId,
        sessionId,
      }
    );
  };


  const leaveRoom = () => {
    socketRef.current?.emit(
      EVENTS.ROOM_LEAVE
    );
  };


  // ============================================================
  // WHITEBOARD
  // ============================================================

  const emitWhiteboardEvent = (roomId, event) => {
    socketRef.current?.emit(
      EVENTS.WHITEBOARD_EVENT,
      {
        roomId,
        event,
      }
    );
  };


  const emitWhiteboardClear = () => {
    socketRef.current?.emit(
      EVENTS.WHITEBOARD_CLEAR
    );
  };


  // ============================================================
  // CURSOR
  // ============================================================

  const emitCursorMove = (
    roomId,
    x,
    y,
    tool
  ) => {
    socketRef.current?.emit(
      EVENTS.CURSOR_MOVE,
      {
        roomId,
        x,
        y,
        tool,
      }
    );
  };


  // ============================================================
  // TYPING
  // ============================================================

  const emitTypingStart = (roomId) => {
    socketRef.current?.emit(
      EVENTS.TYPING_START,
      {
        roomId,
      }
    );
  };


  const emitTypingStop = (roomId) => {
    socketRef.current?.emit(
      EVENTS.TYPING_STOP,
      {
        roomId,
      }
    );
  };


  // ============================================================
  // CHAT
  // ============================================================

  const emitChatMessage = (
    roomId,
    content,
    type,
    replyTo
  ) => {
    socketRef.current?.emit(
      EVENTS.CHAT_MESSAGE,
      {
        roomId,
        content,
        type,
        replyTo,
      }
    );
  };


  const emitChatSeen = (roomId) => {
    socketRef.current?.emit(
      EVENTS.CHAT_SEEN,
      {
        roomId,
      }
    );
  };


  // ============================================================
  // YJS EDITOR
  // ============================================================

  const emitYjsSync = (
    roomId,
    type,
    data
  ) => {
    socketRef.current?.emit(
      EVENTS.EDITOR_YJS_SYNC,
      {
        roomId,
        type,
        data,
      }
    );
  };


  const emitYjsUpdate = (
    roomId,
    update
  ) => {
    socketRef.current?.emit(
      EVENTS.EDITOR_YJS_UPDATE,
      {
        roomId,
        update,
      }
    );
  };


  const emitYjsAwareness = (
    roomId,
    update
  ) => {
    socketRef.current?.emit(
      EVENTS.EDITOR_YJS_AWARENESS,
      {
        roomId,
        update,
      }
    );
  };


  const emitLanguageChange = (
    roomId,
    language
  ) => {
    socketRef.current?.emit(
      EVENTS.EDITOR_LANGUAGE_CHANGE,
      {
        roomId,
        language,
      }
    );
  };


  // ============================================================
  // YJS LISTENERS
  // ============================================================

  const onYjsSync = (callback) => {
    socketRef.current?.on(
      EVENTS.EDITOR_YJS_SYNC,
      callback
    );

    return () => {
      socketRef.current?.off(
        EVENTS.EDITOR_YJS_SYNC,
        callback
      );
    };
  };


  const onYjsUpdate = (callback) => {
    socketRef.current?.on(
      EVENTS.EDITOR_YJS_UPDATE,
      callback
    );

    return () => {
      socketRef.current?.off(
        EVENTS.EDITOR_YJS_UPDATE,
        callback
      );
    };
  };


  const onYjsAwareness = (callback) => {
    socketRef.current?.on(
      EVENTS.EDITOR_YJS_AWARENESS,
      callback
    );

    return () => {
      socketRef.current?.off(
        EVENTS.EDITOR_YJS_AWARENESS,
        callback
      );
    };
  };


  const onLanguageChange = (callback) => {
    socketRef.current?.on(
      EVENTS.EDITOR_LANGUAGE_CHANGE,
      callback
    );

    return () => {
      socketRef.current?.off(
        EVENTS.EDITOR_LANGUAGE_CHANGE,
        callback
      );
    };
  };


  const onCursorMove = (callback) => {
    socketRef.current?.on(
      EVENTS.CURSOR_MOVE,
      callback
    );

    return () => {
      socketRef.current?.off(
        EVENTS.CURSOR_MOVE,
        callback
      );
    };
  };


  // ============================================================
  // PREVIEW SYNC
  // ============================================================

  const emitPreviewSync = (
    roomId,
    html
  ) => {
    socketRef.current?.emit(
      EVENTS.PREVIEW_SYNC,
      {
        roomId,
        html,
      }
    );
  };


  const onPreviewSync = (callback) => {
    socketRef.current?.on(
      EVENTS.PREVIEW_SYNC,
      callback
    );

    return () => {
      socketRef.current?.off(
        EVENTS.PREVIEW_SYNC,
        callback
      );
    };
  };


  // ============================================================
  // CODE EXECUTION
  // ============================================================

  const emitCodeRun = (
    roomId,
    language
  ) => {
    socketRef.current?.emit(
      EVENTS.CODE_RUN,
      {
        roomId,
        language,
      }
    );
  };


  const emitCodeOutput = (
    roomId,
    output,
    language,
    executionTime
  ) => {
    socketRef.current?.emit(
      EVENTS.CODE_OUTPUT,
      {
        roomId,
        output,
        language,
        executionTime,
      }
    );
  };


  const onCodeRun = (callback) => {
    socketRef.current?.on(
      EVENTS.CODE_RUN,
      callback
    );

    return () => {
      socketRef.current?.off(
        EVENTS.CODE_RUN,
        callback
      );
    };
  };


  const onCodeOutput = (callback) => {
    socketRef.current?.on(
      EVENTS.CODE_OUTPUT,
      callback
    );

    return () => {
      socketRef.current?.off(
        EVENTS.CODE_OUTPUT,
        callback
      );
    };
  };


  // ============================================================
  // PROVIDER
  // ============================================================

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,

        isConnected,

        // Room
        joinRoom,
        leaveRoom,

        // Cursor
        emitCursorMove,

        // Typing
        emitTypingStart,
        emitTypingStop,

        // Whiteboard
        emitWhiteboardEvent,
        emitWhiteboardClear,

        // Editor
        emitEditorSync: emitYjsSync,
        emitEditorUpdate: emitYjsUpdate,
        emitEditorAwareness: emitYjsAwareness,
        emitLanguageChange,

        // Meeting
        emitMeetingJoin: (
          roomId,
          audioEnabled = true,
          videoEnabled = true
        ) =>
          socketRef.current?.emit(
            "meeting:join",
            {
              roomId,
              audioEnabled,
              videoEnabled,
            }
          ),

        emitMeetingLeave: (roomId) =>
          socketRef.current?.emit(
            "meeting:leave",
            {
              roomId,
            }
          ),

        // Screen sharing
        emitScreenShareStart: (roomId) =>
          socketRef.current?.emit(
            "screen_share:start",
            {
              roomId,
            }
          ),

        emitScreenShareStop: (roomId) =>
          socketRef.current?.emit(
            "screen_share:stop",
            {
              roomId,
            }
          ),

        // User activity
        emitUserActivityChange: (
          roomId,
          activity
        ) =>
          socketRef.current?.emit(
            "user:activity_change",
            {
              roomId,
              activity,
            }
          ),

        // Meeting media
        emitMeetingMediaState: (
          roomId,
          audioEnabled,
          videoEnabled
        ) =>
          socketRef.current?.emit(
            EVENTS.MEETING_MEDIA_STATE,
            {
              roomId,
              audioEnabled,
              videoEnabled,
            }
          ),

        // Session
        emitSessionStart: (
          roomId,
          sessionId
        ) =>
          socketRef.current?.emit(
            EVENTS.SESSION_START,
            {
              roomId,
              sessionId,
            }
          ),

        emitSessionEnd: (
          roomId,
          sessionId
        ) =>
          socketRef.current?.emit(
            EVENTS.SESSION_END,
            {
              roomId,
              sessionId,
            }
          ),

        // Presenter
        emitPresenterStart: (roomId) =>
          socketRef.current?.emit(
            EVENTS.PRESENTER_START,
            {
              roomId,
            }
          ),

        emitPresenterStop: (roomId) =>
          socketRef.current?.emit(
            EVENTS.PRESENTER_STOP,
            {
              roomId,
            }
          ),

        // WebRTC
        emitWebRTCSignal: (
          targetUserId,
          signal,
          isScreen = false
        ) =>
          socketRef.current?.emit(
            "webrtc:signal",
            {
              targetUserId,
              signal,
              isScreen,
            }
          ),

        // Chat
        emitChatMessage,
        emitChatSeen,

        // Preview
        emitPreviewSync,

        // Code
        emitCodeRun,
        emitCodeOutput,

        // Listeners
        onYjsSync,
        onYjsUpdate,
        onYjsAwareness,
        onLanguageChange,
        onCursorMove,

        onPreviewSync,

        onCodeRun,
        onCodeOutput,

        // Events
        EVENTS,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}


// ============================================================
// HOOK
// ============================================================

export const useSocket = () =>
  useContext(SocketContext);


export { EVENTS };