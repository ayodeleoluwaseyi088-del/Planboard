import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  CheckCircle2, 
  MessageCircle, 
  Share2, 
  Smartphone, 
  QrCode, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
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
  const whatsappMessage = `Guys, join the plan for ${board.title} on Plan Board:\n\n${shareUrl}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#ECEFF3] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ECEFF3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1A1B25]">
                Invite to Plan Board
              </h3>
              <p className="text-xs text-[#666D80]">
                Friends join instantly without mandatory account creation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F6F8FA] text-[#808897] hover:text-[#1A1B25] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* WhatsApp Primary Action */}
          <div>
            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
            >
              <MessageCircle className="w-5 h-5 fill-white/20" />
              <span>Share Directly to WhatsApp</span>
            </button>
          </div>

          {/* Copy Link Input Bar */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#666D80] mb-1.5">
              Shareable Guest Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FB] border border-[#DFE1E6] text-xs font-mono text-[#353849] select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs ${
                  copied
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-[#1A1B25] text-white hover:bg-[#272835]'
                }`}
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Chat Simulation Preview */}
          <div className="bg-[#EFEAE2] rounded-2xl p-4 border border-[#DFE1E6]/80 text-[#1A1B25]">
            <div className="text-[10px] font-bold text-[#666D80] uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>WhatsApp Message Preview</span>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-xs max-w-xs text-xs space-y-1.5">
              <p className="font-normal text-[#1A1B25]">
                Guys, join the plan for <strong className="font-black">{board.title}</strong> 😂
              </p>
              <div className="p-2 rounded-lg bg-[#F8F9FB] border border-[#ECEFF3]">
                <div className="font-extrabold text-[11px] text-[#1A1B25] flex items-center gap-1">
                  <span>{board.emoji}</span>
                  <span>{board.title}</span>
                </div>
                <div className="text-[10px] text-[#666D80]">
                  {board.date ? `${board.date} · ` : ''}{(board.members || []).length} {(board.members || []).length === 1 ? 'person' : 'people'} planning together
                </div>
              </div>
              <div className="text-[9px] text-[#808897] text-right">10:24 AM ✓✓</div>
            </div>
          </div>

          {/* Simulator Button */}
          <div className="pt-2 border-t border-[#ECEFF3]">
            <div className="text-xs text-[#666D80] mb-2 font-medium">
              Want to experience what a recipient experiences when opening this link?
            </div>
            <button
              onClick={() => {
                onClose();
                onLaunchJoinSimulation();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-amber-700" />
              <span>Simulate Recipient Join Experience (30-sec flow)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
