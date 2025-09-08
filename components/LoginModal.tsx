
import React, { useState } from 'react';
import type { CompanyInfo } from '../types';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/apiService';

interface AuthScreenProps {
    onLogin: (username: string) => void;
    companyInfo: CompanyInfo | null;
}

const LoginModal: React.FC<AuthScreenProps> = ({ onLogin, companyInfo }) => {
    const { t, tWithFallback } = useLanguage();
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showStepModal, setShowStepModal] = useState(false);
    const [selectedStep, setSelectedStep] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username.trim() || !password.trim()) {
            setError(t('login.emptyFields'));
            return;
        }
        setIsLoading(true);

        try {
            if (isLoginView) {
                // Login logic
                const loginSuccess = await api.loginUser(username, password);
                if (loginSuccess) {
                    onLogin(username);
                } else {
                    setError(t('login.invalidCredentials'));
                }
            } else {
                // Signup logic
                const userExists = await api.checkUserExists(username);
                if (userExists) {
                    setError(t('login.usernameExists'));
                } else {
                    await api.createUser(username, password);
                    onLogin(username);
                }
            }
        } catch (err) {
            setError(t('login.unexpectedError'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const howToSteps = [
        { 
            icon: 'fa-user-plus', 
            title: t('howItWorks.signUp'),
            description: tWithFallback('help.step1Desc', 'Create a free account to save and manage your digital business cards securely.')
        },
        { 
            icon: 'fa-palette', 
            title: t('howItWorks.design'),
            description: tWithFallback('help.step2Desc', 'Use our intuitive editor to customize every detail, from layout and colors to AI-generated images, videos, and career history.')
        },
        { 
            icon: 'fa-share-alt', 
            title: t('howItWorks.share'),
            description: tWithFallback('help.step3Desc', 'Save multiple cards to your personal hub. Share them instantly with a link or a scannable QR code.')
        },
        { 
            icon: 'fa-users', 
            title: t('howItWorks.connect'),
            description: tWithFallback('help.step4Desc', 'Find other users, send connection requests, and build your professional circle of mutual connections.')
        },
    ];

    const handleStepClick = (index: number) => {
        setSelectedStep(index);
        setShowStepModal(true);
    };
    
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-[#282728] text-gray-800 dark:text-gray-200">
            {/* Left Side - Features & How it Works */}
            <div className="lg:w-1/2 flex flex-col justify-center p-6 lg:p-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-900 order-first lg:order-first">
                <div className="max-w-lg">
                    <header className="mb-12">
                        {companyInfo?.logo ? (
                            <img src={companyInfo.logo} alt="Company Logo" className="h-16 w-auto mb-6" />
                        ) : (
                            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">ONEPAGE</h1>
                        )}
                        <p className="text-xl text-gray-600 dark:text-neutral-400">
                            {companyInfo?.slogan || tWithFallback('app.subtitle', 'Your digital identity, redefined.')}
                        </p>
                    </header>

                    <div className="space-y-6 lg:space-y-8">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">{t('features.title')}</h2>
                            <div className="space-y-3 lg:space-y-4">
                                <div className="flex items-start gap-2 lg:gap-3">
                                    <i className="fa-solid fa-palette text-lg lg:text-2xl text-blue-500 mt-1 flex-shrink-0"></i>
                                    <div className="text-left flex-1">
                                        <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white">{t('features.customDesign.title')}</h3>
                                        <p className="text-xs lg:text-sm text-gray-600 dark:text-neutral-400">{t('features.customDesign.description')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 lg:gap-3">
                                    <i className="fa-solid fa-share-alt text-lg lg:text-2xl text-green-500 mt-1 flex-shrink-0"></i>
                                    <div className="text-left flex-1">
                                        <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white">{t('features.easySharing.title')}</h3>
                                        <p className="text-xs lg:text-sm text-gray-600 dark:text-neutral-400">{t('features.easySharing.description')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 lg:gap-3">
                                    <i className="fa-solid fa-users text-lg lg:text-2xl text-purple-500 mt-1 flex-shrink-0"></i>
                                    <div className="text-left flex-1">
                                        <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white">{t('features.networkBuilding.title')}</h3>
                                        <p className="text-xs lg:text-sm text-gray-600 dark:text-neutral-400">{t('features.networkBuilding.description')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">{t('howItWorks.title')}</h2>
                            <div className="flex items-center space-x-3 lg:space-x-6">
                                {howToSteps.map((step, index) => (
                                    <React.Fragment key={step.title}>
                                        <div 
                                            className="flex flex-col items-center text-center space-y-1 lg:space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => handleStepClick(index)}
                                        >
                                            <i className={`fa-solid ${step.icon} text-2xl lg:text-3xl text-gray-800 dark:text-white`}></i>
                                            <span className="font-semibold text-xs lg:text-sm text-gray-900 dark:text-white">{step.title}</span>
                                        </div>
                                        {index < howToSteps.length - 1 && (
                                            <div className="h-6 lg:h-8 w-px bg-gray-300 dark:bg-neutral-700"></div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-4 sm:p-6 lg:p-8 order-last lg:order-last">
                {/* Language Toggle - Top Right */}
                <div className="absolute top-4 right-4">
                    <LanguageToggle />
                </div>
                
                <main className="w-full max-w-md mx-auto">

                    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-8 md:p-10 flex flex-col justify-center">
                            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">{isLoginView ? t('login.welcomeBack') : t('login.createAccount')}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{t('login.username')}</label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder={t('login.usernamePlaceholder')}
                                        className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm py-2.5 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{t('login.password')}</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('login.passwordPlaceholder')}
                                        className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm py-2.5 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                        required
                                        autoComplete={isLoginView ? "current-password" : "new-password"}
                                    />
                                </div>
                                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                                <button type="submit" disabled={isLoading} className="w-full px-6 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors mt-2 disabled:opacity-50">
                                    {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : (isLoginView ? t('login.login') : t('login.createAccount'))}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-600 dark:text-neutral-400 mt-6">
                                {isLoginView ? t('login.noAccount') : t('login.haveAccount')}
                                <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-semibold text-gray-800 dark:text-white hover:underline ml-1">
                                    {isLoginView ? t('login.signUp') : t('login.login')}
                                </button>
                            </p>
                        </div>
                    </div>
                </main>
                
            </div>

            {/* Step Detail Modal */}
            {showStepModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-200 dark:bg-neutral-800 rounded-full w-12 h-12 flex items-center justify-center text-xl text-gray-800 dark:text-white">
                                        <i className={`fa-solid ${howToSteps[selectedStep].icon}`}></i>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {howToSteps[selectedStep].title}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setShowStepModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                                >
                                    <i className="fa-solid fa-times text-gray-500 dark:text-neutral-400"></i>
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-neutral-400 leading-relaxed">
                                {howToSteps[selectedStep].description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginModal;
