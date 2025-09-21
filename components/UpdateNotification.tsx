import React from 'react';
import PixelatedButton from './PixelatedButton';
import { UpdateIcon } from './icons/UpdateIcon';

interface UpdateNotificationProps {
  onUpdate: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-[#4a3f36] border-4 border-[#f5b342] shadow-[8px_8px_0px_#1a1515] p-4 flex items-center gap-4">
        <div>
          <h3 className="text-white text-lg">Update Available!</h3>
          <p className="text-sm text-[#b0a08f]">A new version of the game is ready.</p>
        </div>
        <PixelatedButton 
            onClick={onUpdate} 
            className="bg-green-700 hover:bg-green-600 border-green-800 shadow-[4px_4px_0px_#14532d] flex items-center gap-2"
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
