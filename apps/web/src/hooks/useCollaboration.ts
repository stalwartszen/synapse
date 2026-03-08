import { useEffect, useRef, useCallback } from 'react';
import { useCollaborationStore, createLocalUser } from '../store/collaborationStore.js';
import { createWSService, destroyWSService, getWSService } from '../services/websocket.js';

const WS_URL = import.meta.env['VITE_WS_URL'] as string | undefined;

interface UseCollaborationOptions {
  graphId: string;
  userName?: string;
  enabled?: boolean;
}

/**
 * Hook that manages the WebSocket connection and collaboration state.
 */
export function useCollaboration({
  graphId,
  userName = 'Anonymous',
  enabled = true,
}: UseCollaborationOptions) {
  const collabStore = useCollaborationStore();
  const initializedRef = useRef(false);

  // Initialize local user once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const user = createLocalUser(userName);
    collabStore.setLocalUser(user);
    collabStore.setGraphId(graphId);
  }, [userName, graphId, collabStore]);

  // Connect WebSocket
  useEffect(() => {
    if (!enabled || !WS_URL) return;

    const localUser = collabStore.localUser;
    if (!localUser) return;

    const ws = createWSService({
      url: `${WS_URL}/graph/${graphId}`,
      graphId,
      userId: localUser.id,
    });

    ws.connect();

    return () => {
      destroyWSService();
    };
  }, [graphId, enabled, collabStore.localUser]);

  // Send cursor position
  const sendCursor = useCallback((worldX: number, worldY: number) => {
    if (!enabled) return;
    const ws = getWSService();
    ws?.sendCursorMove(worldX, worldY);
  }, [enabled]);

  // Send selection change
  const sendSelection = useCallback((nodeId: string | null) => {
    if (!enabled) return;
    const ws = getWSService();
    ws?.sendUserSelect(nodeId);
  }, [enabled]);

  return {
    localUser: collabStore.localUser,
    remoteUsers: Array.from(collabStore.remoteUsers.values()),
    allUsers: collabStore.getAllUsers(),
    isConnected: collabStore.isConnected,
    isConnecting: collabStore.isConnecting,
    connectionError: collabStore.connectionError,
    sendCursor,
    sendSelection,
  };
}
