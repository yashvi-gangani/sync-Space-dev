import { useEffect, useRef, useState, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as Y from 'yjs';
import { useSocket } from '../../context/SocketContext';
import { useRoomStore } from '../../store/roomStore';
import { useDocumentStore } from '../../store/documentStore';
import { TbHistory, TbX } from 'react-icons/tb';

export default function DocumentEditor({ doc }) {
  const { currentRoom } = useRoomStore();
  const { socket, isConnected } = useSocket();
  const { saveVersion } = useDocumentStore();
  
  const [content, setContent] = useState(doc.content || '');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showVersions, setShowVersions] = useState(false);

  const ydocRef = useRef(null);
  const editorRef = useRef(null);
  const isApplyingUpdate = useRef(false);
  const saveTimer = useRef(null);
  const yjsUpdateTimer = useRef(null);

  // Determine Monaco language
  const language = doc.type === 'markdown' ? 'markdown' : 'plaintext';

  useEffect(() => {
    setContent(doc.content || '');
  }, [doc._id, doc.content]);


  useEffect(() => {
    if (!currentRoom || !socket) return;

    // Use a unique Y.Doc per document by using a custom socket event namespace for documents.
    // Or simpler: just use a unique room name for the document.
    const docRoomId = `doc:${doc._id}`;
    
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ytext = ydoc.getText('content');
    
    // Initialize content
    if (doc.content) {
      ytext.insert(0, doc.content);
      setContent(doc.content);
    }

    // Since we're reusing the socket connection, let's use document-specific events
    // Let's implement simple Yjs sync over custom events: 'document:yjs:sync', 'document:yjs:update'
    
    const stateVector = Y.encodeStateVector(ydoc);
    socket.emit('document:yjs:sync', { docId: doc._id, roomId: currentRoom._id, type: 'sv', data: Array.from(stateVector) });

    const handleLocalUpdate = (update, origin) => {
      if (origin !== 'socket' && isConnected) {
        setSaveStatus('saving');
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setSaveStatus('saved'), 1500);
        socket.emit('document:yjs:update', { docId: doc._id, roomId: currentRoom._id, update: Array.from(update) });
      }
    };
    ydoc.on('update', handleLocalUpdate);

    const handleSync = ({ docId, type, data }) => {
      if (docId !== doc._id) return;
      if (type === 'update' && data?.length) {
        isApplyingUpdate.current = true;
        try {
          Y.applyUpdate(ydoc, new Uint8Array(data), 'socket');
          setContent(ytext.toString() || '');
        } catch (e) {}
        isApplyingUpdate.current = false;
      }
    };

    const handleUpdate = ({ docId, update }) => {
      if (docId !== doc._id) return;
      isApplyingUpdate.current = true;
      try {
        Y.applyUpdate(ydoc, new Uint8Array(update), 'socket');
        setContent(ytext.toString() || '');
      } catch (e) {}
      isApplyingUpdate.current = false;
    };

    socket.on('document:yjs:sync', handleSync);
    socket.on('document:yjs:update', handleUpdate);

    return () => {
      ydoc.off('update', handleLocalUpdate);
      socket.off('document:yjs:sync', handleSync);
      socket.off('document:yjs:update', handleUpdate);
      ydoc.destroy();
      clearTimeout(saveTimer.current);
    };
  }, [currentRoom?._id, doc._id, isConnected, socket]);

  const handleEditorChange = useCallback((value) => {
    if (isApplyingUpdate.current) return;
    setContent(value || '');

    clearTimeout(yjsUpdateTimer.current);
    yjsUpdateTimer.current = setTimeout(() => {
      const ydoc = ydocRef.current;
      if (!ydoc) return;
      const ytext = ydoc.getText('content');
      ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, value || '');
      }, 'local');
    }, 80);

    socket?.emit('user:activity_change', { roomId: currentRoom._id, activity: `editing_doc_${doc._id}` });
  }, [currentRoom?._id, doc._id, socket]);

  const handleSave = () => {
    saveVersion(doc._id, content);
    setSaveStatus('saved');
  };

  const handleRestoreVersion = (version) => {
    if (!window.confirm('Restore this saved version? The current content will be saved as a new version.')) return;

    const restoredContent = version.content || '';
    setContent(restoredContent);
    const ydoc = ydocRef.current;
    if (ydoc) {
      const ytext = ydoc.getText('content');
      ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, restoredContent);
      }, 'local');
    }
    saveVersion(doc._id, restoredContent);
    setShowVersions(false);
  };

  return (
    <div className="h-full flex flex-col bg-surface-950 overflow-hidden">
      <div className="flex-shrink-0 h-10 bg-surface-900 border-b border-surface-800 flex items-center justify-between px-4">
        <div className="text-sm text-surface-400">
           Editing <span className="text-white">{doc.title}</span>
        </div>
        <div className="flex items-center gap-4">
           <span className={`text-xs transition-colors ${saveStatus === 'saving' ? 'text-yellow-400' : 'text-green-400'}`}>
             {saveStatus === 'saving' ? '● Saving…' : '✓ Saved'}
           </span>
           <button onClick={() => setShowVersions((open) => !open)} className="btn-secondary btn-sm py-1 flex items-center gap-1">
            <TbHistory size={14} /> Versions ({doc.versions?.length || 0})
          </button>
          <button onClick={handleSave} className="btn-primary btn-sm py-1">Save Version</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {showVersions && (
          <div className="absolute top-2 right-2 z-20 w-80 max-h-[70%] overflow-y-auto rounded-xl border border-surface-700 bg-surface-900/95 shadow-2xl backdrop-blur p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <TbHistory size={15} className="text-primary-400" /> Version History
              </div>
              <button onClick={() => setShowVersions(false)} className="p-1 rounded hover:bg-surface-800 text-surface-400">
                <TbX size={15} />
              </button>
            </div>
            {(doc.versions || []).length === 0 ? (
              <p className="text-xs text-surface-500 py-5 text-center">No saved versions yet.</p>
            ) : (
              <div className="space-y-2">
                {[...(doc.versions || [])].reverse().map((version, index) => (
                  <div key={`${version.savedAt}-${index}`} className="rounded-lg border border-surface-800 bg-surface-950/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-white">
                          Version {(doc.versions?.length || 0) - index}
                        </p>
                        <p className="text-[10px] text-surface-500 mt-0.5">
                          {version.savedBy?.name || 'Member'} · {version.savedAt ? new Date(version.savedAt).toLocaleString() : 'Unknown time'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestoreVersion(version)}
                        className="text-[10px] px-2 py-1 rounded bg-primary-600 hover:bg-primary-500 text-white"
                      >
                        Restore
                      </button>
                    </div>
                    <p className="text-[10px] text-surface-500 mt-2 line-clamp-2 whitespace-pre-wrap">{version.content || '(empty)'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          value={content}
          onChange={handleEditorChange}
          onMount={(editor) => { editorRef.current = editor; }}
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'off',
            padding: { top: 20, bottom: 20 },
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
}
