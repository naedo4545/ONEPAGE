import React, { useState } from 'react';

const Section: React.FC<{ title: string; description: string; children: React.ReactNode; defaultOpen?: boolean; actions?: React.ReactNode }> = ({ title, description, children, defaultOpen = true, actions }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 transition-all duration-300">
            <div className="w-full flex justify-between items-center p-6 text-left">
                <button 
                  className="flex-grow text-left"
                  onClick={() => setIsOpen(!isOpen)}
                  aria-expanded={isOpen}
                  aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
                    <p className="text-gray-500 dark:text-neutral-400">{description}</p>
                </button>
                <div className="flex items-center gap-2 pl-4">
                    {actions}
                    <button 
                      onClick={() => setIsOpen(!isOpen)} 
                      aria-label={`Toggle ${title} section`}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                      <i className={`fa-solid fa-chevron-down text-gray-500 dark:text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                </div>
            </div>
            {isOpen && (
                <div id={`section-content-${title.replace(/\s+/g, '-')}`} className="p-6 pt-0">
                    <div className="space-y-4">{children}</div>
                </div>
            )}
        </div>
    );
};

export default Section;