import React from "react";

interface InfoCardProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, description, icon }) => {
    return (
        <div className="bg-secondary text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            {icon && (
                <div className="flex justify-center items-center text-3xl mb-4 text-indigo-600">
                    {icon}
                </div>
            )}
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
    );
};
