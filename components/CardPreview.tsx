import React, { forwardRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { BusinessCardData, ThemeColors, ContactInfo, Media } from '../types';
import { CONTACT_ICON_MAP, SOCIAL_ICON_MAP } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const generateVCard = (data: BusinessCardData): string => {
  const { name, title, company, contactInfo } = data;
  
  let vCard = 'BEGIN:VCARD\n';
  vCard += 'VERSION:3.0\n';
  
  const nameParts = name.split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ');
  vCard += `N:${lastName};${firstName};;;\n`;
  vCard += `FN:${name}\n`;
  
  vCard += `ORG:${company}\n`;
  vCard += `TITLE:${title}\n`;
  
  contactInfo.forEach(info => {
    switch (info.type) {
      case 'phone':
        vCard += `TEL;TYPE=WORK,VOICE:${info.value}\n`;
        break;
      case 'email':
        vCard += `EMAIL:${info.value}\n`;
        break;
      case 'website':
        vCard += `URL:${info.value}\n`;
        break;
       case 'address':
        vCard += `ADR;TYPE=WORK:;;${info.value}\n`;
        break;
    }
  });

  vCard += 'END:VCARD';
  
  return vCard;
};


const QRCodeComponent: React.FC<{ cardData: BusinessCardData; theme: ThemeColors, className?: string, bgColor?: string }> = ({ cardData, theme, className = "", bgColor }) => {
  const vCard = generateVCard(cardData);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (vCard) {
      QRCode.toDataURL(vCard, {
        margin: 1,
        width: 150,
        color: {
          dark: theme.primary,
          light: bgColor || theme.background
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error("Failed to generate QR Code:", err);
      });
    }
  }, [vCard, theme, bgColor]);
  
  if (!vCard || !qrCodeUrl) return <div aria-label="Loading QR Code" className={`bg-gray-200 dark:bg-neutral-800 rounded-lg shadow-md animate-pulse ${className}`} />;
  
  return <img src={qrCodeUrl} alt="QR Code for vCard contact details" className={`rounded-lg shadow-md ${className}`} />;
};

const getContactLink = (info: ContactInfo): string => {
    switch (info.type) {
        case 'phone': return `tel:${info.value}`;
        case 'email': return `mailto:${info.value}`;
        case 'website': return info.value.startsWith('http') ? info.value : `https://${info.value}`;
        case 'address': return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.value)}`;
        case 'youtube': return info.value.startsWith('https://') ? info.value : `https://www.youtube.com/${info.value.startsWith('@') ? '' : 'c/'}${info.value}`;
        default: return '#';
    }
};

const MediaDisplay: React.FC<{media: Media, defaultIcon: string, mediaType: string, theme: ThemeColors, className?: string}> = ({media, defaultIcon, mediaType, theme, className}) => {
    const { tWithFallback } = useLanguage();
    const isVideo = media?.src ? (media.src.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(media.src)) : false;

    const mediaStyles: React.CSSProperties = {};
    if (isVideo && media.zoom && media.position) {
        mediaStyles.transform = `translate(${media.position.x}px, ${media.position.y}px) scale(${media.zoom})`;
        mediaStyles.objectPosition = 'center center';
        mediaStyles.width = '100%';
        mediaStyles.height = '100%';
        mediaStyles.objectFit = 'cover';
    }

    return media?.src ? (
        isVideo ? (
            <div className={`w-full h-full overflow-hidden ${className}`}>
                 <video 
                    src={media.src}
                    style={mediaStyles}
                    autoPlay loop muted playsInline 
                    key={media.src}
                    crossOrigin="anonymous"
                />
            </div>
        ) : (
            <img 
                src={media.src}
                alt={mediaType}
                className={className}
                crossOrigin="anonymous"
            />
        )
    ) : (
        <div className={`flex flex-col items-center justify-center text-neutral-500 p-2 text-center ${className}`} style={{backgroundColor: theme.accent}}>
            <i className={`fa-solid ${defaultIcon} text-4xl`}></i>
            <span className="mt-2 text-sm font-semibold">{tWithFallback(`editor.${mediaType.toLowerCase()}`, mediaType)}</span>
        </div>
    );
};

