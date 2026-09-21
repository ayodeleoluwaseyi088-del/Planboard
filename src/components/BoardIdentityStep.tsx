import React, { useRef } from 'react';
import { Check, Plus } from 'lucide-react';
import { BOARD_AVATARS } from '../utils/boardAvatars';

interface BoardIdentityStepProps {
  currentUsername: string;
  currentAvatar?: string;
  useCustomName: boolean;
  setUseCustomName: (useCustom: boolean) => void;
  customDisplayName: string;
  setCustomDisplayName: (name: string) => void;
  selectedAvatar: string;
  setSelectedAvatar: (avatarUrl: string) => void;
  boardTitle?: string;
  boardEmoji?: string;
  hideStepBanner?: boolean;
}

const SUGGESTED_NAMES = ['Captain', 'King', 'Chief', 'Princess', 'Star'];

export const BoardIdentityStep: React.FC<BoardIdentityStepProps> = ({
  currentUsername,
  useCustomName,
  setUseCustomName,
  customDisplayName,
  setCustomDisplayName,
  selectedAvatar,
  setSelectedAvatar,
}) => {
  const customInputRef = useRef<HTMLInputElement | null>(null);

  const hasCustomText = customDisplayName.trim().length > 0;
  const isCustomSelected = useCustomName && hasCustomText;
  const isCustomActiveEmpty = useCustomName && !hasCustomText;
  const isCurrentUsernameSelected = !useCustomName;

  const handleSelectCurrentUsername = () => {
    setUseCustomName(false);
  };

  const handleActivateCustomName = () => {
    setUseCustomName(true);
    setTimeout(() => {
      customInputRef.current?.focus();
    }, 50);
  };

  const handleSelectSuggestion = (name: string) => {
    setCustomDisplayName(name);
    setUseCustomName(true);
    setTimeout(() => {
      customInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 select-none">
      {/* 1. Board Display Name Section */}
      <div>
        <div className="text-xs sm:text-[13px] font-bold text-[#808897] mb-2.5">
          Board Display Name
        </div>

        {/* Display Name 2-Column Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Left Block: Current Username */}
          <button
            type="button"
            onClick={handleSelectCurrentUsername}
            className={`relative w-full text-left px-4 py-3.5 rounded-2xl transition cursor-pointer flex items-center min-h-[52px] ${
              isCurrentUsernameSelected
                ? 'bg-[#FFF9F0] border-2 border-[#EFA00E]'
                : 'bg-[#F8F9FB] border-2 border-transparent hover:border-[#DFE1E6]'
            }`}
          >
            {isCurrentUsernameSelected && (
              <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 rounded-full bg-[#EFA00E] text-white flex items-center justify-center shadow-xs z-10 pointer-events-none">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
            <div className="truncate text-xs sm:text-[13px] leading-tight">
              <span className="font-bold text-[#1A1B25]">
                User current username{' '}
              </span>
              <span className="font-medium text-[#808897]">
                &ldquo;{currentUsername}&rdquo;
              </span>
            </div>
          </button>

          {/* Right Block: Customize Name */}
          <div
            onClick={handleActivateCustomName}
            className={`relative w-full text-left px-4 py-3.5 rounded-2xl transition cursor-pointer flex items-center min-h-[52px] ${
              isCustomSelected
                ? 'bg-[#FFF9F0] border-2 border-[#EFA00E]'
                : isCustomActiveEmpty
                ? 'bg-[#F8F9FB] border-2 border-[#DFE1E6]'
                : 'bg-[#F8F9FB] border-2 border-transparent hover:border-[#DFE1E6]'
            }`}
          >
            {isCustomSelected && (
              <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 rounded-full bg-[#EFA00E] text-white flex items-center justify-center shadow-xs z-10 pointer-events-none">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}

            <input
              ref={customInputRef}
              type="text"
              value={customDisplayName}
              onChange={(e) => {
                setCustomDisplayName(e.target.value);
                if (!useCustomName) {
                  setUseCustomName(true);
                }
              }}
              onFocus={() => {
                if (!useCustomName) {
                  setUseCustomName(true);
                }
              }}
              placeholder="Customize name here e.g captain, starboy"
              className={`w-full bg-transparent outline-none text-xs sm:text-[13px] placeholder-[#808897] ${
                isCustomSelected
                  ? 'font-bold text-[#1A1B25]'
                  : 'font-medium text-[#1A1B25]'
              }`}
            />
          </div>
        </div>

        {/* Suggested Name Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {SUGGESTED_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelectSuggestion(name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F6F8FA] border border-[#DFE1E6] text-xs sm:text-[13px] font-semibold text-[#666D80] hover:text-[#1A1B25] transition cursor-pointer select-none shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#808897] stroke-[2.2]" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Board Avatar Section */}
      <div className="pt-2">
        <div className="text-xs sm:text-[13px] font-bold text-[#808897] mb-2.5">
          Board Avatar
        </div>

        {/* Single Row of 12 Circular Avatars */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
          {BOARD_AVATARS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.url;

            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.url)}
                className={`relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition cursor-pointer select-none ${
                  isSelected
                    ? 'border-2 border-[#EFA00E] bg-white shadow-2xs'
                    : 'border-2 border-transparent bg-[#F8F9FB] hover:bg-[#ECEFF3]'
                }`}
                title={avatar.name}
              >
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#EFA00E] text-white flex items-center justify-center shadow-xs z-10 pointer-events-none">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain pointer-events-none"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
