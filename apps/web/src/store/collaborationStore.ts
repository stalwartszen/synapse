import { create } from 'zustand';
import type { CollaborationUser } from '../types/index.js';
import { colors } from '@synapse/ui';

interface CollaborationState {
  // My identity
  localUser: CollaborationUser | null;
  graphId: string | null;

  // Remote users
  remoteUsers: Map<string, CollaborationUser>;

  // Connection status
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;

  // Actions
  setLocalUser: (user: CollaborationUser) => void;
  setGraphId: (id: string) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  addRemoteUser: (user: CollaborationUser) => void;
  removeRemoteUser: (userId: string) => void;
  updateRemoteUserCursor: (userId: string, x: number, y: number) => void;
  updateRemoteUserSelection: (userId: string, nodeId: string | undefined) => void;
  updateRemoteUser: (userId: string, updates: Partial<CollaborationUser>) => void;
  clearRemoteUsers: () => void;

  // Getters
  getAllUsers: () => CollaborationUser[];
  getRemoteUser: (id: string) => CollaborationUser | undefined;
}

function pickColor(existingColors: string[]): string {
  const available = colors.collaborators.filter((c) => !existingColors.includes(c));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)]!;
  }
  return colors.collaborators[Math.floor(Math.random() * colors.collaborators.length)]!;
}

export function createLocalUser(name: string, existingColors: string[] = []): CollaborationUser {
  return {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    color: pickColor(existingColors),
    avatar: undefined,
    cursor: undefined,
    selectedNodeId: undefined,
    isActive: true,
    joinedAt: Date.now(),
    lastSeenAt: Date.now(),
  };
}

export const useCollaborationStore = create<CollaborationState>()((set, get) => ({
  localUser: null,
  graphId: null,
  remoteUsers: new Map(),
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  reconnectAttempts: 0,

  setLocalUser: (user) => set({ localUser: user }),
  setGraphId: (id) => set({ graphId: id }),
  setConnected: (connected) => set({ isConnected: connected, isConnecting: false }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setConnectionError: (error) => set({ connectionError: error }),
  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

  addRemoteUser: (user) =>
    set((state) => {
      const newUsers = new Map(state.remoteUsers);
      newUsers.set(user.id, user);
      return { remoteUsers: newUsers };
    }),

  removeRemoteUser: (userId) =>
    set((state) => {
      const newUsers = new Map(state.remoteUsers);
      newUsers.delete(userId);
      return { remoteUsers: newUsers };
    }),

  updateRemoteUserCursor: (userId, x, y) =>
    set((state) => {
      const user = state.remoteUsers.get(userId);
      if (!user) return state;
      const newUsers = new Map(state.remoteUsers);
      newUsers.set(userId, { ...user, cursor: { x, y }, lastSeenAt: Date.now() });
      return { remoteUsers: newUsers };
    }),

  updateRemoteUserSelection: (userId, nodeId) =>
    set((state) => {
      const user = state.remoteUsers.get(userId);
      if (!user) return state;
      const newUsers = new Map(state.remoteUsers);
      newUsers.set(userId, { ...user, selectedNodeId: nodeId, lastSeenAt: Date.now() });
      return { remoteUsers: newUsers };
    }),

  updateRemoteUser: (userId, updates) =>
    set((state) => {
      const user = state.remoteUsers.get(userId);
      if (!user) return state;
      const newUsers = new Map(state.remoteUsers);
      newUsers.set(userId, { ...user, ...updates });
      return { remoteUsers: newUsers };
    }),

  clearRemoteUsers: () => set({ remoteUsers: new Map() }),

  getAllUsers: () => {
    const state = get();
    const all: CollaborationUser[] = [];
    if (state.localUser) all.push(state.localUser);
    all.push(...Array.from(state.remoteUsers.values()));
    return all;
  },

  getRemoteUser: (id) => get().remoteUsers.get(id),
}));
