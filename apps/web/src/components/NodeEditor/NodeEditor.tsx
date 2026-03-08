import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@synapse/ui';
import type { NodeType } from '@synapse/core';
import { generateNodeContent, getApiKey, type AIError } from '../../services/aiService.js';
import styles from './NodeEditor.module.css';

const NODE_TYPES: Array<{ type: NodeType; label: string; color: string; icon: string }> = [
  { type: 'concept', label: 'Concept', color: '#3b82f6', icon: '◯' },
  { type: 'resource', label: 'Resource', color: '#22c55e', icon: '▣' },
  { type: 'question', label: 'Question', color: '#eab308', icon: '?' },
  { type: 'insight', label: 'Insight', color: '#a855f7', icon: '★' },
  { type: 'custom', label: 'Custom', color: '#f97316', icon: '✦' },
];

export interface NodeEditorData {
  label: string;
  type: NodeType;
  content: string;
  tags: string[];
}

interface NodeEditorProps {
  mode: 'create' | 'edit';
  initialData: Partial<NodeEditorData> | undefined;
  onSave: (data: NodeEditorData) => void;
  onCancel: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  mode,
  initialData,
  onSave,
  onCancel,
}) => {
  const [label, setLabel] = useState(initialData?.label ?? '');
  const [type, setType] = useState<NodeType>(initialData?.type ?? 'concept');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [labelError, setLabelError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const labelRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus label on mount
    setTimeout(() => labelRef.current?.focus(), 50);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const handleSave = useCallback(() => {
    const trimmed = label.trim();
    if (!trimmed) {
      setLabelError('Label is required');
      labelRef.current?.focus();
      return;
    }
    onSave({ label: trimmed, type, content: content.trim(), tags });
  }, [label, type, content, tags, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave();
      }
    },
    [handleSave],
  );

  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag();
      } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [addTag, tagInput, tags],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onCancel();
    },
    [onCancel],
  );

  const handleGenerateContent = useCallback(async () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setLabelError('Enter a label first');
      return;
    }
    if (!getApiKey()) {
      setGenerateError('No API key. Set one in Settings (,).');
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const generated = await generateNodeContent(trimmedLabel, type, []);
      setContent(generated);
    } catch (e) {
      const err = e as AIError;
      setGenerateError(err.message ?? 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  }, [label, type]);

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label={mode === 'create' ? 'Create node' : 'Edit node'}>
      <div className={styles.panel} onKeyDown={handleKeyDown}>
        <div className={styles.header}>
          <h2 className={styles.title}>{mode === 'create' ? 'New Node' : 'Edit Node'}</h2>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Label */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="node-label">Label *</label>
            <input
              id="node-label"
              ref={labelRef}
              className={styles.input}
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (e.target.value.trim()) setLabelError('');
              }}
              placeholder="Node label…"
              maxLength={120}
            />
            {labelError && (
              <span style={{ color: 'var(--color-status-error)', fontSize: 'var(--text-xs)' }}>
                {labelError}
              </span>
            )}
          </div>

          {/* Type */}
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <div className={styles.typeGrid}>
              {NODE_TYPES.map((opt) => (
                <button
                  key={opt.type}
                  className={`${styles.typeOption} ${type === opt.type ? styles.selectedType : ''}`}
                  style={{ '--type-color': opt.color } as React.CSSProperties}
                  onClick={() => setType(opt.type)}
                  type="button"
                >
                  <span style={{ fontSize: 20, color: opt.color, lineHeight: 1 }}>{opt.icon}</span>
                  <span className={styles.typeName}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className={styles.field}>
            <label className={styles.label}>Tags</label>
            <div
              className={styles.tagsInput}
              onClick={() => tagInputRef.current?.focus()}
            >
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                  <button
                    className={styles.tagRemove}
                    onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <Icon name="close" size={10} />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                className={styles.tagInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? 'Add tags…' : ''}
              />
            </div>
          </div>

          {/* Content */}
          <div className={styles.field}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label className={styles.label} htmlFor="node-content">
                Content
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={styles.contentHint}>Supports Markdown</span>
                {getApiKey() && (
                  <button
                    type="button"
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    style={{
                      padding: '2px 8px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 5,
                      color: '#6366f1',
                      fontSize: 11,
                      cursor: isGenerating ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Generate content with AI"
                  >
                    {isGenerating ? '⟳ Generating…' : '✨ Generate with AI'}
                  </button>
                )}
              </div>
            </div>
            {generateError && (
              <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 4 }}>{generateError}</div>
            )}
            <textarea
              id="node-content"
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write notes, markdown, links…"
              rows={6}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave} type="button">
            {mode === 'create' ? 'Create Node' : 'Save Changes'}
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>⌘↵</span>
          </button>
        </div>
      </div>
    </div>
  );
};
