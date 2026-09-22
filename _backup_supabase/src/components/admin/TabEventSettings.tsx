"use client";
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Copy, Save, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useEventSettings } from '../../context/EventSettingsContext';
import { supabase } from '../../lib/supabase';
export default function TabEventSettings() {
  const { settings, updateSettings } = useEventSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  const defaultReferrals = ['SNS（X, Instagram等）', '友人・知人の紹介', 'ポスター・チラシ', 'その他'];
  const [referralList, setReferralList] = useState<string[]>(() => {
    if (settings.referralSources) {
      const parsed = settings.referralSources.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return defaultReferrals;
  });

  // Contextからの非同期ロード(DB取得)が完了したタイミングで localSettings を更新する
  useEffect(() => {
    if (settings.eventId && settings.eventId !== localSettings.eventId) {
      setLocalSettings(settings);
      if (settings.referralSources) {
        setReferralList(settings.referralSources.split(',').map(s => s.trim()).filter(Boolean));
      }
    }
  }, [settings, localSettings.eventId]);

  useEffect(() => {
    setLocalSettings(prev => ({ ...prev, referralSources: referralList.join(',') }));
  }, [referralList]);

  // ブラウザ環境のみ window にアクセス
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const eventSurveyUrl = `${origin}/survey`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(eventSurveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    updateSettings(localSettings);
    
    const targetId = localSettings.eventId || settings.eventId;
    
    if (targetId) {
      const payload = {
        id: targetId,
        title: localSettings.eventName,
        description: localSettings.eventDesc,
        location: localSettings.venue,
        date: localSettings.dateFrom ? new Date(localSettings.dateFrom).toISOString() : new Date().toISOString(),
        eventQ2Placeholder: localSettings.eventQ2Placeholder,
        eventQ3Placeholder: localSettings.eventQ3Placeholder,
        creatorQ2Placeholder: localSettings.creatorQ2Placeholder,
        creatorQ3Placeholder: localSettings.creatorQ3Placeholder,
        freeEventPlaceholder: localSettings.freeEventPlaceholder,
        freeCreatorPlaceholder: localSettings.freeCreatorPlaceholder,
        referralSources: localSettings.referralSources,
      };
      
      try {
        const response = await fetch('/api/admin/event', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save settings');
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    } else {
      console.warn('eventId is missing. Cannot save to DB.');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const downloadQRCode = (id: string, fileName: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${fileName}-qrcode.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
        イベント全体に関する設定を管理します。
      </p>

      <div className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label">イベント名</label>
        <input type="text" className="input-text" value={localSettings.eventName} onChange={(e) => setLocalSettings({...localSettings, eventName: e.target.value})} />
      </div>

      <div className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label">イベント説明文（鑑賞者ページに表示）</label>
        <textarea className="input-text" style={{ minHeight: '80px' }}
          placeholder="このイベントについての説明..."
          value={localSettings.eventDesc} onChange={(e) => setLocalSettings({...localSettings, eventDesc: e.target.value})}
        />
      </div>

      <div className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label">会場名</label>
        <input type="text" className="input-text" placeholder="例：〇〇ギャラリー"
          value={localSettings.venue} onChange={(e) => setLocalSettings({...localSettings, venue: e.target.value})} />
      </div>

      <div className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label">開催日</label>
        <input type="date" className="input-text" value={localSettings.dateFrom} onChange={(e) => setLocalSettings({...localSettings, dateFrom: e.target.value})} />
      </div>

      <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowPlaceholders(!showPlaceholders)}
        >
          <h3 style={{ margin: 0, fontSize: '1rem' }}>アンケート設定・プレースホルダー</h3>
          {showPlaceholders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {showPlaceholders && (
          <div className="fade-in" style={{ marginTop: '16px' }}>
            <div className="input-group">
              <label className="input-label">「何でイベントを知りましたか？」の選択肢</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {referralList.map((refItem, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="input-text" style={{ marginBottom: 0, flex: 1 }}
                      value={refItem}
                      onChange={(e) => {
                        const newList = [...referralList];
                        newList[idx] = e.target.value;
                        setReferralList(newList);
                      }}
                    />
                    <button 
                      onClick={() => setReferralList(referralList.filter((_, i) => i !== idx))}
                      style={{ padding: '0 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #f44336', backgroundColor: 'transparent', color: '#f44336', cursor: 'pointer' }}
                    >
                      削除
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setReferralList([...referralList, ''])}
                  style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text-light)', cursor: 'pointer', alignSelf: 'flex-start' }}
                >
                  + 選択肢を追加
                </button>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', marginTop: '16px', marginBottom: '8px', color: 'var(--color-text)' }}>イベントアンケート用</h4>
            <div className="input-group">
              <label className="input-label">Q2 (どこで) プレースホルダー</label>
              <input type="text" className="input-text" 
                placeholder="例：〇〇の展示で、入り口の雰囲気から"
                value={localSettings.eventQ2Placeholder ?? ''} 
                onChange={(e) => setLocalSettings({...localSettings, eventQ2Placeholder: e.target.value})} 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Q3 (理由) プレースホルダー</label>
              <input type="text" className="input-text" 
                placeholder="例：色使いがとても綺麗だったから"
                value={localSettings.eventQ3Placeholder ?? ''} 
                onChange={(e) => setLocalSettings({...localSettings, eventQ3Placeholder: e.target.value})} 
              />
            </div>
            <div className="input-group">
              <label className="input-label">自由記述 プレースホルダー</label>
              <input type="text" className="input-text" 
                placeholder="例：素晴らしい体験でした。特に〇〇が印象に残りました。"
                value={localSettings.freeEventPlaceholder ?? ''} 
                onChange={(e) => setLocalSettings({...localSettings, freeEventPlaceholder: e.target.value})} 
              />
            </div>

            <h4 style={{ fontSize: '0.9rem', marginTop: '16px', marginBottom: '8px', color: 'var(--color-text)' }}>作家感想用</h4>
            <div className="input-group">
              <label className="input-label">Q2 (どこで) プレースホルダー</label>
              <input type="text" className="input-text" 
                placeholder="例：作品の〇〇の表現から"
                value={localSettings.creatorQ2Placeholder ?? ''} 
                onChange={(e) => setLocalSettings({...localSettings, creatorQ2Placeholder: e.target.value})} 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Q3 (理由) プレースホルダー</label>
              <input type="text" className="input-text" 
                placeholder="例：不思議な魅力があったから"
                value={localSettings.creatorQ3Placeholder ?? ''} 
                onChange={(e) => setLocalSettings({...localSettings, creatorQ3Placeholder: e.target.value})} 
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">自由記述 プレースホルダー</label>
              <input type="text" className="input-text" 
                placeholder="例：素晴らしい体験でした。特に〇〇が印象に残りました。"
                value={localSettings.freeCreatorPlaceholder ?? ''} 
                onChange={(e) => setLocalSettings({...localSettings, freeCreatorPlaceholder: e.target.value})} 
              />
            </div>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '16px', padding: '24px', backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-primary)' }}>鑑賞者用アンケートの共有</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)', textAlign: 'center' }}>
          会場に掲示して、鑑賞者にスマートフォンからアクセスしてもらいます。
        </p>
        
        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
          {eventSurveyUrl && <QRCode id="event-qr-code" value={eventSurveyUrl} size={160} />}
        </div>
        <button
          onClick={() => downloadQRCode('event-qr-code', 'event')}
          className="btn-outline"
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}
        >
          <Download size={16} />画像を保存
        </button>

        <div style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
          <input 
            type="text" 
            readOnly 
            value={eventSurveyUrl} 
            className="input-text" 
            style={{ marginBottom: 0, flex: 1, backgroundColor: '#f5f5f5', color: 'var(--color-text-light)' }} 
          />
          <button 
            onClick={handleCopyUrl}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
              backgroundColor: copied ? '#E8F5E9' : 'var(--color-surface)',
              color: copied ? '#2E7D32' : 'var(--color-text)',
              border: `1px solid ${copied ? '#4CAF50' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave}>
        {saved ? <><Check size={18} /> 保存しました</> : <><Save size={18} /> 設定を保存</>}
      </button>
    </div>
  );
}
