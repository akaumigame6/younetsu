"use client";
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Copy, Check, ExternalLink, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import type { Exhibit } from '../../types';

export default function TabExhibits({ exhibits, hasExhibits = true, eventId: propEventId }: { exhibits: Exhibit[], hasExhibits?: boolean, eventId?: string }) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const params = useParams();
  const eventId = propEventId || (params?.eventId as string | undefined);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const eventSurveyResultUrl = eventId ? `${origin}/admin/events/${eventId}/event-survey` : '';
  const eventViewerUrl = eventId ? `${origin}/events/${eventId}/viewer` : '';

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
    <div data-tour="tour-exhibits-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
        各個別枠の担当者にURLをコピーして共有してください。対象者はそのURLから自分宛ての感想を閲覧できます。<br/>
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
      
      {/* 鑑賞者向けイベント入口URL */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>イベント入口（鑑賞者向け）</div>
        <div style={{
          fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '12px',
          wordBreak: 'break-all', fontFamily: 'monospace',
          backgroundColor: '#f5f5f5', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
        }}>
          {origin}/events/{eventId}/survey
        </div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '8px', display: 'inline-block' }}>
            <QRCode id={`qr-event-entrance`} value={`${origin}/events/${eventId}/survey`} size={80} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>会場設置用QRコード (全体)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>
              来場者に最初に見せるQRコードです。ここから一連のフローに入れます。
            </div>
            <button
              onClick={() => downloadQRCode(`qr-event-entrance`, 'event-entrance')}
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />画像を保存
            </button>
          </div>
        </div>
      </div>

      {/* 個別枠ごとの感想一覧URL & 回答用URL/QRコード */}
      {hasExhibits && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px 0' }}>個別枠のURL・QRコード</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: 0 }}>
              各作家・作品ごとの感想確認用URLと、ブース設置用の回答QRコードです。
            </p>
          </div>

          {exhibits.map((exhibit) => {
            const adminExhibitUrl = `${origin}/admin/events/${eventId}/exhibits/${exhibit.id}`;
            const surveyExhibitUrl = `${origin}/events/${eventId}/survey/wizard?context=creator&exhibitId=${exhibit.id}`;
            const isCopiedAdmin = copiedToken === `admin-${exhibit.id}`;
            const isCopiedSurvey = copiedToken === `survey-${exhibit.id}`;

            return (
              <div key={exhibit.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center' }}>
                  <span>{exhibit.name}</span>
                </div>

                {/* 1. 作家・担当者用（感想確認URL） */}
                <div className="card" style={{ border: '2px solid var(--color-primary)' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                    {exhibit.name} の感想（作家・担当者用）
                  </div>
                  <div style={{
                    fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '12px',
                    wordBreak: 'break-all', fontFamily: 'monospace',
                    backgroundColor: '#f5f5f5', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  }}>
                    {adminExhibitUrl}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCopyUrl(adminExhibitUrl, `admin-${exhibit.id}`)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '10px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isCopiedAdmin ? '#4CAF50' : 'var(--color-border)'}`,
                        backgroundColor: isCopiedAdmin ? '#E8F5E9' : 'var(--color-surface)',
                        color: isCopiedAdmin ? '#2E7D32' : 'var(--color-text)',
                        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {isCopiedAdmin ? <Check size={16} /> : <Copy size={16} />}
                      {isCopiedAdmin ? 'コピー済み' : 'URLをコピー'}
                    </button>
                    <a
                      href={adminExhibitUrl} target="_blank" rel="noopener noreferrer"
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

                {/* 2. 鑑賞者向け（ブース設置用QR・回答URL） */}
                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.9rem' }}>
                    {exhibit.name} の感想入力（鑑賞者向け）
                  </div>
                  <div style={{
                    fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '12px',
                    wordBreak: 'break-all', fontFamily: 'monospace',
                    backgroundColor: '#f5f5f5', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  }}>
                    {surveyExhibitUrl}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                      onClick={() => handleCopyUrl(surveyExhibitUrl, `survey-${exhibit.id}`)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '10px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isCopiedSurvey ? '#4CAF50' : 'var(--color-border)'}`,
                        backgroundColor: isCopiedSurvey ? '#E8F5E9' : 'var(--color-surface)',
                        color: isCopiedSurvey ? '#2E7D32' : 'var(--color-text)',
                        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {isCopiedSurvey ? <Check size={16} /> : <Copy size={16} />}
                      {isCopiedSurvey ? 'コピー済み' : '回答用URLをコピー'}
                    </button>
                    <a
                      href={surveyExhibitUrl} target="_blank" rel="noopener noreferrer"
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

                  <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '8px', display: 'inline-block' }}>
                      <QRCode id={`qr-${exhibit.id}`} value={surveyExhibitUrl} size={80} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>会場設置用QRコード ({exhibit.name})</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                        ブースや作品横に設置し、直接この個別枠への感想入力へ飛ばすためのQRコードです。
                      </div>
                      <button
                        onClick={() => downloadQRCode(`qr-${exhibit.id}`, `qr-${exhibit.name}`)}
                        className="btn-outline"
                        style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={14} />画像を保存
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
