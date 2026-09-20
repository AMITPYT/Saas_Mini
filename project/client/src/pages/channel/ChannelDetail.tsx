import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { channelService, Channel, Message } from '../../services/channel.service';
import { useAuthStore } from '../../store/authStore';
import { getEntityId } from '../../lib/entity';
import { useResolvedEntityId } from '../../hooks/useResolvedIds';
import { PaperAirplaneIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { HashtagIcon } from '@heroicons/react/24/solid';

export const ChannelDetail: React.FC = () => {
  const { channelId: routeChannelId } = useParams<{ channelId: string }>();
  const { user } = useAuthStore();
  const [channel, setChannel] = useState<Channel | null>(null);
  const channelId = useResolvedEntityId(routeChannelId, channel);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (channelId) loadChannel();
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChannel = async () => {
    setLoading(true);
    try {
      const [channelRes, messagesRes] = await Promise.all([
        channelService.getById(channelId!),
        channelService.getMessages(channelId!),
      ]);
      setChannel(channelRes.data.data.channel);
      setMessages(messagesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await channelService.sendMessage(channelId!, newMessage);
      setMessages([...messages, response.data.data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: message.createdAt, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Channel not found</p>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Channel header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <HashtagIcon className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{channel.name}</h1>
          {channel.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{channel.description}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <HashtagIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Welcome to #{channel.name}
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              This is the start of the #{channel.name} channel.
            </p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {formatDate(group.date)}
                </span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>
              {group.messages.map((message) => (
                <div key={message._id} className="flex gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                    {message.senderId.avatar ? (
                      <img src={message.senderId.avatar} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {message.senderId.firstName?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {message.senderId.firstName} {message.senderId.lastName}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                      {message.isEdited && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{message.content}</p>
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {message.reactions.map((reaction, i) => (
                          <button
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-gray-600 dark:text-gray-400">{reaction.users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={`Message #${channel.name}`}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={1}
            />
            <button
              type="button"
              className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="p-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
