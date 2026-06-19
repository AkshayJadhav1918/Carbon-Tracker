import { describe, it, expect } from 'vitest';
import { getCategoryLabel, getCategoryEmoji } from '../utils/categoryUtils';

describe('Category Utility Helpers', () => {
  describe('getCategoryLabel', () => {
    it('returns correct label for known categories', () => {
      expect(getCategoryLabel('transport')).toBe('Transport');
      expect(getCategoryLabel('home')).toBe('Home Energy');
      expect(getCategoryLabel('diet')).toBe('Diet');
      expect(getCategoryLabel('consumption')).toBe('Shopping & Goods');
      expect(getCategoryLabel('general')).toBe('General');
    });

    it('capitalizes and returns unknown categories', () => {
      expect(getCategoryLabel('electricity')).toBe('Electricity');
      expect(getCategoryLabel('other')).toBe('Other');
    });
  });

  describe('getCategoryEmoji', () => {
    it('returns correct emoji for known categories', () => {
      expect(getCategoryEmoji('transport')).toBe('🚗');
      expect(getCategoryEmoji('home')).toBe('🏠');
      expect(getCategoryEmoji('diet')).toBe('🥗');
      expect(getCategoryEmoji('consumption')).toBe('🛍️');
      expect(getCategoryEmoji('general')).toBe('🌍');
    });

    it('returns default emoji for unknown categories', () => {
      expect(getCategoryEmoji('other')).toBe('📊');
      expect(getCategoryEmoji('electricity')).toBe('📊');
    });
  });
});
