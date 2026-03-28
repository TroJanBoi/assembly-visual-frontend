import React from 'react';
import { HiOutlineMail } from "react-icons/hi";

interface ProfileCardProps {
  avatarUrl: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  // These props are kept for compatibility but ignored in usage
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  miniAvatarUrl?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  avatarUrl,
  name = 'User',
  title = 'Member',
  handle,
  status,
  contactText = 'Contact',
  className = '',
  onContactClick
}) => {
  return (
    <div className={`p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300 w-full max-w-sm ${className}`}>
      
      {/* Avatar Container */}
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 shadow-md">
          <img 
            src={avatarUrl} 
            alt={name} 
            className="w-full h-full object-cover"
            onError={(e) => {
                // Fallback to initial if image fails
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
            }}
          />
        </div>
        
        {/* Status Indicator */}
        {status && (
            <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white border-2 border-slate-900 shadow-sm">
                {status}
            </div>
        )}
      </div>

      {/* Info */}
      <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
      <p className="text-sm font-medium text-indigo-400 mb-1">{title}</p>
      {handle && <p className="text-xs text-slate-500 mb-6">@{handle}</p>}

      {/* Action */}
      <button 
        onClick={onContactClick}
        className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 group"
      >
        <HiOutlineMail className="group-hover:text-indigo-400 transition-colors" />
        {contactText}
      </button>

    </div>
  );
};

export default React.memo(ProfileCard);
