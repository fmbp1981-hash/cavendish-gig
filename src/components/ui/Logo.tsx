import React from 'react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    className?: string;
}

const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg' },
    md: { icon: 'w-9 h-9', text: 'text-xl' },
    lg: { icon: 'w-11 h-11', text: 'text-2xl' },
    xl: { icon: 'w-14 h-14', text: 'text-3xl' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
    const { icon, text } = sizeMap[size];

    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            {/* Logo Icon - Hexagonal badge with GIG initials */}
            <div className={`${icon} relative flex items-center justify-center`}>
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    className="w-full h-full"
                >
                    {/* Hexagonal background */}
                    <path
                        d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
                        fill="url(#hexGradient)"
                        stroke="url(#borderGradient)"
                        strokeWidth="1"
                    />

                    {/* Inner hexagon accent */}
                    <path
                        d="M20 6 L32 13 L32 27 L20 34 L8 27 L8 13 Z"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="0.5"
                    />

                    {/* GIG text inside */}
                    <text
                        x="20"
                        y="24"
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="Inter, system-ui, sans-serif"
                    >
                        GIG
                    </text>

                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(220 80% 30%)" />
                            <stop offset="100%" stopColor="hsl(195 90% 35%)" />
                        </linearGradient>
                        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(45 100% 50%)" />
                            <stop offset="100%" stopColor="hsl(45 100% 40%)" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {showText && (
                <span className={`font-bold text-foreground ${text}`}>
                    Sistema<span className="text-primary">GIG</span>
                </span>
            )}
        </div>
    );
}

export default Logo;
