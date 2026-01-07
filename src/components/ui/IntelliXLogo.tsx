import React from 'react';

interface IntelliXLogoProps {
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    className?: string;
}

const sizeMap = {
    sm: { lockup: 'h-6', icon: 'w-5 h-5', text: 'text-xs' },
    md: { lockup: 'h-8', icon: 'w-6 h-6', text: 'text-sm' },
    lg: { lockup: 'h-10', icon: 'w-8 h-8', text: 'text-base' },
};

const INTELLIX_LOGO_SRC = '/Logotipo-removebg-preview.png';

export function IntelliXLogo({ size = 'sm', showIcon = true, className = '' }: IntelliXLogoProps) {
    const { lockup, icon, text } = sizeMap[size];

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <img
                src={INTELLIX_LOGO_SRC}
                alt="IntelliX.AI"
                className={`${lockup} w-auto select-none`}
                draggable={false}
            />
        </div>
    );
}

// Icon-only version for compact spaces
export function IntelliXIcon({ size = 'sm', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';

    return (
        <svg
            viewBox="0 0 50 45"
            fill="none"
            className={`${sizeClass} text-primary ${className}`}
        >
            {/* Brain outline - rounded organic shape */}
            <path
                d="M25 3 
                   C35 3 44 8 46 18
                   C48 28 42 38 32 42
                   C22 46 10 42 6 32
                   C2 22 8 10 18 5
                   C21 3.5 23 3 25 3Z"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
            />

            {/* Internal neural network - polygon mesh */}
            <path
                d="M18 12 L28 8 L38 14 
                   M18 12 L14 22 L18 32
                   M38 14 L42 24 L36 34
                   M18 32 L28 38 L36 34
                   M18 12 L28 20 L38 14
                   M14 22 L28 20 L42 24
                   M18 32 L28 20 L36 34
                   M28 8 L28 20 L28 38"
                stroke="currentColor"
                strokeWidth="0.8"
                fill="none"
                opacity="0.8"
            />

            {/* Neural connection nodes */}
            <circle cx="28" cy="8" r="2" fill="currentColor" />
            <circle cx="18" cy="12" r="1.8" fill="currentColor" />
            <circle cx="38" cy="14" r="1.8" fill="currentColor" />
            <circle cx="14" cy="22" r="1.6" fill="currentColor" />
            <circle cx="42" cy="24" r="1.6" fill="currentColor" />
            <circle cx="28" cy="20" r="2.5" fill="currentColor" />
            <circle cx="18" cy="32" r="1.8" fill="currentColor" />
            <circle cx="36" cy="34" r="1.8" fill="currentColor" />
            <circle cx="28" cy="38" r="1.6" fill="currentColor" />
        </svg>
    );
}

export default IntelliXLogo;
