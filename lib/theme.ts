export type Theme = 'light' | 'dark';

export function getColors(theme: Theme) {
  if (theme === 'dark') {
    return {
      pageBg: '#0f172a',
      cardBg: '#1e293b',
      sidebarBg: '#0b1120',
      sidebarButtonBg: 'transparent',
      sidebarButtonActive: '#1e293b',
      text: '#f1f5f9',
      subtext: '#94a3b8',
      border: '#334155',
      inputBg: '#0f172a',
      inputBorder: '#334155',
      rowAlt: '#182338',
    };
  }
  return {
    pageBg: '#f8fafc',
    cardBg: '#ffffff',
    sidebarBg: '#0f172a',
    sidebarButtonBg: 'transparent',
    sidebarButtonActive: '#1e293b',
    text: '#0f172a',
    subtext: '#64748b',
    border: '#e2e8f0',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    rowAlt: '#f8fafc',
  };
}