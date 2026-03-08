import React from 'react';
import { useCollaborationStore } from '../../store/collaborationStore.js';
import type { CollaborationUser } from '../../types/index.js';
import styles from './CollaborationPanel.module.css';

const MAX_VISIBLE_AVATARS = 5;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

interface UserAvatarProps {
  user: CollaborationUser;
  isLocal?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, isLocal }) => (
  <div
    className={styles.avatar}
    style={{ background: user.color }}
    title={user.name}
  >
    {getInitials(user.name)}
    <span className={styles.tooltip}>
      {user.name}
      {isLocal && <span className={styles.localBadge} style={{ marginLeft: 4 }}>You</span>}
    </span>
  </div>
);

export const CollaborationPanel: React.FC = () => {
  const collabStore = useCollaborationStore();
  const { localUser, remoteUsers, isConnected, isConnecting, connectionError } = collabStore;

  const remoteUserList = Array.from(remoteUsers.values());
  const allUsers = localUser ? [localUser, ...remoteUserList] : remoteUserList;
  const visibleUsers = allUsers.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = allUsers.length - MAX_VISIBLE_AVATARS;

  const wsUrl = import.meta.env['VITE_WS_URL'] as string | undefined;
  const collaborationEnabled = Boolean(wsUrl);

  return (
    <div className={styles.panel}>
      {/* User avatars */}
      {allUsers.length > 0 && (
        <div className={styles.userAvatars}>
          {visibleUsers.map((user) => (
            <UserAvatar
              key={user.id}
              user={user}
              isLocal={user.id === localUser?.id}
            />
          ))}
          {overflowCount > 0 && (
            <div className={`${styles.avatar} ${styles.overflow}`}>
              +{overflowCount}
              <span className={styles.tooltip}>{overflowCount} more users</span>
            </div>
          )}
        </div>
      )}

      {/* Connection status */}
      {collaborationEnabled && (
        <div className={styles.statusBadge}>
          <span
            className={`${styles.dot} ${
              connectionError
                ? styles.offline
                : isConnected
                ? styles.connected
                : isConnecting
                ? styles.connecting
                : styles.offline
            }`}
          />
          {connectionError
            ? 'Disconnected'
            : isConnected
            ? `${remoteUserList.length > 0 ? `${remoteUserList.length + 1} online` : 'Connected'}`
            : isConnecting
            ? 'Connecting…'
            : 'Offline'}
        </div>
      )}
    </div>
  );
};
