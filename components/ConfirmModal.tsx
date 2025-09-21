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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-[#4a3f36] border-4 border-[#8a6a4f] shadow-[8px_8px_0px_#1a1515] p-6">
        <h2 className="text-2xl text-[#f5b342] mb-4">{title}</h2>
        <div className="text-[#f0e9d6] my-6">
          {children}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <PixelatedButton onClick={onClose} className="bg-gray-600 border-gray-700 shadow-[4px_4px_0px_#222] hover:bg-gray-500">
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
