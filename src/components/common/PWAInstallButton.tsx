import React, { useState } from 'react';
import { Smartphone, Download, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'compact';
  employeeName?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'primary',
  employeeName,
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already running in standalone PWA mode, don't show the button unless modal is triggered
  if (isInstalled && !modalOpen) {
    return null;
  }

  const handleClick = async () => {
    // If browser supports direct prompt, try installing, else open rich modal
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  let buttonClasses = '';
  if (variant === 'primary') {
    buttonClasses =
      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 border border-emerald-400/40 transition active:scale-95';
  } else if (variant === 'compact') {
    buttonClasses =
      'flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] border border-emerald-500/40 transition';
  } else {
    buttonClasses =
      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition';
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`${buttonClasses} ${className}`}
        title="Install Mobile App / Download APK"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        <span>Install Mobile APK</span>
        <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full bg-white/20 text-[9px] font-extrabold uppercase text-white">
          App
        </span>
      </button>

      <PWAInstallModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employeeName={employeeName}
      />
    </>
  );
};
