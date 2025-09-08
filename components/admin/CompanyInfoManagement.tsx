
import React, { useState, useEffect } from 'react';
import type { CompanyInfo } from '../../types';
import { api } from '../../services/apiService';

const DEFAULT_COMPANY_INFO: CompanyInfo = {
    logo: '',
    slogan: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    legal: '',
};

interface CompanyInfoManagementProps {
    onInfoUpdate: () => void;
}

const InputField: React.FC<{
    label: string;
    name: keyof CompanyInfo;
    value: string;
    onChange: (field: keyof CompanyInfo, value: string) => void;
    type?: string;
}> = ({ label, name, value, onChange, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
    </div>
);

const CompanyInfoManagement: React.FC<CompanyInfoManagementProps> = ({ onInfoUpdate }) => {
    const [info, setInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
    const [isLoading, setIsLoading] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const loadInfo = async () => {
            setIsLoading(true);
            try {
                const companyInfo = await api.getCompanyInfo();
                if (companyInfo) {
                    setInfo(companyInfo);
                }
            } catch (error) {
                console.error("Failed to load company info:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInfo();
    }, []);

    const handleChange = (field: keyof CompanyInfo, value: string) => {
        setInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('logo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = async () => {
        try {
            await api.saveCompanyInfo(info);
            onInfoUpdate();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error("Failed to save company info:", error);
            alert("Could not save company information.");
        }
    };
    
    if (isLoading) {
        return <div className="text-center py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading company info...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Information</h1>
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-md">
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">Company Logo</label>
                        <div className="flex items-center gap-4">
                            {info.logo && <img src={info.logo} alt="Current logo" className="h-16 w-16 object-contain rounded-md bg-gray-100 dark:bg-neutral-800 p-1" />}
                            <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 dark:file:bg-neutral-700 file:text-gray-800 dark:file:text-white hover:file:bg-gray-300 dark:hover:file:bg-neutral-600"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputField label="Company Name" name="name" value={info.name} onChange={handleChange} />
                       <InputField label="Slogan" name="slogan" value={info.slogan} onChange={handleChange} />
                       <InputField label="Email" name="email" value={info.email} type="email" onChange={handleChange} />
                       <InputField label="Phone" name="phone" value={info.phone} type="tel" onChange={handleChange} />
                    </div>
                    <InputField label="Address" name="address" value={info.address} onChange={handleChange} />
                    <InputField label="Legal Info / Copyright" name="legal" value={info.legal} onChange={handleChange} />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 flex justify-end items-center gap-4">
                    {saveSuccess && <p className="text-sm text-green-600 dark:text-green-400"><i className="fa-solid fa-check mr-2"></i>Information saved successfully!</p>}
                    <button onClick={handleSave} className="px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-200 transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanyInfoManagement;
