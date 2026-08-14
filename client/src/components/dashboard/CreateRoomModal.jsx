import { useForm } from 'react-hook-form';
import { roomService } from '../../services';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { TbCopy, TbQrcode } from 'react-icons/tb';
import { useRoomStore } from '../../store/roomStore';

export default function CreateRoomModal({ isOpen, onClose }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const { addRoom } = useRoomStore();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await roomService.create(data);
      const room = res.data.data.room;
      addRoom(room);
      setCreatedRoom(room);
      toast.success('Room created successfully!');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const joinUrl = createdRoom
    ? `${window.location.origin}/room/${createdRoom.slug}/collaborate`
    : '';

  const copyRoomId = async () => {
    if (!createdRoom?.slug) return;
    await navigator.clipboard.writeText(createdRoom.slug);
    toast.success('Workspace ID copied!');
  };

  const closeModal = () => {
    setCreatedRoom(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">
          {createdRoom ? 'Workspace Created' : 'Create New Workspace'}
        </h2>

        {createdRoom ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-primary-500/30 bg-primary-950/20 p-4">
              <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold">Workspace ID / Room ID</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 text-xl font-bold tracking-widest text-primary-300">{createdRoom.slug}</code>
                <button type="button" onClick={copyRoomId} className="btn-secondary p-2" title="Copy Workspace ID">
                  <TbCopy size={18} />
                </button>
              </div>
              <p className="text-xs text-surface-400 mt-2">Share this ID with teammates so they can join from the Join Space option.</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <TbQrcode size={18} className="text-primary-400" /> Scan to Join
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`}
                alt="QR code for joining workspace"
                className="w-44 h-44 rounded-lg bg-white p-2"
              />
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={closeModal} className="btn-primary">
                Done
              </button>
            </div>
          </div>
        ) : (
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
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
