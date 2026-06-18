// Friendly labels mapper matching X(r) in original JS
export const getCategoryLabel = (category: string): string => {
  const map: Record<string, string> = {
    transport: 'Transport',
    home: 'Home Energy',
    diet: 'Diet',
    consumption: 'Shopping & Goods',
    general: 'General',
  };
  return map[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

// Category emojis
export const getCategoryEmoji = (category: string): string => {
  const map: Record<string, string> = {
    transport: '🚗',
    home: '🏠',
    diet: '🥗',
    consumption: '🛍️',
    general: '🌍',
  };
  return map[category] || '📊';
};
