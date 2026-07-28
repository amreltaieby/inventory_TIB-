'use client';

import { useState } from 'react';
import NavBar from '../components/NavBar';

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const t = {
    en: {
      tag: 'Latest Product',
      title: 'NOVIQ Inventory',
      desc: 'A real-time inventory and stock management system built for factories, workshops, and small businesses.',
      p1: 'Running a business on scattered Excel sheets means every stock update lives in a different file, on a different computer, updated by whoever remembered to do it. NOVIQ Inventory replaces that with one shared, always up-to-date system every employee can access from any device.',
      p2: 'Every addition and removal of stock is logged automatically, who did it, when, and how much, creating a permanent audit trail that a spreadsheet simply cannot provide. Low-stock and critical alerts mean your team finds out about a shortage before it becomes a production problem, not after.',
      p3: 'Because everyone works from the same live data, there is no more reconciling three different versions of the same sheet at the end of the week. One source of truth, accessible to your whole team, growing with your business as you add more staff, more products, and more locations.',
      cta: 'Request a Consultation',
    },
    ar: {
      tag: 'أحدث منتج',
      title: 'نوفيك للمخزون',
      desc: 'نظام إدارة مخزون فوري مصمم للمصانع والورش والشركات الصغيرة.',
      p1: 'إدارة عملك عبر أوراق إكسل متفرقة تعني أن كل تحديث للمخزون يعيش في ملف مختلف، على جهاز مختلف. نوفيك للمخزون يستبدل ذلك بنظام واحد مشترك ومحدث دائمًا يمكن لكل موظف الوصول إليه من أي جهاز.',
      p2: 'يتم تسجيل كل إضافة وإزالة للمخزون تلقائيًا، من قام بها، ومتى، وكم الكمية، مما يخلق سجلاً دائمًا لا يمكن لجدول بيانات توفيره. تنبيهات المخزون المنخفض والحرج تعني أن فريقك يعرف بالنقص قبل أن يصبح مشكلة إنتاج.',
      p3: 'لأن الجميع يعمل من نفس البيانات الحية، لا مزيد من مطابقة ثلاث نسخ مختلفة من نفس الجدول في نهاية الأسبوع. مصدر واحد للحقيقة، متاح لفريقك بالكامل، وينمو مع نمو عملك.',
      cta: 'اطلب استشارة',
    },
  };

  const T = t[lang];

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ fontFamily: 'sans-serif' }}>
      <NavBar lang={lang} setLang={setLang} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '140px 24px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
          {T.tag}
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>{T.title}</h1>
        <p style={{ fontSize: '17px', color: '#475569', maxWidth: '560px', margin: '0 auto 40px' }}>{T.desc}</p>

        <div style={{ textAlign: lang === 'ar' ? 'right' : 'left', color: '#334155', fontSize: '15px', lineHeight: 1.7 }}>
          <p>{T.p1}</p>
          <p>{T.p2}</p>
          <p>{T.p3}</p>
        </div>

        
          <a href="/consultation" style={{ display: 'inline-block', marginTop: '30px', padding: '12px 28px', background: '#0f172a', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>{T.cta}</a>
      </div>

      <div style={{ background: '#0f172a', color: '#cbd5e1', padding: '40px 24px', marginTop: '40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', fontSize: '13px' }}>
          <a href="/terms" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Terms & Conditions</a>
          <a href="/terms" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Terms of Service</a>
          <details>
            <summary style={{ cursor: 'pointer', color: '#cbd5e1', listStyle: 'none' }}>Contact Us</summary>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
              <div>noviqsupportteam@gmail.com</div>
              <div>+20 106 368 5555</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}