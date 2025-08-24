import React from 'react';
import { SCHEDULER_CONSTANTS } from '../constants';

export function SchedulerSkeleton() {
    return (
        <div className="flex h-full flex-col">
            {/* Plan Tabs Skeleton */}
            <div className="flex h-12 items-center border-b border-gray-200 px-4">
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
                <div className="ml-4 h-8 w-24 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Main Content Skeleton */}
            <div className="relative flex-1 overflow-hidden">
                <div className="absolute inset-0 overflow-auto">
                    {/* Time Grid Skeleton */}
                    <div className="relative">
                        <div className="sticky top-0 z-10 flex h-8 bg-white">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 border-r border-gray-200"
                                    style={{ width: `${SCHEDULER_CONSTANTS.LAYOUT.PIXELS_PER_HOUR}px` }}
                                />
                            ))}
                        </div>

                        {/* Field Columns Skeleton */}
                        <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 border-r border-gray-200"
                                    style={{ width: `${SCHEDULER_CONSTANTS.LAYOUT.PIXELS_PER_HOUR * 24}px` }}
                                >
                                    <div className="h-8 border-b border-gray-200 bg-gray-50" />
                                    {Array.from({ length: 24 }).map((_, j) => (
                                        <div
                                            key={j}
                                            className="h-16 border-b border-gray-100"
                                        >
                                            <div className="m-2 h-12 animate-pulse rounded bg-gray-200" />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Skeleton */}
            <div className="fixed bottom-4 right-4 flex space-x-2">
                <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
            </div>
        </div>
    );
} 