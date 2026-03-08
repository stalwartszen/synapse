import React, { useState, useCallback } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '../../services/aiService.js';
import { useUIStore } from '../../store/uiStore.js';
import { useGraph } from '../../hooks/useGraph.js';
import { exportAsJSON } from '../../utils/export.js';
import styles from './Settings.module.css';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const uiStore = useUIStore();
  const graph = useGraph();

  const [apiKey, setApiKeyState] = useState(() => getApiKey() ?? '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveKey = useCallback(() => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      setApiKey(trimmed);
      uiStore.showToast('API key saved', 'success');
    } else {
      clearApiKey();
      uiStore.showToast('API key cleared', 'info');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [apiKey, uiStore]);

  const handleExportData = useCallback(() => {
    exportAsJSON(graph.graph, `synapse-backup-${Date.now()}.json`);
    uiStore.showToast('Data exported', 'success');
  }, [graph, uiStore]);

  const handleImportData = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.nodes && data.edges) {
          // Convert to proper Graph format with Maps
          const nodes = new Map(
            (Array.isArray(data.nodes) ? data.nodes : Object.values(data.nodes)).map((n: unknown) => {
              const node = n as { id: string };
              return [node.id, node];
            })
          );
          const edges = new Map(
            (Array.isArray(data.edges) ? data.edges : Object.values(data.edges)).map((e: unknown) => {
              const edge = e as { id: string };
              return [edge.id, edge];
            })
          );
          graph.loadGraph({ ...data, nodes, edges } as Parameters<typeof graph.loadGraph>[0]);
          uiStore.showToast('Data imported successfully', 'success');
          onClose();
        } else {
          uiStore.showToast('Invalid file format', 'error');
        }
      } catch {
        uiStore.showToast('Failed to import: invalid JSON', 'error');
      }
    };
    input.click();
  }, [graph, uiStore, onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* AI Configuration */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>AI Configuration</h3>
            <p className={styles.sectionDesc}>
              Enter your Anthropic API key to enable AI features (connection suggestions, semantic search, content generation).
              Get a key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className={styles.link}>console.anthropic.com</a>.
            </p>

            <label className={styles.label}>Anthropic API Key</label>
            <div className={styles.keyRow}>
              <input
                className={styles.input}
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                placeholder="sk-ant-..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveKey(); }}
              />
              <button className={styles.toggleBtn} onClick={() => setShowKey((v) => !v)}>
                {showKey ? '🙈' : '👁'}
              </button>
            </div>

            <div className={styles.keyActions}>
              <button className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`} onClick={handleSaveKey}>
                {saved ? '✓ Saved' : 'Save Key'}
              </button>
              {getApiKey() && (
                <button className={styles.clearBtn} onClick={() => { clearApiKey(); setApiKeyState(''); uiStore.showToast('API key cleared', 'info'); }}>
                  Clear Key
                </button>
              )}
            </div>

            {getApiKey() && (
              <div className={styles.keyStatus}>
                <span className={styles.statusDot} /> API key is configured
              </div>
            )}
          </section>

          {/* Appearance */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Appearance</h3>
            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingLabel}>Theme</div>
                <div className={styles.settingDesc}>Currently using dark mode (default)</div>
              </div>
              <div className={styles.badge}>Dark</div>
            </div>
          </section>

          {/* Data */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Data Management</h3>
            <div className={styles.dataActions}>
              <button className={styles.dataBtn} onClick={handleExportData}>
                <span className={styles.dataBtnIcon}>↓</span>
                Export All Data (JSON)
              </button>
              <button className={styles.dataBtn} onClick={handleImportData}>
                <span className={styles.dataBtnIcon}>↑</span>
                Import Data (JSON)
              </button>
            </div>
            <p className={styles.dataNote}>
              Graph data is stored in memory. Use Export to save a backup and Import to restore it.
            </p>
          </section>

          {/* Keyboard shortcuts */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Keyboard Shortcuts</h3>
            <div className={styles.shortcutList}>
              {SHORTCUTS.map((s) => (
                <div key={s.key} className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>{s.label}</span>
                  <kbd className={styles.kbd}>{s.key}</kbd>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const SHORTCUTS: Array<{ key: string; label: string }> = [
  { key: '⌘K', label: 'Command Palette' },
  { key: 'L', label: 'Learning Mode' },
  { key: 'T', label: 'Templates' },
  { key: 'M', label: 'Toggle Minimap' },
  { key: 'F', label: 'Focus Mode' },
  { key: 'A', label: 'AI Suggestions' },
  { key: ',', label: 'Settings' },
  { key: 'N', label: 'Add Node' },
  { key: 'E', label: 'Add Edge' },
  { key: 'V / Esc', label: 'Select Mode' },
  { key: '⌘Z', label: 'Undo' },
  { key: '⌘⇧Z', label: 'Redo' },
  { key: 'Del / Backspace', label: 'Delete selected' },
];
