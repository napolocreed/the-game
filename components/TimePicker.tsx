import React, { useState, useRef, useEffect } from 'react';
import { ClockIcon } from './icons/ClockIcon';
import { formatTimeForDisplay } from '../utils/time';

const timeOptions: string[] = [];
for (let i = 0; i < 24; i++) {
  for (let j = 0; j < 60; j += 30) {
    const hour = i.toString().padStart(2, '0');
    const minute = j.toString().padStart(2, '0');
    timeOptions.push(`${hour}:${minute}`);
  }
}

interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    const handleSelect = (time: string) => {
        onChange(time);
        setIsOpen(false);
    }

    const displayValue = value ? formatTimeForDisplay(value) : 'No Reminder';

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 bg-[#2c2121] border-2 border-[#8a6a4f] focus:outline-none focus:border-[#f5b342] text-left flex justify-between items-center"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span>{displayValue}</span>
                <ClockIcon className="w-5 h-5 text-[#b0a08f]" />
            </button>
            {isOpen && (
                <div 
                    className="absolute z-10 w-full mt-1 bg-[#2c2121] border-2 border-[#8a6a4f] max-h-48 overflow-y-auto"
                    role="listbox"
                >
                    <button
                        role="option"
                        aria-selected={value === ''}
                        onClick={() => handleSelect('')}
                        className="w-full text-left px-3 py-2 hover:bg-[#4a3f36]"
                    >
                        No Reminder
                    </button>
                    {timeOptions.map(time => (
                        <button
                            key={time}
                            role="option"
                            aria-selected={value === time}
                            onClick={() => handleSelect(time)}
                            className="w-full text-left px-3 py-2 hover:bg-[#4a3f36]"
                        >
                            {formatTimeForDisplay(time)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TimePicker;