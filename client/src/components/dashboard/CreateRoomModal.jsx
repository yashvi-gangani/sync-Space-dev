import { useForm } from 'react-hook-form';
import { roomService } from '../../services';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { TbCopy, TbLink, TbQrcode, TbArrowRight, TbCheck } from 'react-icons/tb';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';

export default function CreateRoomModal({ isOpen, onClose }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { addRoom } = useRoomStore();
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copyingId, setCopyingId] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    reset();
    setCreatedRoom(null);
    setShowQr(false);
    onClose();
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await roomService.create(data);
      const room = res.data.data.room;
      addRoom(room);
      setCreatedRoom(room);
      toast.success('Room created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    if (!createdRoom) return;
    navigator.clipboard.writeText(createdRoom.slug);
    setCopyingId(true);
    setTimeout(() => setCopyingId(false), 2000);
    toast.success('Room ID copied!');
  };

  const copyLink = () => {
    if (!createdRoom) return;
    const link = `${window.location.origin}/room/${createdRoom.slug}/collaborate`;
    navigator.clipboard.writeText(link);
    setCopyingLink(true);
    setTimeout(() => setCopyingLink(false), 2000);
    toast.success('Room link copied!');
  };

  const roomLink = createdRoom ? `${window.location.origin}/room/${createdRoom.slug}/collaborate` : '';

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full p-6 space-y-4">
        {!createdRoom ? (
          <>
            <h2 className="text-xl font-bold text-white">Create New Workspace</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label" htmlFor="roomName">Workspace Name</label>
                <input
                  id="roomName"
                  type="text"
                  placeholder="e.g. Project Whiteboard"
                  className={errors.name ? 'input-error' : 'input'}
                  {...register('name', { required: 'Room name is required' })}
                />
                {errors.name && <p className="error-text">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  placeholder="Workspace goals or topics"
                  className="input h-20 resize-none"
                  {...register('description')}
                />
              </div>

              <div>
                <label className="label" htmlFor="type">Privacy Type</label>
                <select id="type" className="input" {...register('type')}>
                  <option value="private">Private (Invite only)</option>
                  <option value="public">Public (Anyone can discover)</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="activeMode">Mode</label>
                <select id="activeMode" className="input" {...register('activeMode')}>
                  <option value="both">Whiteboard + Code Editor</option>
                  <option value="whiteboard">Whiteboard Only</option>
                  <option value="editor">Code Editor Only</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
              <TbCheck size={32} />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Room Created!</h2>
              <p className="text-surface-400 text-sm">{createdRoom.name}</p>
            </div>

            <div className="bg-surface-800 rounded-xl p-4 space-y-4 text-left">
              <div>
                <label className="text-xs text-surface-500 uppercase font-bold tracking-wider mb-1 block">Room ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface-900 px-3 py-2 rounded-lg text-primary-400 font-mono text-lg font-bold text-center border border-surface-700">
                    {createdRoom.slug}
                  </code>
                  <button onClick={copyId} className="btn-secondary p-3">
                    {copyingId ? <TbCheck className="text-green-400" size={20} /> : <TbCopy size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={copyLink} className="btn-secondary flex-1 justify-center">
                  {copyingLink ? <TbCheck className="text-green-400" size={18} /> : <TbLink size={18} />}
                  <span>{copyingLink ? 'Copied' : 'Copy Link'}</span>
                </button>
                <button onClick={() => setShowQr(!showQr)} className="btn-secondary flex-1 justify-center">
                  <TbQrcode size={18} />
                  <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
                </button>
              </div>

              {showQr && (
                <div className="bg-white p-4 rounded-xl flex justify-center animate-fade-in">
                  <QRCode value={roomLink} size={180} />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose} className="btn-secondary flex-1 justify-center">
                Close
              </button>
              <button 
                type="button" 
                onClick={() => navigate(`/room/${createdRoom.slug}/collaborate`)} 
                className="btn-primary flex-1 justify-center"
              >
                <span>Enter Room</span>
                <TbArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
