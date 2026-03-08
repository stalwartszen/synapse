import React from 'react';

export type IconName =
  | 'cursor'
  | 'plus-node'
  | 'plus-edge'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-fit'
  | 'layout'
  | 'export'
  | 'search'
  | 'close'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'trash'
  | 'edit'
  | 'tag'
  | 'users'
  | 'undo'
  | 'redo'
  | 'grid'
  | 'circle-layout'
  | 'hierarchy'
  | 'force-layout'
  | 'menu'
  | 'settings'
  | 'copy'
  | 'link'
  | 'download'
  | 'image'
  | 'file-json'
  | 'brain'
  | 'check'
  | 'info'
  | 'warning'
  | 'error'
  | 'node-concept'
  | 'node-resource'
  | 'node-question'
  | 'node-insight'
  | 'node-custom';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  title?: string;
}

const paths: Record<IconName, string | React.ReactNode> = {
  cursor: (
    <path
      d="M5 3l14 9-7.5 1.5L9 20 5 3z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  'plus-node': (
    <>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  'plus-edge': (
    <>
      <circle cx="5" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="19" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M14 9l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'zoom-in': (
    <>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  'zoom-out': (
    <>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  'zoom-fit': (
    <>
      <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
      <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
      <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
      <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
    </>
  ),
  layout: (
    <>
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="19" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M7 5h10M19 7l-7 10M5 7l7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  export: (
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  close: (
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  ),
  'chevron-left': (
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'chevron-right': (
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'chevron-down': (
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'chevron-up': (
    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  tag: (
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  undo: (
    <path d="M3 10h10a6 6 0 016 6v2M3 10l4-4M3 10l4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  redo: (
    <path d="M21 10H11a6 6 0 00-6 6v2M21 10l-4-4M21 10l-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
      <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
      <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
      <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
    </>
  ),
  'circle-layout': (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
      <circle cx="12" cy="3" r="1.5" fill="currentColor" />
      <circle cx="20.2" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="20.2" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="21" r="1.5" fill="currentColor" />
      <circle cx="3.8" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="3.8" cy="8.5" r="1.5" fill="currentColor" />
    </>
  ),
  hierarchy: (
    <>
      <circle cx="12" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="6" cy="21" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="18" cy="21" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M12 5v5M12 10L6 12M12 10L18 12M6 14v5M18 14v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  'force-layout': (
    <>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="19" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="5" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="19" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M6.5 6.5L10.5 10.5M13.5 10.5L17.5 6.5M13.5 13.5L17.5 17.5M10.5 13.5L6.5 17.5" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
  menu: (
    <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  link: (
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'file-json': (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M10 13v2a1 1 0 001 1M13 13v2a1 1 0 001 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  brain: (
    <>
      <path d="M12 5C9 5 7 7 7 9.5c0 1 .3 2 1 2.5C6.5 13 6 14.5 6 16c0 2.5 1.5 4 3 4h6c1.5 0 3-1.5 3-4 0-1.5-.5-3-2-4 .7-.5 1-1.5 1-2.5C17 7 15 5 12 5z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M12 5v15M9 9h6M8 13h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  check: (
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  warning: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  'node-concept': (
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
  ),
  'node-resource': (
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
  ),
  'node-question': (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  'node-insight': (
    <>
      <path d="M9 18h6M10 22h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.5 4.5 0 006 9.5 4.5 4.5 0 009.5 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  'node-custom': (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
  ),
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  color = 'currentColor',
  className,
  title,
}) => {
  const content = paths[name];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={!title}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {content}
    </svg>
  );
};
