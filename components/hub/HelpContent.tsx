import React from 'react';

const HowToUseStep: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <li className="flex items-start gap-4">
        <div className="bg-gray-200 dark:bg-neutral-800 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center text-lg text-gray-800 dark:text-white">
            <i className={`fa-solid ${icon}`}></i>
        </div>
        <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400">{children}</p>
        </div>
    </li>
);

const PlanFeature: React.FC<{ children: React.ReactNode, available: boolean }> = ({ children, available }) => (
    <li className={`flex items-center gap-3 ${available ? 'text-gray-800 dark:text-neutral-200' : 'text-gray-400 dark:text-neutral-500'}`}>
        <i className={`fa-solid ${available ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i>
        <span>{children}</span>
    </li>
);

const PlanCard: React.FC<{plan: string, price: string, description: string, features: {text: string, available: boolean}[], popular?: boolean}> = ({ plan, price, description, features, popular }) => (
    <div className={`border rounded-lg p-6 flex flex-col ${popular ? 'border-gray-800 dark:border-white' : 'border-gray-200 dark:border-neutral-700'}`}>
        {popular && <span className="text-xs font-bold uppercase text-gray-800 dark:text-white bg-gray-200 dark:bg-neutral-700 px-3 py-1 rounded-full self-start mb-4">Most Popular</span>}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan}</h3>
        <p className="text-gray-500 dark:text-neutral-400 mt-2">{description}</p>
        <div className="my-6">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{price}</span>
            <span className="text-gray-500 dark:text-neutral-400">{price !== 'Free' && '/ month'}</span>
        </div>
        <ul className="space-y-3 mb-8">
            {features.map((feature, index) => <PlanFeature key={index} available={feature.available}>{feature.text}</PlanFeature>)}
        </ul>
        <button className={`mt-auto w-full py-2.5 font-semibold rounded-lg transition-colors ${popular ? 'bg-gray-900 text-white dark:bg-white dark:text-black hover:bg-gray-700 dark:hover:bg-neutral-200' : 'bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-700'}`}>
            {price === 'Free' ? 'Current Plan' : 'Upgrade Plan'}
        </button>
    </div>
);

const HelpContent: React.FC = () => (
    <div className="max-w-4xl mx-auto space-y-12">
        <section>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-left">How to Use</h2>
            <div className="p-8 md:p-10 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
                <ul className="space-y-6">
                     <HowToUseStep icon="fa-user-plus" title="1. Sign Up">
                        Create a free account to save and manage your digital business cards securely.
                    </HowToUseStep>
                     <HowToUseStep icon="fa-palette" title="2. Design Your Card">
                        Use our intuitive editor to customize every detail, from layout and colors to AI-generated images, videos, and career history.
                    </HowToUseStep>
                     <HowToUseStep icon="fa-share-alt" title="3. Save & Share">
                        Save multiple cards to your personal hub. Share them instantly with a link or a scannable QR code.
                    </HowToUseStep>
                    <HowToUseStep icon="fa-users" title="4. Build Your Network">
                        Find other users, send connection requests, and build your professional circle of mutual connections.
                    </HowToUseStep>
                </ul>
            </div>
        </section>
        <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white text-left">Pricing Plans</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                <PlanCard 
                    plan="Free"
                    price="Free"
                    description="For individuals getting started with their digital identity."
                    features={[
                        { text: '1 User', available: true },
                        { text: 'Up to 3 Digital Cards', available: true },
                        { text: 'Basic Customization', available: true },
                        { text: '3 AI Generations (Total)', available: true },
                        { text: 'QR Code Sharing', available: true },
                        { text: 'Ad-Supported', available: true },
                        { text: 'Community Support', available: false },
                    ]}
                />
                 <PlanCard 
                    plan="Pro"
                    price="$10"
                    description="For professionals who need more features and customization."
                    popular={true}
                    features={[
                        { text: '1 User', available: true },
                        { text: 'Unlimited Digital Cards', available: true },
                        { text: 'Advanced Customization', available: true },
                        { text: '100 AI Generations / month', available: true },
                        { text: 'QR Code Sharing', available: true },
                        { text: 'No Ads', available: true },
                        { text: 'Email Support', available: true },
                    ]}
                />
                 <PlanCard 
                    plan="Enterprise"
                    price="Custom"
                    description="For teams and organizations managing multiple identities."
                    features={[
                        { text: 'Unlimited Users', available: true },
                        { text: 'Unlimited Digital Cards', available: true },
                        { text: 'Team Management Features', available: true },
                        { text: 'Unlimited AI Generations', available: true },
                        { text: 'Custom Branding', available: true },
                        { text: 'No Ads', available: true },
                        { text: 'Dedicated Support', available: true },
                    ]}
                />
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-neutral-400 mt-8">
                Sample-identical or custom work requires a separate production request; pricing is listed per sample.
            </p>
        </section>
    </div>
);

export default HelpContent;