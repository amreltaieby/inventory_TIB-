export default function TermsPage() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '60px 24px', fontFamily: 'sans-serif', lineHeight: 1.7, color: '#334155' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Terms & Conditions</h1>
      <p>By using NOVIQ Inventory, you agree to use the service only for lawful business inventory management purposes. Access is provided per company account, and account credentials should not be shared outside your organization.</p>
      <p>We reserve the right to suspend accounts found to be in violation of these terms, including unauthorized access attempts or misuse of shared data.</p>

      <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', marginTop: '40px' }}>Terms of Service</h1>
      <p>NOVIQ Inventory is provided as-is. While we take reasonable steps to keep the service available and your data secure, we do not guarantee uninterrupted access and recommend maintaining your own backups of critical business records.</p>
      <p>Data submitted to the platform, including inventory records and employee information, remains the property of the subscribing company. We do not sell or share your business data with third parties.</p>
      <a href="/" style={{ color: '#2563eb', fontSize: '14px' }}>Back to home</a>
    </div>
  );
}