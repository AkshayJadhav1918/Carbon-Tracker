import React from 'react';

interface SectionHeaderProps {
  icon: string;
  title: string;
  description: string;
  id: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, description, id }) => (
  <div className="flex items-start gap-3 mb-5 pb-3 border-b border-gray-100">
    <span className="text-2xl" aria-hidden="true">{icon}</span>
    <div>
      <h2 id={id} className="text-lg font-bold text-gray-900 font-display">
        {title}
      </h2>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

export default React.memo(SectionHeader);
