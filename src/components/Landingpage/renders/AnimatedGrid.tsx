import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

const GRID_SIZE = 12;
const TOTAL_LINES = GRID_SIZE * 4;

export default function AnimatedGrid() {
    const [activeLine, setActiveLine] = useState(0);
    const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const gridItems = useMemo(() => {
        const items = [];
        for (let i = 0; i <= GRID_SIZE; i++) {
            const position = (i / GRID_SIZE) * 100;
            items.push({ x1: 0, y1: position, x2: 100, y2: position, type: 'horizontal' });
            items.push({ x1: position, y1: 0, x2: position, y2: 100, type: 'vertical' });
        }
        return items;
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveLine((prevLine) => (prevLine + 1) % TOTAL_LINES);
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const calculateOpacity = (yPosition: number, type: string) => {
        if (type === 'horizontal') {
            const fadeFactor = 1 - (yPosition / 100);
            return fadeFactor * 0.15 + 0.05;
        }
        return 0.1;
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCursorPosition({ x, y });
    };

    const getDistanceFromCursor = (item: any) => {
        const itemX = (item.x1 + item.x2) / 2;
        const itemY = (item.y1 + item.y2) / 2;
        const dx = cursorPosition.x - itemX;
        const dy = cursorPosition.y - itemY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    return (
        <div className="absolute inset-0 overflow-hidden">
            <motion.svg
                className="absolute inset-0 w-full h-full"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(29, 78, 216, 0.15), transparent 80%)' }}
            >
                <defs>
                    <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.5 }} />
                        <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.5 }} />
                        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.5 }} />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <motion.g>
                    {gridItems.map((item, index) => {
                        const opacity = calculateOpacity(item.y1, item.type);
                        const isActive = index === activeLine;
                        const distance = getDistanceFromCursor(item);
                        const interactionScale = isHovered ? Math.max(0.1, 1 - distance / 100) : 0;
                        
                        return (
                            <motion.line
                                key={index}
                                x1={`${item.x1}%`}
                                y1={`${item.y1}%`}
                                x2={`${item.x2}%`}
                                y2={`${item.y2}%`}
                                stroke={isActive || (isHovered && distance < 30) ? "url(#gridGradient)" : "#4a5568"}
                                strokeWidth={isActive ? 2 : 1}
                                initial={false}
                                animate={{
                                    opacity: isActive ? 0.8 : opacity + (interactionScale * 0.4),
                                    filter: (isActive || (isHovered && distance < 30)) ? 'url(#glow)' : 'none',
                                    scale: 1 + (interactionScale * 0.1),
                                }}
                                transition={{
                                    duration: 0.2,
                                    ease: "easeOut"
                                }}
                                style={{
                                    transformOrigin: 'center',
                                    transform: `translate(${isHovered ? (cursorPosition.x - 50) * 0.02 * interactionScale : 0}px, 
                                               ${isHovered ? (cursorPosition.y - 50) * 0.02 * interactionScale : 0}px)`
                                }}
                            />
                        );
                    })}
                </motion.g>

                {isHovered && (
                    <motion.circle
                        cx={cursorPosition.x + "%"}
                        cy={cursorPosition.y + "%"}
                        r="80"
                        fill="url(#gridGradient)"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.15, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </motion.svg>
        </div>
    );
}
