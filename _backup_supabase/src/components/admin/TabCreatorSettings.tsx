"use client";
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Save, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Creator } from '../../types';

export default function TabCreatorSettings({ creators, setCreators }: { creators: Creator[], setCreators: (creators: Creator[]) => void }) {
  const [localCreators, setLocalCreators] = useState<Creator[]>(creators);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // コンポーネントが受け取ったpropsが変化したら同期
  useEffect(() => { setLocalCreators(creators); }, [creators]);

  const updateCreator = (id: string, key: string, value: string | boolean) => {
    setLocalCreators((prev) => prev.map((c) => c.id === id ? { ...c, [key]: value } : c));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, creator: Creator) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(creator.id);
    try {
      // 現在のポリシー（INSERTは通るがUPDATEで弾かれる状態）でも確実に動くよう、
      // 毎回新しいファイル名でアップロードする方式に戻します。
      const fileExt = file.name.split('.').pop();
      const fileName = `${creator.id}-${Date.now()}.${fileExt}`;
      const filePath = `icons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('creators')
        .upload(filePath, file); // upsertなし（確実にINSERT扱いになる）

      if (uploadError) throw uploadError;

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('creators')
        .getPublicUrl(filePath);

      // 古い画像URLがあれば、ストレージから削除を試みる
      // （権限エラー等で消えなくてもシステム自体は止めない）
      if (creator.iconUrl && creator.iconUrl.includes('/object/public/creators/')) {
        const urlParts = creator.iconUrl.split('/object/public/creators/');
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          supabase.storage.from('creators').remove([oldFilePath]).catch(console.error);
        }
      }

      // 3. state更新
      updateCreator(creator.id, 'iconUrl', publicUrl);
    } catch (err) {
      console.error(err);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploadingId(null);
      // 同じファイルを再度選べるようにリセット
      e.target.value = '';
    }
  };

  const handleAddCreator = () => {
    const newId = `tmp-${Date.now()}`;
    // 暗号学的に安全なUUIDを使用して、絶対に他の作家とトークンが被らないようにする
    const randomToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const newCreator = {
      id: newId,
      name: '新規作家',
      description: 'プロフィールを入力してください',
      iconUrl: '',
      shareToken: `token-${randomToken}`,
      eventId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalCreators(prev => [...prev, newCreator]);
    setExpandedId(newId);
  };

  const handleDeleteCreator = async (id: string) => {
    if (window.confirm('この作家を削除しますか？\n（関連する感想データも今後表示されなくなります）')) {
      if (!id.startsWith('tmp-')) {
        await fetch(`/api/admin/creators/${id}`, { method: 'DELETE' });
      }
      const updated = localCreators.filter(c => c.id !== id);
      setLocalCreators(updated);
      setCreators(updated);
    }
  };

  const handleSave = async () => {
    try {
      const promises = localCreators.map(async (c) => {
        if (c.id.startsWith('tmp-')) {
          const res = await fetch('/api/admin/creators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(c)
          });
          return res.json();
        } else {
          const res = await fetch(`/api/admin/creators/${c.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(c)
          });
          return res.json();
        }
      });
      const newCreators = await Promise.all(promises);
      setCreators(newCreators);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
        各作家のプロフィール・表示設定を管理します。
      </p>
      {localCreators.map((creator) => (
        <div key={creator.id} className="card" style={{ padding: '16px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setExpandedId(expandedId === creator.id ? null : creator.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700 }}>{creator.name}</span>
            </div>
            {expandedId === creator.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedId === creator.id && (
            <div className="fade-in" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">表示名</label>
                <input type="text" className="input-text"
                  value={creator.name}
                  onChange={(e) => updateCreator(creator.id, 'name', e.target.value)}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">プロフィール文</label>
                <textarea className="input-text" style={{ minHeight: '80px' }}
                  value={creator.description ?? ''}
                  onChange={(e) => updateCreator(creator.id, 'description', e.target.value)}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">アイコン画像</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {creator.iconUrl ? (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-border)', flexShrink: 0 }}>
                      <img src={creator.iconUrl} alt="icon preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      opacity: uploadingId === creator.id ? 0.5 : 1, pointerEvents: uploadingId === creator.id ? 'none' : 'auto'
                    }}
                  >
                    {uploadingId === creator.id ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                    {uploadingId === creator.id ? 'アップロード中...' : (creator.iconUrl ? '画像を変更' : '画像を選択')}
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, creator)}
                      disabled={uploadingId === creator.id}
                    />
                  </label>
                </div>
              </div>
              
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleDeleteCreator(creator.id)}
                  style={{ 
                    backgroundColor: 'transparent', border: '1px solid #f44336', color: '#f44336', 
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' 
                  }}
                >
                  この作家を削除する
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button 
        onClick={handleAddCreator}
        style={{
          width: '100%', padding: '12px', backgroundColor: 'transparent', 
          border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-light)', cursor: 'pointer', fontWeight: 600,
          marginTop: '8px', marginBottom: '16px'
        }}
      >
        + 新規作家を追加する
      </button>

      <button className="btn-primary" onClick={handleSave}>
        {saved ? <><Check size={18} /> 保存しました</> : <><Save size={18} /> 設定を保存</>}
      </button>
    </div>
  );
}
