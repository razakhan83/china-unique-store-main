'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-8 h-8 flex items-center justify-center opacity-0"><i className="fa-solid fa-circle-half-stroke"></i></div>;
    }

    const currentTheme = theme === 'system' ? resolvedTheme : theme;

    return (
        <button
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            className="icon-btn theme-toggle-btn bg-transparent border-none text-xl text-white cursor-pointer relative flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Toggle Dark Mode"
        >
            {currentTheme === 'dark' ? (
                <i className="fa-solid fa-sun text-accent drop-shadow-md"></i>
            ) : (
                <i className="fa-solid fa-moon drop-shadow-md"></i>
            )}
        </button>
    );
}
