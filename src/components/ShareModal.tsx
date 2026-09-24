import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone,
} from 'lucide-react';
import { ShareFat } from '@phosphor-icons/react';
import { PlanBoard } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  board: PlanBoard;
  onClose: () => void;
  onLaunchJoinSimulation: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  board,
  onClose,
  onLaunchJoinSimulation,
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?join=${board.id}`
    : `https://planboard.app/join/${board.id}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const memberCount = (board.members || []).length;
  const memberText = `${memberCount} ${memberCount === 1 ? 'person' : 'people'} planning together`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[560px] rounded-[32px] shadow-2xl border border-[#ECEFF3] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-7 py-5 border-b border-[#ECEFF3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShareFat weight="fill" className="w-6 h-6 text-[#1A1B25] shrink-0" />
            <div>
              <h2 className="text-xl sm:text-[22px] font-extrabold text-[#1A1B25] tracking-tight leading-tight">
                Invite to Plan Board
              </h2>
              <p className="text-xs sm:text-sm text-[#808897] font-normal mt-0.5">
                Friends join instantly without mandatory account creation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#808897] hover:text-[#1A1B25] flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Shareable Link Section */}
          <div>
            <label className="block text-sm sm:text-[15px] font-semibold text-[#1A1B25] mb-2.5">
              Shareable link
            </label>
            <div className="w-full h-14 px-4 sm:px-5 rounded-2xl bg-[#F8F9FB] border border-[#ECEFF3] flex items-center">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-transparent text-sm sm:text-[15px] text-[#666D80] font-normal truncate outline-none select-all cursor-text"
              />
            </div>
          </div>

          {/* WhatsApp Message Preview Card */}
          <div className="bg-[#FFF9F2] rounded-2xl p-5 sm:p-6">
            <div className="text-sm sm:text-[15px] font-semibold text-[#1A1B25] mb-3.5">
              WhatsApp Message Preview
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs">
              <div className="font-bold text-[#1A1B25] text-sm sm:text-[15px] leading-snug">
                Guys, join the plan for {board.title} 🎉😂
              </div>
              <div className="text-xs sm:text-sm text-[#353849] font-normal mt-1.5">
                {memberText}
              </div>
            </div>
          </div>

          {/* Primary Action: Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-4 px-6 rounded-full bg-[#1A1B25] hover:bg-[#272835] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5] text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 stroke-[2]" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="border-t border-[#ECEFF3] pt-1" />

          {/* Simulation Section */}
          <div>
            <div className="text-xs sm:text-sm font-medium text-[#1A1B25] mb-3">
              Want to experience what a recipient experiences when opening this link?
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLaunchJoinSimulation();
              }}
              className="w-full py-4 px-5 rounded-2xl sm:rounded-[20px] bg-[#FFF9F0] hover:bg-[#FFF4E0] active:scale-[0.99] border border-[#FCD34D] transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs"
            >
              <Smartphone className="w-5 h-5 text-[#EFA00E] stroke-[2.2]" />
              <span className="font-bold text-xs sm:text-sm text-[#EFA00E]">
                Stimulate Recipient Join Experience (30-sec flow)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

