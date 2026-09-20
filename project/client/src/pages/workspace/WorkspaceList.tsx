import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { workspaceService, Workspace } from '../../services/workspace.service';
import { getEntityId } from '../../lib/entity';
import { PlusIcon, FolderIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export const WorkspaceList: React.FC = () => {
  const { workspaces, setWorkspaces, addWorkspace, removeWorkspace, isLoading, setLoading } = useWorkspaceStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await workspaceService.getAll();
      setWorkspaces(response.data.data.workspaces || []);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspace.name.trim()) return;

    setCreating(true);
    try {
      const response = await workspaceService.create(newWorkspace);
      addWorkspace(response.data.data.workspace);
      setShowCreateModal(false);
      setNewWorkspace({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return;

    try {
      await workspaceService.delete(id);
      removeWorkspace(id);
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workspaces
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your workspaces and collaborate with your team
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5" />
          New Workspace
        </button>
      </div>

      {/* Workspace grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No workspaces yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first workspace to get started.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <PlusIcon className="w-5 h-5" />
              New Workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => {
            const workspaceId = getEntityId(workspace);
            return (
            <div
              key={workspaceId}
              className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
            >
              <div className="absolute top-4 right-4">
                <Menu as="div" className="relative">
                  <Menu.Button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="p-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to={`/workspace/${workspaceId}/settings`}
                              className={`block px-4 py-2 text-sm rounded ${
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              } text-gray-700 dark:text-gray-300`}
                            >
                              Settings
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleDeleteWorkspace(workspaceId)}
                              className={`block w-full text-left px-4 py-2 text-sm rounded ${
                                active ? 'bg-red-50 dark:bg-red-900/20' : ''
                              } text-red-600 dark:text-red-400`}
                            >
                              Delete
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>

              <Link to={`/workspace/${workspaceId}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-2xl font-bold">
                    {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {workspace.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {workspace.members?.length || 0} members
                    </p>
                  </div>
                </div>
                {workspace.description && (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {workspace.description}
                  </p>
                )}
              </Link>
            </div>
          );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <form onSubmit={handleCreateWorkspace}>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Create Workspace
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newWorkspace.name}
                      onChange={(e) =>
                        setNewWorkspace({ ...newWorkspace, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="My Workspace"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={newWorkspace.description}
                      onChange={(e) =>
                        setNewWorkspace({ ...newWorkspace, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="What's this workspace for?"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newWorkspace.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
