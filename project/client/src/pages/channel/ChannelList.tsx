import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { channelService, Channel } from '../../services/channel.service';
import { getEntityId } from '../../lib/entity';
import { useResolvedWorkspaceId } from '../../hooks/useResolvedIds';
import { PlusIcon, HashtagIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export const ChannelList: React.FC = () => {
  const workspaceId = useResolvedWorkspaceId({ redirectSuffix: '/channels' });
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', description: '', type: 'public' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (workspaceId) loadChannels();
  }, [workspaceId]);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const response = await channelService.getByWorkspace(workspaceId!);
      setChannels(response.data.data.channels || []);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.name.trim()) return;

    setCreating(true);
    try {
      const response = await channelService.create({
        ...newChannel,
        workspaceId: workspaceId!,
      });
      setChannels([...channels, response.data.data.channel]);
      setShowCreateModal(false);
      setNewChannel({ name: '', description: '', type: 'public' });
    } catch (error) {
      console.error('Failed to create channel:', error);
    } finally {
      setCreating(false);
    }
  };

  const publicChannels = channels.filter((c) => c.type === 'public');
  const privateChannels = channels.filter((c) => c.type === 'private');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Channels</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Communicate with your team in channels
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5" />
          New Channel
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <HashtagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No channels</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first channel to start chatting.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <PlusIcon className="w-5 h-5" />
              New Channel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {publicChannels.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Public Channels
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {publicChannels.map((channel) => {
                  const channelId = getEntityId(channel);
                  return (
                  <Link
                    key={channelId}
                    to={`/workspace/${workspaceId}/channel/${channelId}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <HashtagIcon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{channel.name}</p>
                      {channel.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {channel.description}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{channel.members?.length || 0} members</span>
                  </Link>
                );
                })}
              </div>
            </div>
          )}

          {privateChannels.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Private Channels
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {privateChannels.map((channel) => {
                  const channelId = getEntityId(channel);
                  return (
                  <Link
                    key={channelId}
                    to={`/workspace/${workspaceId}/channel/${channelId}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <LockClosedIcon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{channel.name}</p>
                      {channel.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {channel.description}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{channel.members?.length || 0} members</span>
                  </Link>
                );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <form onSubmit={handleCreate}>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Channel</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500">#</span>
                      <input
                        type="text"
                        value={newChannel.name}
                        onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="general"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={newChannel.description}
                      onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="public"
                          checked={newChannel.type === 'public'}
                          onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Public</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="private"
                          checked={newChannel.type === 'private'}
                          onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Private</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
