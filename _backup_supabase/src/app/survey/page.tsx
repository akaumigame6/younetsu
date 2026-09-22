"use client";
import { useRouter } from 'next/navigation';
import { PenTool, Calendar, MapPin } from 'lucide-react';
import { useEventSettings } from '../../context/EventSettingsContext';
import { useState } from 'react';

/**
 * EventSurvey - イベント全体のアンケート (鑑賞者が最初に見るページ)
 * アクセス直後に表示される。回答 or スキップで CreatorSelect へ進む。
 */
export default function EventSurvey() {
  const router = useRouter();
  const { settings } = useEventSettings();
  const [referral, setReferral] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);


  return (
    <div className="content-area fade-in" style={{ justifyContent: 'center' }}>
      {/* イベント全体の進行プログレス */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--color-text-light)',
          marginBottom: '8px',
        }}>
          <span>Step 1 / 2</span>
          <span>イベントアンケート</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: '50%' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 className="title" style={{ marginBottom: '8px' }}>{settings.eventName}</h1>
        {settings.eventDesc && (
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
            {settings.eventDesc}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--color-text-light)', alignItems: 'center' }}>
          {settings.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> {settings.venue}
            </div>
          )}
          {settings.dateFrom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> {settings.dateFrom}
            </div>
          )}
        </div>
      </div>

      <p className="subtitle" style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 600 }}>
        ご来場いただきありがとうございました。
        <br />
        イベント全体についてお聞かせてください。
        <br />
      </p>

      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Q. 何でこのイベントを知りましたか？</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(settings.referralSources ? settings.referralSources.split(',').map(s => s.trim()) : []).map(src => (
            <label key={src} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="radio" 
                name="referral" 
                value={src} 
                checked={referral === src}
                onChange={() => {setReferral(src); setIsAnswered(true);}}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              {src}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <button
          className="btn-primary"
          disabled={!isAnswered && !referral}
          onClick={() => {
            const dataStr = encodeURIComponent(JSON.stringify({ referralSource: referral }));
            router.push(`/survey/wizard?context=event&initialData=${dataStr}`);
          }}
        >
          <PenTool size={18} />
          次に進む
        </button>
      </div>
    </div>
  );
}
