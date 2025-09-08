import React from 'react';

const StatisticsPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistics</h1>
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-md p-8 text-center">
                <i className="fa-solid fa-chart-pie text-5xl text-gray-400 dark:text-neutral-600"></i>
                <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-neutral-200">Advanced Statistics Coming Soon</h2>
                <p className="mt-2 text-gray-500 dark:text-neutral-400">This section will provide in-depth analytics on user engagement, card creation trends, and more.</p>
            </div>
        </div>
    );
};

export default StatisticsPage;
