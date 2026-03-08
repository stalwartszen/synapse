import { useRef, useEffect, useCallback, useState } from 'react';
import { useUIStore } from '../store/uiStore.js';
import { zoomToward, fitToView, screenToWorld } from '../utils/canvas.js';
import type { GraphNode } from '@synapse/core';

interface CanvasInteractionOptions {
  nodes: GraphNode[];
  onDragEnd: ((nodeId: string, x: number, y: number) => void) | undefined;
  onCanvasClick?: (worldX: number, worldY: number) => void;
}

/**
 * Hook that manages canvas setup, pixel ratio, zoom/pan, and resize.
 */
export function useCanvas(options: CanvasInteractionOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const resetView = useUIStore((s) => s.resetView);

  // ── HiDPI setup ─────────────────────────────────────────────────────────────

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    return { width: rect.width, height: rect.height };
  }, []);

  // ── Resize observer ──────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.scale(dpr, dpr);
          setCanvasSize({ width, height });
        }
      }
    });

    observer.observe(canvas);
    const size = setupCanvas(canvas);
    setCanvasSize(size);

    return () => observer.disconnect();
  }, [setupCanvas]);

  // ── Wheel zoom ───────────────────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const focalX = e.clientX - rect.left;
      const focalY = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? 1 : -1;
      const newView = zoomToward(view, delta, focalX, focalY);
      setView(newView);
    },
    [view, setView],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Pan (drag on background) ─────────────────────────────────────────────────

  const panState = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      panState.current = {
        isPanning: true,
        startX: clientX,
        startY: clientY,
        startPanX: view.panX,
        startPanY: view.panY,
      };
    },
    [view],
  );

  const updatePan = useCallback(
    (clientX: number, clientY: number) => {
      if (!panState.current.isPanning) return;
      const dx = clientX - panState.current.startX;
      const dy = clientY - panState.current.startY;
      setView({
        panX: panState.current.startPanX + dx,
        panY: panState.current.startPanY + dy,
      });
    },
    [setView],
  );

  const endPan = useCallback(() => {
    panState.current.isPanning = false;
  }, []);

  // ── Node drag ────────────────────────────────────────────────────────────────

  const dragState = useRef<{
    isDragging: boolean;
    nodeId: string | null;
    startWorldX: number;
    startWorldY: number;
    startNodeX: number;
    startNodeY: number;
  }>({
    isDragging: false,
    nodeId: null,
    startWorldX: 0,
    startWorldY: 0,
    startNodeX: 0,
    startNodeY: 0,
  });

  const startNodeDrag = useCallback(
    (
      nodeId: string,
      clientX: number,
      clientY: number,
      nodePosition: { x: number; y: number },
      canvasRect: DOMRect,
    ) => {
      const world = screenToWorld(clientX - canvasRect.left, clientY - canvasRect.top, view);
      dragState.current = {
        isDragging: true,
        nodeId,
        startWorldX: world.x,
        startWorldY: world.y,
        startNodeX: nodePosition.x,
        startNodeY: nodePosition.y,
      };
    },
    [view],
  );

  const getNodeDragPosition = useCallback(
    (clientX: number, clientY: number, canvasRect: DOMRect) => {
      if (!dragState.current.isDragging || !dragState.current.nodeId) return null;
      const world = screenToWorld(clientX - canvasRect.left, clientY - canvasRect.top, view);
      const dx = world.x - dragState.current.startWorldX;
      const dy = world.y - dragState.current.startWorldY;
      return {
        nodeId: dragState.current.nodeId,
        x: dragState.current.startNodeX + dx,
        y: dragState.current.startNodeY + dy,
      };
    },
    [view],
  );

  const endNodeDrag = useCallback(
    (clientX: number, clientY: number, canvasRect: DOMRect) => {
      if (!dragState.current.isDragging || !dragState.current.nodeId) return;
      const pos = getNodeDragPosition(clientX, clientY, canvasRect);
      if (pos && options.onDragEnd) {
        options.onDragEnd(pos.nodeId, pos.x, pos.y);
      }
      dragState.current.isDragging = false;
      dragState.current.nodeId = null;
    },
    [getNodeDragPosition, options],
  );

  // ── Fit to view ───────────────────────────────────────────────────────────────

  const fitView = useCallback(() => {
    const newView = fitToView(options.nodes, canvasSize);
    setView(newView);
  }, [options.nodes, canvasSize, setView]);

  // ── Zoom controls ─────────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => {
    const cx = canvasSize.width / 2;
    const cy = canvasSize.height / 2;
    setView(zoomToward(view, 1, cx, cy));
  }, [view, canvasSize, setView]);

  const zoomOut = useCallback(() => {
    const cx = canvasSize.width / 2;
    const cy = canvasSize.height / 2;
    setView(zoomToward(view, -1, cx, cy));
  }, [view, canvasSize, setView]);

  // ── Animation frame ───────────────────────────────────────────────────────────

  const requestRender = useCallback((renderFn: () => void) => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(renderFn);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return {
    canvasRef,
    canvasSize,
    view,
    setView,
    resetView,
    fitView,
    zoomIn,
    zoomOut,
    startPan,
    updatePan,
    endPan,
    isPanning: () => panState.current.isPanning,
    startNodeDrag,
    getNodeDragPosition,
    endNodeDrag,
    isDraggingNode: () => dragState.current.isDragging,
    getDraggedNodeId: () => dragState.current.nodeId,
    requestRender,
  };
}
