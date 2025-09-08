



import React, { useState } from 'react';
import type { BusinessCardData, SocialLink, ContactInfo, ThemeColors, CareerEntry, Media, UserMetadata } from '../types';
import { SOCIAL_PLATFORMS, CONTACT_TYPES, FONT_OPTIONS, THEMES, LAYOUTS } from '../constants';
import ImageUploader from './ImageUploader';
import Section from './Section';
import ColorPicker from './ColorPicker';
import { useLanguage } from '../contexts/LanguageContext';

const InputField: React.FC<{ label: string; name: keyof BusinessCardData | keyof CareerEntry; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = ({ label, name, value, onChange, placeholder }) => (
  <div>
    <label htmlFor={name.toString()} className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{label}</label>
    <input
      type="text"
      id={name.toString()}
      name={name.toString()}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
    />
  </div>
);

const FontStyleControl: React.FC<{
    label: string;
    size: number;
    weight: number;
    color: string;
    onSizeChange: (value: number) => void;
    onWeightChange: (value: number) => void;
    onColorChange: (value: string) => void;
}> = ({ label, size, weight, color, onSizeChange, onWeightChange, onColorChange }) => (
    <div className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800">
        <label className="font-medium text-sm text-gray-900 dark:text-white mb-2 block">{label}</label>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
             <div className="flex items-center gap-1 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-md p-1">
                 <input type="number" value={size} onChange={e => onSizeChange(parseInt(e.target.value, 10))} className="w-full bg-transparent text-sm text-center focus:outline-none"/>
                 <span className="text-xs text-gray-500 dark:text-neutral-400 pr-1">px</span>
            </div>
           
            <select value={weight} onChange={e => onWeightChange(parseInt(e.target.value, 10))} className="bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded-md p-1 text-sm h-full">
                <option value="100">Thin</option><option value="300">Light</option><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option><option value="900">Black</option>
            </select>
            
            <div className="relative h-8 w-8" title={`Current color: ${color}`}>
                <div
                    className="w-full h-full rounded-full border border-gray-300 dark:border-neutral-600"
                    style={{ backgroundColor: color }}
                />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label={`Select color for ${label}`}
                />
            </div>
        </div>
    </div>
);


interface CardFormProps {
  data: BusinessCardData;
  theme: ThemeColors;
  userMetadata: UserMetadata | null;
  onDataChange: (field: keyof BusinessCardData, value: any) => void;
  onContactInfoChange: (newContacts: ContactInfo[]) => void;
  onSocialLinksChange: (newLinks: SocialLink[]) => void;
  onCareerHistoryChange: (newHistory: CareerEntry[]) => void;
  onThemeChange: (theme: ThemeColors) => void;
  onThemeColorChange: (colorName: keyof ThemeColors, value: string) => void;
  onStyleReset: () => void;
  onTypographyReset: () => void;
  onMediaReset: () => void;
  onBasicInfoReset: () => void;
  onContactInfoReset: () => void;
  onSocialLinksReset: () => void;
  onCareerHistoryReset: () => void;
  activeSection?: string | null;
}

const CardForm: React.FC<CardFormProps> = ({
  data,
  theme,
  userMetadata,
  onDataChange,
  onContactInfoChange,
  onSocialLinksChange,
  onCareerHistoryChange,
  onThemeChange,
  onThemeColorChange,
  onStyleReset,
  onTypographyReset,
  onMediaReset,
  onBasicInfoReset,
  onContactInfoReset,
  onSocialLinksReset,
  onCareerHistoryReset,
  activeSection,
}) => {
    const { t, tWithFallback } = useLanguage();
    const [draggedItem, setDraggedItem] = useState<{ listName: string; index: number } | null>(null);
    const [dropTarget, setDropTarget] = useState<{ listName: string; index: number } | null>(null);

    const handleItemChange = <T extends { id: string }>(
        items: T[], 
        itemId: string, 
        field: keyof T, 
        value: any, 
        callback: (newItems: T[]) => void
    ) => {
        const newItems = items.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
        );
        callback(newItems);
    };

    const handleAddItem = <T extends object>(
        items: T[], 
        newItem: T, 
        callback: (newItems: T[]) => void
    ) => {
        callback([...items, newItem]);
    };

    const handleRemoveItem = <T extends { id: string }>(
        items: T[], 
        itemId: string, 
        callback: (newItems: T[]) => void
    ) => {
        callback(items.filter(item => item.id !== itemId));
    };
    
    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, listName: string, index: number) => {
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ listName, index });
    };

    const handleDragOver = (e: React.DragEvent, listName: string, index: number) => {
        e.preventDefault();
        if (draggedItem && draggedItem.listName === listName) {
            setDropTarget({ listName, index });
        }
    };

    const handleDrop = (e: React.DragEvent, listName: string) => {
        e.preventDefault();
        if (!draggedItem || !dropTarget || draggedItem.listName !== listName || draggedItem.index === dropTarget.index) {
            return;
        }

        let items: any[], callback: (newItems: any[]) => void;
        if (listName === 'contactInfo') {
            items = data.contactInfo;
            callback = onContactInfoChange;
        } else if (listName === 'socialLinks') {
            items = data.socialLinks;
            callback = onSocialLinksChange;
        } else { // careerHistory
            items = data.careerHistory;
            callback = onCareerHistoryChange;
        }

        const newItems = [...items];
        const [removed] = newItems.splice(draggedItem.index, 1);
        newItems.splice(dropTarget.index, 0, removed);
        callback(newItems);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDropTarget(null);
    };
    
    const ResetButton: React.FC<{ onClick: () => void, title: string }> = ({ onClick, title }) => (
        <button onClick={onClick} title={title} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400">
            <i className="fa-solid fa-undo"></i>
        </button>
    );
    
    const handleAppearanceReset = () => {
        onStyleReset();
        onTypographyReset();
    };

    const renderContent = () => (
        <>
            {(!activeSection || activeSection === 'Appearance') && (
            <Section 
                title={tWithFallback('editor.appearance', 'Appearance')} 
                description={tWithFallback('editor.appearanceDesc', 'Customize colors, fonts, and layout.')}
                actions={<ResetButton onClick={handleAppearanceReset} title={tWithFallback('editor.resetAppearance', 'Reset Appearance')} />}
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">{tWithFallback('editor.layout', 'Layout')}</label>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.entries(LAYOUTS).map(([id, { name, thumbnail }]) => (
                            <button 
                                key={id}
                                onClick={() => onDataChange('layout', id as BusinessCardData['layout'])}
                                className={`border-2 rounded-lg overflow-hidden transition-all duration-200 ${data.layout === id ? 'border-black dark:border-white ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-neutral-900' : 'border-gray-300 dark:border-neutral-700 hover:border-gray-500 dark:hover:border-neutral-500'}`}
                                title={`Select ${name} layout`}
                            >
                                <img src={thumbnail} alt={`${name} layout preview`} className="w-full h-auto bg-gray-200 dark:bg-neutral-800 aspect-[2/3]" />
                                <span className="block text-xs font-semibold p-1 bg-white dark:bg-neutral-900">{name}</span>
                            </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">{tWithFallback('editor.colorTheme', 'Color Theme')}</label>
                        <ColorPicker themes={THEMES} selectedTheme={theme} onThemeChange={onThemeChange} />
                    </div>
                     <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2">{tWithFallback('editor.baseFontFamily', 'Base Font Family')}</label>
                            <select
                                value={data.fontFamily}
                                onChange={(e) => onDataChange('fontFamily', e.target.value)}
                                className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                            >
                                {Object.entries(FONT_OPTIONS).map(([name, family]) => (
                                    <option key={name} value={family}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <FontStyleControl 
                                label="Name"
                                size={data.nameFontSize}
                                weight={data.nameFontWeight}
                                color={data.nameFontColor}
                                onSizeChange={value => onDataChange('nameFontSize', value)}
                                onWeightChange={value => onDataChange('nameFontWeight', value)}
                                onColorChange={value => onDataChange('nameFontColor', value)}
                            />
                             <FontStyleControl 
                                label="Title"
                                size={data.titleFontSize}
                                weight={data.titleFontWeight}
                                color={data.titleFontColor}
                                onSizeChange={value => onDataChange('titleFontSize', value)}
                                onWeightChange={value => onDataChange('titleFontWeight', value)}
                                onColorChange={value => onDataChange('titleFontColor', value)}
                            />
                             <FontStyleControl 
                                label="Company"
                                size={data.companyFontSize}
                                weight={data.companyFontWeight}
                                color={data.companyFontColor}
                                onSizeChange={value => onDataChange('companyFontSize', value)}
                                onWeightChange={value => onDataChange('companyFontWeight', value)}
                                onColorChange={value => onDataChange('companyFontColor', value)}
                            />
                             <FontStyleControl 
                                label="Base Text"
                                size={data.baseFontSize}
                                weight={data.baseFontWeight}
                                color={data.baseFontColor}
                                onSizeChange={value => onDataChange('baseFontSize', value)}
                                onWeightChange={value => onDataChange('baseFontWeight', value)}
                                onColorChange={value => onDataChange('baseFontColor', value)}
                            />
                        </div>
                    </div>
                </div>
            </Section>
            )}
            
            {(!activeSection || activeSection === 'Media') && (
            <Section 
                title={tWithFallback('editor.media', 'Media')} 
                description={tWithFallback('editor.mediaDesc', 'Upload banner and profile media.')}
                actions={<ResetButton onClick={onMediaReset} title={tWithFallback('editor.resetMedia', 'Reset Media')} />}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-start">
                     <ImageUploader
                        label={tWithFallback('editor.bannerImage', 'Banner Image / Video')}
                        value={data.bannerImage}
                        onValueChange={(media: Media) => onDataChange('bannerImage', media)}
                        aspectRatio="1:1"
                        userMetadata={userMetadata}
                        skipEditor
                    />
                    <ImageUploader
                        label={tWithFallback('editor.profileImage', 'Profile Image / Video')}
                        value={data.profilePicture}
                        onValueChange={(media: Media) => onDataChange('profilePicture', media)}
                        aspectRatio="1:1"
                        userMetadata={userMetadata}
                    />
                </div>
            </Section>
            )}
            
            {(!activeSection || activeSection === 'Basic Information') && (
            <Section 
                title={tWithFallback('editor.basicInfo', 'Basic Information')} 
                description={tWithFallback('editor.basicInfoDesc', 'Enter your core personal details.')}
                actions={<ResetButton onClick={onBasicInfoReset} title={tWithFallback('editor.resetBasicInfo', 'Reset Basic Information')} />}
            >
                <div className="space-y-4">
                    <InputField label={tWithFallback('editor.name', 'Full Name')} name="name" value={data.name} onChange={e => onDataChange('name', e.target.value)} />
                    <InputField label={tWithFallback('editor.title', 'Title / Position')} name="title" value={data.title} onChange={e => onDataChange('title', e.target.value)} />
                    <InputField label={tWithFallback('editor.company', 'Company / Organization')} name="company" value={data.company} onChange={e => onDataChange('company', e.target.value)} />
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">{tWithFallback('editor.bio', 'Bio')}</label>
                        <textarea
                            id="bio"
                            name="bio"
                            rows={3}
                            value={data.bio}
                            onChange={e => onDataChange('bio', e.target.value)}
                            placeholder={tWithFallback('editor.bioPlaceholder', 'A short professional summary...')}
                            className="w-full bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                    </div>
                </div>
            </Section>
            )}

            {(!activeSection || activeSection === 'Contact Information') && (
            <Section 
                title={tWithFallback('editor.contactInfo', 'Contact Information')} 
                description={tWithFallback('editor.contactInfoDesc', 'How people can reach you.')}
                actions={<ResetButton onClick={onContactInfoReset} title={tWithFallback('editor.resetContactInfo', 'Reset Contact Information')} />}
            >
                <div className="space-y-3" onDrop={(e) => handleDrop(e, 'contactInfo')} onDragEnd={handleDragEnd}>
                    {data.contactInfo.map((contact, index) => (
                         <div 
                            key={contact.id} 
                            className={`relative flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 transition-opacity ${draggedItem?.listName === 'contactInfo' && draggedItem.index === index ? 'opacity-30' : ''}`}
                            onDragOver={(e) => handleDragOver(e, 'contactInfo', index)}
                         >
                            {dropTarget?.listName === 'contactInfo' && dropTarget.index === index && (
                                <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                            )}
                             <div 
                                className="flex items-center self-stretch justify-center px-1 cursor-grab shrink-0"
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, 'contactInfo', index)}
                             >
                                <i className="fa-solid fa-grip-vertical text-gray-400 dark:text-neutral-500"></i>
                            </div>
                            <div className="flex-grow flex flex-wrap sm:flex-nowrap items-center gap-2">
                                <select value={contact.type} onChange={e => handleItemChange(data.contactInfo, contact.id, 'type', e.target.value as ContactInfo['type'], onContactInfoChange)} className="bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded-md p-2 w-full sm:w-auto">
                                    {CONTACT_TYPES.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                                </select>
                                <input type="text" value={contact.value} onChange={e => handleItemChange(data.contactInfo, contact.id, 'value', e.target.value, onContactInfoChange)} className="flex-grow bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded-md shadow-sm p-2 text-sm w-full" placeholder="Enter value..."/>
                            </div>
                            <button onClick={() => handleRemoveItem(data.contactInfo, contact.id, onContactInfoChange)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                    ))}
                    <button onClick={() => handleAddItem(data.contactInfo, { id: crypto.randomUUID(), type: 'email', value: '' }, onContactInfoChange)} className="w-full text-center px-4 py-2 border border-dashed border-gray-400 dark:border-neutral-600 text-xs font-medium rounded-md text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:border-gray-500 dark:hover:border-neutral-500 transition-colors">
                        <i className="fa-solid fa-plus mr-2"></i>{tWithFallback('editor.addContactMethod', 'Add Contact Method')}
                    </button>
                </div>
            </Section>
            )}

            {(!activeSection || activeSection === 'Social Media Links') && (
            <Section 
                title={tWithFallback('editor.socialLinks', 'Social Media Links')} 
                description={tWithFallback('editor.socialLinksDesc', 'Links to your online profiles.')}
                actions={<ResetButton onClick={onSocialLinksReset} title="Reset Social Media Links" />}
            >
                <div className="space-y-3" onDrop={(e) => handleDrop(e, 'socialLinks')} onDragEnd={handleDragEnd}>
                    {data.socialLinks.map((link, index) => (
                         <div
                            key={link.id}
                            className={`relative flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 transition-opacity ${draggedItem?.listName === 'socialLinks' && draggedItem.index === index ? 'opacity-30' : ''}`}
                            onDragOver={(e) => handleDragOver(e, 'socialLinks', index)}
                        >
                            {dropTarget?.listName === 'socialLinks' && dropTarget.index === index && (
                                <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                            )}
                             <div
                                className="flex items-center self-stretch justify-center px-1 cursor-grab shrink-0"
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, 'socialLinks', index)}
                             >
                                <i className="fa-solid fa-grip-vertical text-gray-400 dark:text-neutral-500"></i>
                            </div>
                             <div className="flex-grow flex flex-wrap sm:flex-nowrap items-center gap-2">
                                <select value={link.platform} onChange={e => handleItemChange(data.socialLinks, link.id, 'platform', e.target.value, onSocialLinksChange)} className="bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded-md p-2 w-full sm:w-auto">
                                    {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                                <input type="text" value={link.url} onChange={e => handleItemChange(data.socialLinks, link.id, 'url', e.target.value, onSocialLinksChange)} className="flex-grow bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded-md shadow-sm p-2 text-sm w-full" placeholder="Enter full URL..."/>
                            </div>
                            <button onClick={() => handleRemoveItem(data.socialLinks, link.id, onSocialLinksChange)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                    ))}
                    <button onClick={() => handleAddItem(data.socialLinks, { id: crypto.randomUUID(), platform: 'website', url: 'https://' }, onSocialLinksChange)} className="w-full text-center px-4 py-2 border border-dashed border-gray-400 dark:border-neutral-600 text-xs font-medium rounded-md text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:border-gray-500 dark:hover:border-neutral-500 transition-colors">
                        <i className="fa-solid fa-plus mr-2"></i>{tWithFallback('editor.addSocialLink', 'Add Social Link')}
                    </button>
                </div>
            </Section>
            )}
            
            {(!activeSection || activeSection === 'Career History') && (
            <Section 
                title={tWithFallback('editor.careerHistory', 'Career History')} 
                description={tWithFallback('editor.careerHistoryDesc', 'Showcase your professional experience.')}
                actions={<ResetButton onClick={onCareerHistoryReset} title="Reset Career History" />}
            >
                <div className="space-y-4" onDrop={(e) => handleDrop(e, 'careerHistory')} onDragEnd={handleDragEnd}>
                    {data.careerHistory.map((entry, index) => (
                        <div 
                            key={entry.id}
                            className={`relative p-4 rounded-lg bg-gray-100 dark:bg-neutral-800 space-y-3 transition-opacity ${draggedItem?.listName === 'careerHistory' && draggedItem.index === index ? 'opacity-30' : ''}`}
                            onDragOver={(e) => handleDragOver(e, 'careerHistory', index)}
                        >
                            {dropTarget?.listName === 'careerHistory' && dropTarget.index === index && (
                                <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                            )}
                            <div className="flex items-start gap-2">
                                 <div
                                    className="flex items-center self-stretch justify-center pt-2 px-1 cursor-grab"
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, 'careerHistory', index)}
                                 >
                                    <i className="fa-solid fa-grip-vertical text-gray-400 dark:text-neutral-500 my-2"></i>
                                </div>
                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InputField label={tWithFallback('editor.jobTitle', 'Job Title')} name="title" value={entry.title} onChange={e => handleItemChange(data.careerHistory, entry.id, 'title', e.target.value, onCareerHistoryChange)} />
                                    <InputField label={tWithFallback('editor.company', 'Company')} name="company" value={entry.company} onChange={e => handleItemChange(data.careerHistory, entry.id, 'company', e.target.value, onCareerHistoryChange)} />
                                    <InputField label={tWithFallback('editor.startDate', 'Start Date')} name="startDate" value={entry.startDate} onChange={e => handleItemChange(data.careerHistory, entry.id, 'startDate', e.target.value, onCareerHistoryChange)} />
                                    <InputField label={tWithFallback('editor.endDate', 'End Date')} name="endDate" value={entry.endDate} onChange={e => handleItemChange(data.careerHistory, entry.id, 'endDate', e.target.value, onCareerHistoryChange)} />
                                     <div className="sm:col-span-2">
                                        <textarea value={entry.description} onChange={e => handleItemChange(data.careerHistory, entry.id, 'description', e.target.value, onCareerHistoryChange)} rows={2} placeholder={tWithFallback('editor.description', 'Description...')} className="w-full bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded-md shadow-sm p-2 text-sm" />
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveItem(data.careerHistory, entry.id, onCareerHistoryChange)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => handleAddItem(data.careerHistory, { id: crypto.randomUUID(), title: '', company: '', startDate: '', endDate: 'Present', description: '' }, onCareerHistoryChange)} className="w-full text-center px-4 py-2 border border-dashed border-gray-400 dark:border-neutral-600 text-xs font-medium rounded-md text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:border-gray-500 dark:hover:border-neutral-500 transition-colors">
                        <i className="fa-solid fa-plus mr-2"></i>{tWithFallback('editor.addCareerEntry', 'Add Career Entry')}
                    </button>
                </div>
            </Section>
            )}
        </>
    );

    return (
        <div className="space-y-6 lg:space-y-8 pb-16 lg:pb-8 p-4 lg:p-0">
           {renderContent()}
        </div>
    );
};

export default CardForm;