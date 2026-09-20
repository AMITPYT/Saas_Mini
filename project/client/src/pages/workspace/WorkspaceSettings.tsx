import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { workspaceService, Workspace, User, WorkspaceMember } from '../../services/workspace.service';
import { getEntityId } from '../../lib/entity';
import { useResolvedWorkspaceId } from '../../hooks/useResolvedIds';
import { TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export const WorkspaceSettings: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkspace, setCurrentWorkspace, updateWorkspace, removeWorkspace } = useWorkspaceStore();
  const workspaceId = useResolvedWorkspaceId({ redirectSuffix: '/settings' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const getMemberUser = (member: WorkspaceMember): User | null => {
    const user = member.userId ?? member.user;
    return user && typeof user === 'object' ? user : null;
  };

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const response = await workspaceService.getById(workspaceId!);
      const workspace = response.data.data.workspace;
      setCurrentWorkspace(workspace);
      setFormData({
        name: workspace.name,
        description: workspace.description || '',
      });
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const response = await workspaceService.update(workspaceId!, formData);
      updateWorkspace(workspaceId!, response.data.data.workspace);
      setCurrentWorkspace(response.data.data.workspace);
    } catch (error) {
      console.error('Failed to update workspace:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      await workspaceService.addMember(workspaceId!, {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail('');
      loadWorkspace();
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await workspaceService.removeMember(workspaceId!, userId);
      loadWorkspace();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;

    try {
      await workspaceService.delete(workspaceId!);
      removeWorkspace(workspaceId!);
      navigate('/workspaces');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Workspace Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your workspace settings and members
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            General
          </h2>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Members
          </h2>
        </div>
        <div className="p-6">
          {/* Invite form */}
          <form onSubmit={handleInvite} className="flex gap-4 mb-6">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <UserPlusIcon className="w-5 h-5" />
              Invite
            </button>
          </form>

          {/* Members list */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentWorkspace?.members?.map((member) => {
              const user = getMemberUser(member);
              const memberId =
                getEntityId(user ?? {}) ||
                (typeof member.userId === 'string' ? member.userId : '') ||
                (typeof member.user === 'string' ? member.user : '');

              if (!user && !memberId) return null;

              return (
                <div key={memberId} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.name || user?.email || 'Unknown member'}
                      </p>
                      {user?.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {member.role}
                    </span>
                    {member.role !== 'owner' && memberId && (
                      <button
                        onClick={() => handleRemoveMember(memberId)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900">
        <div className="p-6 border-b border-red-200 dark:border-red-900">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Delete Workspace
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permanently delete this workspace and all its data
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
