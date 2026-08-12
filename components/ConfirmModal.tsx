import React from 'react';
import PixelatedButton from './PixelatedButton';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText: string;
  confirmClass: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmText, confirmClass }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-scrim flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-surface border-4 border-frame shadow-hard p-6">
        <h2 className="text-2xl text-accent mb-4">{title}</h2>
        <div className="text-ink my-6">
          {children}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <PixelatedButton onClick={onClose} className="bg-raised border-frame-dim shadow-hard-sm hover:bg-frame">
            Cancel
          </PixelatedButton>
          <PixelatedButton onClick={onConfirm} className={confirmClass}>
            {confirmText}
          </PixelatedButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
