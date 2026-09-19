import React, { useState, useEffect } from 'react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  getReminders,
  createReminder,
  triggerTestReminder,
  syncCalendarReminders,
} from '../api';

export default function NotificationCenter({
  isOpen,
  onClose,
  unreadCount = 0,
  onRefreshCount,
  onTriggerToast,
  userEmail = '',
}) {
  const [tab, setTab] = useState('all'); // 'all', 'unread', 'reminders', 'new'
  const [notifications, setNotifications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [desktopPerm, setDesktopPerm] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  // Quick reminder form
  const [remTitle, setRemTitle] = useState('');
  const [remTime, setRemTime] = useState('');
  const [remPriority, setRemPriority] = useState('high');
  const [remEmail, setRemEmail] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [notifRes, remRes] = await Promise.allSettled([
        getNotifications(),
        getReminders(),
      ]);

      if (notifRes.status === 'fulfilled' && notifRes.value?.success) {
        setNotifications(notifRes.value.data || []);
      }
      if (remRes.status === 'fulfilled' && remRes.value?.success) {
        setReminders(remRes.value.data || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleRequestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setDesktopPerm(res);
        if (res === 'granted') {
          new Notification('WorkPilot AI Alerts Enabled', {
            body: 'You will now receive desktop reminders for meetings and urgent tasks.',
          });
        }
      } catch (err) {
        console.warn('Desktop notification request error:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(p => p.map(n => ({ ...n, read: true })));
      onRefreshCount?.();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearNotifications();
      setNotifications([]);
      onRefreshCount?.();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(p => p.map(n => (n.id === id || n._id === id ? { ...n, read: true } : n)));
      onRefreshCount?.();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!remTitle.trim()) return;

    try {
      setActionStatus('Creating reminder...');
      const targetTime = remTime ? new Date(remTime).toISOString() : new Date(Date.now() + 15 * 60000).toISOString();
      await createReminder({
        title: remTitle.trim(),
        due_time: targetTime,
        priority: remPriority,
        channels: remEmail ? ['in_app', 'email'] : ['in_app'],
        recipient_email: userEmail,
      });

      setActionStatus('Reminder scheduled successfully!');
      setRemTitle('');
      setRemTime('');
      setTimeout(() => {
        setActionStatus('');
        setTab('reminders');
        loadData();
      }, 1000);
    } catch (err) {
      setActionStatus(`Failed: ${err.message}`);
    }
  };

  const handleTestAlert = async () => {
    try {
      setActionStatus('Dispatching test alert & email...');
      const res = await triggerTestReminder({
        title: 'WorkPilot Live Test Reminder',
        recipient_email: userEmail,
        priority: 'high',
        channels: ['in_app', 'email'],
        note: 'Testing multi-channel notification engine (Toast, Audio Chime, WebSocket, and Email).',
      });

      onTriggerToast?.({
        id: `toast_${Date.now()}`,
        title: '⏰ Test Alert Dispatched!',
        body: `Real-time test reminder fired. Email sent to ${userEmail || 'registered inbox'}.`,
        priority: 'high',
        type: 'test',
      });

      setActionStatus('Test alert dispatched!');
      setTimeout(() => {
        setActionStatus('');
        loadData();
      }, 1200);
    } catch (err) {
      setActionStatus(`Test failed: ${err.message}`);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      setActionStatus('Scanning calendar events...');
      const res = await syncCalendarReminders();
      setActionStatus(res.message || 'Calendar synced');
      setTimeout(() => {
        setActionStatus('');
        loadData();
      }, 1200);
    } catch (err) {
      setActionStatus(`Sync error: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const displayList = tab === 'unread'
    ? notifications.filter(n => !n.read)
    : tab === 'reminders'
    ? reminders
    : notifications;

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 10,
        width: 380,
        maxHeight: 560,
        background: '#101014',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 24px rgba(59,130,246,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Notifications & Alerts</span>
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 99,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Mark all read
          </button>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>•</span>
          <button
            onClick={handleClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Desktop Push Banner (if not yet granted) */}
      {desktopPerm !== 'granted' && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(59,130,246,0.08)',
          borderBottom: '1px solid rgba(59,130,246,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <div style={{ fontSize: 11, color: '#93c5fd' }}>
            Get native desktop alerts for upcoming meetings
          </div>
          <button
            onClick={handleRequestDesktopPermission}
            style={{
              background: '#3b82f6',
              border: 'none',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Enable
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'reminders', label: `Reminders (${reminders.length})` },
          { id: 'new', label: '+ New' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '9px 4px',
              background: tab === t.id ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: 11,
              fontWeight: tab === t.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: tab === 'new' ? 16 : 8 }}>
        {tab === 'new' ? (
          /* New Reminder Form */
          <form onSubmit={handleCreateReminder} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                Reminder Title
              </label>
              <input
                value={remTitle}
                onChange={e => setRemTitle(e.target.value)}
                placeholder="e.g. Follow up on proposal"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={remTime}
                  onChange={e => setRemTime(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '7px 8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 11,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                  Priority
                </label>
                <select
                  value={remPriority}
                  onChange={e => setRemPriority(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px',
                    background: '#18181f',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                    outline: 'none',
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="emailCheck"
                checked={remEmail}
                onChange={e => setRemEmail(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="emailCheck" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                Send reminder email to {userEmail || 'my registered email'}
              </label>
            </div>

            {actionStatus && (
              <div style={{ fontSize: 11, color: '#34d399', textAlign: 'center', marginTop: 4 }}>
                {actionStatus}
              </div>
            )}

            <button
              type="submit"
              style={{
                marginTop: 6,
                padding: '10px 0',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Reminder
            </button>
          </form>
        ) : loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            Loading alerts...
          </div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            No {tab === 'unread' ? 'unread notifications' : tab === 'reminders' ? 'scheduled reminders' : 'notifications'} at the moment.
          </div>
        ) : (
          displayList.map(item => {
            const isUnread = !item.read;
            const isReminder = tab === 'reminders' || item.type;
            return (
              <div
                key={item.id || item._id}
                onClick={() => !item.read && handleMarkOneRead(item.id || item._id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: isUnread ? 'rgba(59,130,246,0.05)' : 'transparent',
                  borderLeft: isUnread ? '3px solid #3b82f6' : '3px solid transparent',
                  marginBottom: 4,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 2 }}>
                  {item.kind === 'warning' || item.priority === 'urgent' ? '⚠️' : isReminder ? '⏰' : '📬'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: isUnread ? 700 : 500, color: '#fff' }}>
                      {item.title}
                    </span>
                    {item.due_time && (
                      <span style={{ fontSize: 10, color: '#60a5fa', fontFamily: 'monospace' }}>
                        {item.due_time.split('T')[1]?.slice(0, 5) || ''}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 2,
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                  }}>
                    {item.body || item.note || item.message}
                  </div>
                  {item.meeting_link && (
                    <a
                      href={item.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontSize: 10,
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Join Meeting &rarr;
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Quick Actions */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={handleSyncCalendar}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          🔄 Sync Calendar
        </button>
        <button
          onClick={handleTestAlert}
          style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ⚡ Test Alert & Email
        </button>
      </div>
    </div>
  );
}
