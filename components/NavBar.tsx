'use client';

import { useState } from 'react';

export default function NavBar(props: { lang: 'en' | 'ar'; setLang: (l: 'en' | 'ar') => void }) {
  const lang = props.lang;
  const setLang = props.setLang;
  const [productsOpen, setProductsOpen] = useState(false);

  const products = [
    { name: lang === 'ar' ? 'نوفيك للمخزون' : 'NOVIQ Inventory', desc: lang === 'ar' ? 'نظام إدارة مخزون فوري للمصانع والورش.' : 'Real-time inventory and stock management for factories and workshops.' },
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
        <div
          onMouseEnter={() => setProductsOpen(true)}
          onMouseLeave={() => setProductsOpen(false)}
          style={{ position: 'relative' }}
        >
          <button style={{ background: 'none', border: 'none', color: '#334155', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: 0 }}>{lang === 'ar' ? 'المنتجات' : 'Products'}</button>
          {productsOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: '16px', display: 'flex', flexDirection: 'row', gap: '16px', whiteSpace: 'nowrap', zIndex: 200 }}>
              {products.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {i > 0 && <div style={{ width: '1px', height: '40px', background: '#cbd5e1' }} />}
                  <div style={{ maxWidth: '220px', whiteSpace: 'normal' }}>
                    <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{p.name}</div>
                    <div style={{ color: '#0f172a', fontSize: '12px', lineHeight: 1.5 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', fontSize: '13px', cursor: 'pointer' }}>{lang === 'en' ? 'العربية' : 'English'}</button>
        <a href="/login" style={{ background: '#0f172a', color: 'white', padding: '7px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>{lang === 'ar' ? 'تسجيل الدخول' : 'Log In'}</a>
        <a href="/consultation" style={{ border: '1px solid #0f172a', color: '#0f172a', padding: '7px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>{lang === 'ar' ? 'اطلب استشارة' : 'Request a Consultation'}</a>
        <a href="/register" style={{ background: '#16a34a', color: 'white', padding: '7px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>{lang === 'ar' ? 'سجل شركتك' : 'Register Company'}</a>
      </div>

      <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', textShadow: '1px 1px 3px rgba(0,0,0,0.15)' }}>NOVIQ</div>
    </div>
  );
}