const SharedContent: React.FC<{data: BusinessCardData, theme: ThemeColors}> = ({data, theme}) => {
  const { tWithFallback } = useLanguage();
  
  return (
  <>
    {data.careerHistory && data.careerHistory.length > 0 && (
        <div className="text-left py-6 space-y-4 w-full">
            <h3 className="text-center font-bold text-lg uppercase tracking-wider" style={{color: theme.primary}}>{tWithFallback('editor.career', 'Career')}</h3>
            <div className="relative border-l-2 ml-4" style={{borderColor: theme.accent}}>
                {data.careerHistory.map((entry) => (
                    <div key={entry.id} className="mb-8 ml-8">
                        <span className="absolute w-4 h-4 rounded-full -left-[9px] border-4" style={{backgroundColor: theme.primary, borderColor: theme.background}}></span>
                        <h4 className="font-semibold break-words" style={{color: theme.primary}}>{entry.title} @ {entry.company}</h4>
                        <p className="opacity-80" style={{fontSize: '0.9em'}}>{entry.startDate} - {entry.endDate}</p>
                        <p className="mt-1 break-words" style={{fontSize: '0.95em'}}>{entry.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )}

    <div className="flex-grow"></div>
    
    <div className="flex flex-col items-start gap-2 my-4 w-full">
      {data.contactInfo.map((info) => (
          <a href={getContactLink(info)} key={info.id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
              <span className="text-lg w-5 text-center transition-transform group-hover:scale-110" style={{ color: theme.primary }}>{CONTACT_ICON_MAP[info.type]}</span>
              <span className="group-hover:underline break-all">{info.value}</span>
          </a>
      ))}
    </div>
    
    <div className="flex justify-center my-4">
        <div>
          <QRCodeComponent cardData={data} theme={theme} className="w-32 h-32" />
        </div>
    </div>

    <div className="flex items-center gap-4 justify-center flex-wrap">
      {data.socialLinks.map((link) => (
          <a href={link.url} key={link.id} target="_blank" rel="noopener noreferrer" className="text-2xl transition-transform hover:scale-110" style={{ color: theme.primary }} aria-label={link.platform}>
              {SOCIAL_ICON_MAP[link.platform]}
          </a>
      ))}
    </div>
  </>
  );
};

const AspectRatioContainer: React.FC<{ aspectRatio: number; children: React.ReactNode; className?: string }> = ({ aspectRatio, children, className = '' }) => {
    // Fallback for invalid aspect ratio to prevent division by zero or negative padding.
    const validAspectRatio = aspectRatio > 0 ? aspectRatio : 16 / 9;
    const paddingTop = `${(1 / validAspectRatio) * 100}%`;

    return (
        <div className={`relative w-full h-0 ${className}`} style={{ paddingTop }}>
            <div className="absolute top-0 left-0 w-full h-full">
                {children}
            </div>
        </div>
    );
};

interface CardPreviewProps {
  data: BusinessCardData;
  theme: ThemeColors;
  isExporting?: boolean;
}

const CardPreview = forwardRef<HTMLDivElement, CardPreviewProps>(({ data, theme, isExporting = false }, ref) => {
  const { 
    bannerImage, profilePicture, name, title, company, bio,
    fontFamily, nameFontSize, nameFontWeight, nameFontColor,
    titleFontSize, titleFontWeight, titleFontColor,
    companyFontSize, companyFontWeight, companyFontColor,
    baseFontSize, baseFontWeight, baseFontColor, layout
  } = data;
  
  const baseTextStyles: React.CSSProperties = {
    color: baseFontColor,
    fontFamily: fontFamily,
    fontSize: `${baseFontSize}px`,
    fontWeight: baseFontWeight,
  };
  
  const cardContentStyles: React.CSSProperties = {
    backgroundColor: theme.background,
    ...baseTextStyles
  };

  const renderClassicLayout = () => (
    <>
      <div className="relative" style={{ backgroundColor: theme.accent }}>
        <div className="relative shrink-0 w-full bg-black/10">
            <AspectRatioContainer aspectRatio={bannerImage.aspectRatio || 16/9}>
              <MediaDisplay media={bannerImage} defaultIcon="fa-image" mediaType="Banner" theme={theme} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
            </AspectRatioContainer>
        </div>
      </div>
      <div className="flex-grow flex flex-col p-6 items-center" style={cardContentStyles}>
        <div className="-mt-14 z-10">
            <div className="relative w-28 rounded-full border-4 shadow-lg overflow-hidden" style={{ borderColor: theme.background, backgroundColor: theme.accent }}>
                 <AspectRatioContainer aspectRatio={1}>
                    <MediaDisplay media={profilePicture} defaultIcon="fa-user" mediaType="Profile" theme={theme} className="w-full h-full object-cover" />
                </AspectRatioContainer>
            </div>
        </div>
        <div className="text-center pt-6">
            <div className="space-y-1">
              <h2 className="font-bold break-words" style={{ color: nameFontColor, fontSize: `${nameFontSize}px`, fontWeight: nameFontWeight }}>{name || 'Your Name'}</h2>
              <p className="text-md break-words" style={{ fontWeight: titleFontWeight, fontSize: `${titleFontSize}px`, color: titleFontColor }}>{title || 'Your Title'}</p>
              <p className="font-semibold break-words" style={{ color: companyFontColor, fontSize: `${companyFontSize}px`, fontWeight: companyFontWeight }}>{company || 'Your Company'}</p>
            </div>
            {bio && <p className="leading-relaxed mt-4 mx-auto max-w-xs text-center break-words" style={{fontSize: '0.95em'}}>{bio}</p>}
        </div>
        <SharedContent data={data} theme={theme} />
      </div>
    </>
  );

  const renderMinimalistLayout = () => (
     <div className="flex-grow flex flex-col p-8 items-center justify-center text-center" style={cardContentStyles}>
        <div className="space-y-1 my-4">
          <h2 className="font-bold break-words" style={{ color: nameFontColor, fontSize: `${nameFontSize}px`, fontWeight: nameFontWeight }}>{name || 'Your Name'}</h2>
          <p className="text-md break-words" style={{ fontWeight: titleFontWeight, fontSize: `${titleFontSize}px`, color: titleFontColor }}>{title || 'Your Title'}</p>
          <p className="font-semibold break-words" style={{ color: companyFontColor, fontSize: `${companyFontSize}px`, fontWeight: companyFontWeight }}>{company || 'Your Company'}</p>
        </div>
        {bio && <p className="leading-relaxed my-4 mx-auto max-w-xs text-center break-words" style={{fontSize: '0.95em'}}>{bio}</p>}
        <div className="my-4 w-full">
            <SharedContent data={data} theme={theme} />
        </div>
     </div>
  );
  
  const renderBannerFocusLayout = () => (
    <div className="relative flex flex-col" style={cardContentStyles}>
        <div className="relative shrink-0 w-full bg-black/10">
            <AspectRatioContainer aspectRatio={bannerImage.aspectRatio || 3/2}>
              <MediaDisplay media={bannerImage} defaultIcon="fa-image" mediaType="Banner" theme={theme} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
            </AspectRatioContainer>
        </div>
        <div className="relative px-6 pb-6 -mt-16 z-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-28 rounded-full border-4 shadow-lg overflow-hidden" style={{ borderColor: theme.background, backgroundColor: theme.accent }}>
                <AspectRatioContainer aspectRatio={1}>
                    <MediaDisplay media={profilePicture} defaultIcon="fa-user" mediaType="Profile" theme={theme} className="w-full h-full object-cover" />
                </AspectRatioContainer>
            </div>
            <div className="space-y-1 mt-4">
              <h2 className="font-bold break-words" style={{ color: nameFontColor, fontSize: `${nameFontSize}px`, fontWeight: nameFontWeight }}>{name || 'Your Name'}</h2>
              <p className="text-md break-words" style={{ fontWeight: titleFontWeight, fontSize: `${titleFontSize}px`, color: titleFontColor }}>{title || 'Your Title'}</p>
              <p className="font-semibold break-words" style={{ color: companyFontColor, fontSize: `${companyFontSize}px`, fontWeight: companyFontWeight }}>{company || 'Your Company'}</p>
            </div>
            {bio && <p className="leading-relaxed mt-4 mx-auto max-w-xs text-center break-words" style={{fontSize: '0.95em'}}>{bio}</p>}
          </div>
        </div>
        <div className="px-6 pb-6 flex-grow flex flex-col">
            <SharedContent data={data} theme={theme} />
        </div>
    </div>
  );

  const renderModernLayout = () => (
    <div className="flex-grow flex flex-col" style={cardContentStyles}>
      {/* Top Section: Profile + Info */}
      <div className="p-6 flex items-center gap-4">
        <div className="relative w-20 rounded-full border-4 shadow-lg shrink-0 overflow-hidden" style={{ borderColor: theme.accent, backgroundColor: theme.accent }}>
            <AspectRatioContainer aspectRatio={1}>
                <MediaDisplay media={profilePicture} defaultIcon="fa-user" mediaType="Profile" theme={theme} className="w-full h-full object-cover" />
            </AspectRatioContainer>
        </div>
        <div className="text-left flex-grow">
            <div className="space-y-0.5">
              <h2 className="font-bold break-words" style={{ color: nameFontColor, fontSize: `${nameFontSize}px`, fontWeight: nameFontWeight }}>{name || 'Your Name'}</h2>
              <p className="text-md break-words" style={{ fontWeight: titleFontWeight, fontSize: `${titleFontSize}px`, color: titleFontColor }}>{title || 'Your Title'}</p>
              <p className="font-semibold break-words" style={{ color: companyFontColor, fontSize: `${companyFontSize}px`, fontWeight: companyFontWeight }}>{company || 'Your Company'}</p>
            </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="relative shrink-0 w-full bg-black/10">
          <AspectRatioContainer aspectRatio={bannerImage.aspectRatio || 16/9}>
            <MediaDisplay media={bannerImage} defaultIcon="fa-image" mediaType="Banner" theme={theme} className="w-full h-full object-cover" />
          </AspectRatioContainer>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-grow flex flex-col items-center">
        {bio && <p className="leading-relaxed my-4 mx-auto max-w-xs text-center break-words" style={{fontSize: '0.95em'}}>{bio}</p>}
        <SharedContent data={data} theme={theme} />
      </div>
    </div>
  );

  const renderLayout = () => {
    switch(layout) {
      case 'modern': return renderModernLayout();
      case 'minimalist': return renderMinimalistLayout();
      case 'banner-focus': return renderBannerFocusLayout();
      case 'classic':
      default: return renderClassicLayout();
    }
  };

  return (
    <div
      ref={ref}
      className="w-full rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col"
    >
      {renderLayout()}
    </div>
  );
});

export default CardPreview;