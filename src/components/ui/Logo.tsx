import React from 'react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    className?: string;
}

const sizeMap = {
    sm: { img: 'h-8', text: 'text-lg' },
    md: { img: 'h-10', text: 'text-xl' },
    lg: { img: 'h-14', text: 'text-2xl' },
    xl: { img: 'h-18', text: 'text-3xl' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
    const { img, text } = sizeMap[size];

    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <img
                src="/logo-cavendish.png"
                alt="Cavendish Consultoria Empresarial"
                className={`${img} w-auto object-contain`}
            />
            {showText && (
                <span className={`font-bold text-foreground ${text}`}>
                    Sistema<span className="text-primary">GIG</span>
                </span>
            )}
        </div>
    );
}

export default Logo;
