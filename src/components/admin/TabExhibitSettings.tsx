"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Check, Save, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Exhibit } from '../../types';

export default function TabExhibitSettings({ exhibits, setExhibits }: { exhibits: Exhibit[], setExhibits: (exhibits: Exhibit[]) => void }) {
  const [localExhibits, setLocalExhibits] = useState<Exhibit[]>(exhibits);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  // コンポーネントが受け取ったpropsが変化したら同期
  useEffect(() => { setLocalExhibits(exhibits); }, [exhibits]);

  const updateExhibit = (id: string, key: string, value: string | boolean) => {
    setLocalExhibits((prev) => prev.map((e) => e.id === id ? { ...e, [key]: value } : e));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, exhibit: Exhibit) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(exhibit.id);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${exhibit.id}-${Date.now()}.${fileExt}`;
      const filePath = `icons/${fileName}`;

      // ※注意：Supabase Storage に 'exhibits' バケットを作成する必要があります
      const { error: uploadError } = await supabase.storage
        .from('exhibits')
        .upload(filePath, file);

      if (uploadError) {
        // exhibitsバケットがない場合のエラーフォールバック用として一時的に creators バケットを使う処理などを入れてもよい
        console.warn('exhibits バケットへのアップロードに失敗しました。', uploadError);
        throw uploadError;
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('exhibits')
        .getPublicUrl(filePath);

      // 古い画像URLがあれば、ストレージから削除を試みる
      if (exhibit.iconUrl && exhibit.iconUrl.includes('/object/public/exhibits/')) {
        const urlParts = exhibit.iconUrl.split('/object/public/exhibits/');
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          supabase.storage.from('exhibits').remove([oldFilePath]).catch(console.error);
        }
      }

      // 3. state更新
      updateExhibit(exhibit.id, 'iconUrl', publicUrl);
    } catch (err) {
      console.error(err);
      alert('画像のアップロードに失敗しました。SupabaseのStorageに「exhibits」バケットが作成されているか確認してください。');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  const handleAddExhibit = () => {
    const newId = `tmp-${Date.now()}`;
    const randomToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const newExhibit: Exhibit = {
      id: newId,
      name: '新規小枠（作家）',
      description: 'プロフィールを入力してください',
      iconUrl: '',
      shareToken: `token-${randomToken}`,
      eventId: eventId || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalExhibits(prev => [...prev, newExhibit]);
    setExpandedId(newId);
  };

  const handleDeleteExhibit = async (id: string) => {
    if (window.confirm('この小枠（作家）を削除しますか？\n（関連する感想データも今後表示されなくなります）')) {
      if (!id.startsWith('tmp-')) {
        await fetch(`/api/admin/exhibits/${id}`, { method: 'DELETE' });
      }
      const updated = localExhibits.filter(e => e.id !== id);
      setLocalExhibits(updated);
      setExhibits(updated);
    }
  };

  const handleSave = async () => {
    try {
      const promises = localExhibits.map(async (e) => {
        if (e.id.startsWith('tmp-')) {
          const res = await fetch('/api/admin/exhibits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e)
          });
          return res.json();
        } else {
          const res = await fetch(`/api/admin/exhibits/${e.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e)
          });
          return res.json();
        }
      });
      const newExhibits = await Promise.all(promises);
      setExhibits(newExhibits);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
        各個別枠の設定を管理します。
      </p>
      {localExhibits.map((exhibit) => (
        <div key={exhibit.id} className="card" style={{ padding: '16px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setExpandedId(expandedId === exhibit.id ? null : exhibit.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700 }}>{exhibit.name}</span>
            </div>
            {expandedId === exhibit.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedId === exhibit.id && (
            <div className="fade-in" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">表示名</label>
                <input type="text" className="input-text"
                  value={exhibit.name}
                  onChange={(e) => updateExhibit(exhibit.id, 'name', e.target.value)}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">プロフィール文</label>
                <textarea className="input-text" style={{ minHeight: '80px' }}
                  value={exhibit.description ?? ''}
                  onChange={(e) => updateExhibit(exhibit.id, 'description', e.target.value)}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">アイコン画像</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {exhibit.iconUrl ? (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-border)', flexShrink: 0 }}>
                      <img src={exhibit.iconUrl} alt="icon preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-surface)', border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)', fontSize: '0.75rem', flexShrink: 0 }}>
                      未設定
                    </div>
                  )}

                  <label 
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                      padding: '8px 16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600,
                      opacity: uploadingId === exhibit.id ? 0.5 : 1, pointerEvents: uploadingId === exhibit.id ? 'none' : 'auto'
                    }}
                  >
                    {uploadingId === exhibit.id ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                    {uploadingId === exhibit.id ? 'アップロード中...' : (exhibit.iconUrl ? '画像を変更' : '画像を選択')}
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, exhibit)}
                      disabled={uploadingId === exhibit.id}
                    />
                  </label>
                </div>
              </div>
              
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleDeleteExhibit(exhibit.id)}
                  style={{ 
                    backgroundColor: 'transparent', border: '1px solid #f44336', color: '#f44336', 
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' 
                  }}
                >
                  この個別枠を削除する
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button 
        onClick={handleAddExhibit}
        style={{
          width: '100%', padding: '12px', backgroundColor: 'transparent', 
          border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-light)', cursor: 'pointer', fontWeight: 600,
          marginTop: '8px', marginBottom: '16px'
        }}
      >
        + 新規個別枠を追加する
      </button>

      <button className="btn-primary" onClick={handleSave}>
        {saved ? <><Check size={18} /> 保存しました</> : <><Save size={18} /> 設定を保存</>}
      </button>
    </div>
  );
}
