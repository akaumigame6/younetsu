"use client";
import { useState } from 'react';
import { Copy, Check, ExternalLink, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import type { Creator } from '../../types';

export default function TabCreators({ creators }: { creators: Creator[] }) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const eventSurveyResultUrl = `${origin}/admin/event-survey`;

  const downloadQRCode = (id: string, fileName: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40; // 余白を追加
      canvas.height = img.height + 40;
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 20, 20); // 中央に配置
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${fileName}-qrcode.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
        各作家にURLをコピーして共有してください。作家はそのURLから自分宛ての感想を閲覧できます。<br/>
        イベント全体の感想URLは、主催者やスタッフで確認用にご利用ください。
      </p>

      {/* イベント全体アンケート結果のURL */}
      <div className="card" style={{ border: '2px solid var(--color-primary)' }}>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--color-primary)' }}>イベント全体の感想（スタッフ用）</div>
        <div style={{
          fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '12px',
          wordBreak: 'break-all', fontFamily: 'monospace',
          backgroundColor: '#f5f5f5', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
        }}>
          {eventSurveyResultUrl}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleCopyUrl(eventSurveyResultUrl, 'event')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${copiedToken === 'event' ? '#4CAF50' : 'var(--color-border)'}`,
              backgroundColor: copiedToken === 'event' ? '#E8F5E9' : 'var(--color-surface)',
              color: copiedToken === 'event' ? '#2E7D32' : 'var(--color-text)',
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copiedToken === 'event' ? <Check size={16} /> : <Copy size={16} />}
            {copiedToken === 'event' ? 'コピー済み' : 'URLをコピー'}
          </button>
          <a
            href={eventSurveyResultUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-light)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'none',
            }}
          >
            <ExternalLink size={16} />確認
          </a>
        </div>
      </div>

      {/* 作家ごとの感想URL */}
      {creators.map((creator) => {
        const shareUrl = `${origin}/creator/${creator.shareToken}`;
        const isCopied = copiedToken === creator.id;
        return (
          <div key={creator.id} className="card">
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>{creator.name}</div>
            <div style={{
              fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '12px',
              wordBreak: 'break-all', fontFamily: 'monospace',
              backgroundColor: '#f5f5f5', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            }}>
              {shareUrl}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleCopyUrl(shareUrl, creator.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isCopied ? '#4CAF50' : 'var(--color-border)'}`,
                  backgroundColor: isCopied ? '#E8F5E9' : 'var(--color-surface)',
                  color: isCopied ? '#2E7D32' : 'var(--color-text)',
                  fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? 'コピー済み' : 'URLをコピー'}
              </button>
              <a
                href={shareUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-light)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'none',
                }}
              >
                <ExternalLink size={16} />確認
              </a>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '8px', display: 'inline-block' }}>
                <QRCode id={`qr-${creator.id}`} value={`${origin}/survey/wizard?context=creator&creatorId=${creator.id}`} size={80} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>会場設置用QRコード</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                  ブースに設置して、来場者に感想を送ってもらうためのQRコードです。
                </div>
                <button
                  onClick={() => downloadQRCode(`qr-${creator.id}`, creator.name)}
                  className="btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} />画像を保存
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
