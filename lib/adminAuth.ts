export function getAdminPassword(): string {
  if (typeof window === 'undefined') return '12345';
  return localStorage.getItem('adminPassword') || '12345';
}

export function setAdminPassword(newPassword: string) {
  localStorage.setItem('adminPassword', newPassword);
}