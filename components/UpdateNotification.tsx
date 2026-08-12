import React from 'react';
import PixelatedButton from './PixelatedButton';
import { UpdateIcon } from './icons/UpdateIcon';

interface UpdateNotificationProps {
  onUpdate: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-surface border-4 border-accent shadow-hard p-4 flex items-center gap-4">
        <div>
          <h3 className="text-ink-hi text-lg">Update Available!</h3>
          <p className="text-sm text-ink-dim"></p>
        </div>
        <PixelatedButton 
            onClick={onUpdate} 
            className="bg-good hover:bg-good-hi border-good-edge shadow-good flex items-center gap-2"
            title="Reload to get the latest version"
        >
            <UpdateIcon className="w-5 h-5" />
            Reload
        </PixelatedButton>
      </div>
       <style>
        {`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default UpdateNotification;
