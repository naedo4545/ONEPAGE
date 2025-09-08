import React from 'react';
import { SOCIAL_ICON_MAP } from '../constants';

interface IconProps {
  name: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, className }) => {
  const icon = SOCIAL_ICON_MAP[name] || SOCIAL_ICON_MAP['website']; 
  return <span className={className}>{icon}</span>;
};

export default Icon;
