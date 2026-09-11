import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

const defaultProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const Activity: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const AlertOctagon: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const AlertTriangle: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const ArrowRight: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const ArrowUpRight: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export const Battery: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
    <line x1="22" x2="22" y1="11" y2="13" />
  </svg>
);

export const Bell: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const Camera: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const Check: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const CheckCircle: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const CheckCircle2: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ChevronDown: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ChevronUp: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);


export const ChevronRight: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const Clock: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const CloudRain: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 14v6" />
    <path d="M8 14v6" />
    <path d="M12 16v6" />
  </svg>
);

export const Database: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

export const Download: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const FileText: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export const Globe: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const HardDrive: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <line x1="22" y1="12" x2="2" y2="12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    <line x1="6" y1="16" x2="6.01" y2="16" />
    <line x1="10" y1="16" x2="10.01" y2="16" />
  </svg>
);

export const Key: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

export const Layers: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export const Layout: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

export const Lock: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const LogOut: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const MapPin: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const Pause: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

export const PhoneCall: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const Play: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const Radio: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);

export const RotateCcw: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const Server: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

export const Settings: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ShieldAlert: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const ShieldCheck: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Sliders: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export const Sparkles: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
  </svg>
);

export const Upload: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const Users: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const Volume2: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const VolumeX: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
);

export const Wifi: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

export const WifiOff: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

export const X: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const Zap: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const Moon: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const Github: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} {...props}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const Compass: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export const Flame: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const Maximize2: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

export const Cpu: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

export const Menu: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export const TrendingUp: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export const TrendingDown: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);

export const Plus: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const Search: React.FC<IconProps> = ({ size, className, ...props }) => (
  <svg {...defaultProps} width={size || defaultProps.width} height={size || defaultProps.height} className={className} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);


