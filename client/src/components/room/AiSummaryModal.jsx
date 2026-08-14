import { useState, useEffect } from 'react';
import { TbBrain, TbX, TbLoader } from 'react-icons/tb';
import { roomService } from '../../services';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function AiSummaryModal({ isOpen, onClose, room, session }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (isOpen && session) {
      if (session.aiSummary) {
        setSummary(session.aiSummary);
      } else {
        setSummary(null);
      }
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await roomService.generateSessionSummary(room._id, session._id);
      setSummary(res.data.data.summary);
      session.aiSummary = res.data.data.summary; // Update local session object
      toast.success('Summary generated successfully!');
    } catch (error) {
      toast.error('Failed to generate summary: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-900 border border-surface-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-surface-800 bg-surface-850">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TbBrain className="text-primary-500" size={24} />
            AI Session Summary
          </h3>
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-white rounded-lg hover:bg-surface-700 transition-colors">
            <TbX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {summary ? (
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TbBrain size={48} className="text-surface-600 mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">No Summary Yet</h4>
              <p className="text-surface-400 max-w-md mx-auto mb-6">
                Generate an AI summary of this session based on the chat history, final code state, and duration.
              </p>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <TbLoader className="animate-spin" size={18} />
                    Generating...
                  </>
                ) : (
                  <>
                    <TbBrain size={18} />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {summary && (
          <div className="p-4 border-t border-surface-800 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? <TbLoader className="animate-spin" size={18} /> : 'Regenerate Summary'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
