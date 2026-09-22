"use client";
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, ArrowLeft, RefreshCw, PenTool, MessageSquare, Wand2, BookOpen, X } from 'lucide-react';
import { useViewerFeedback } from '../../../context/ViewerFeedbackContext';
import { useEventSettings } from '../../../context/EventSettingsContext';
import type { FeedbackData, SurveyData, Creator } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { plutchikEmotions, subEmotionsMap } from '../../../utils/emotionColors';

function SurveyWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams?.get('context') || 'event';
  const creatorId = searchParams?.get('creatorId');
  const [editMode, setEditMode] = useState(searchParams?.get('editMode') === 'true');
  const [editId, setEditId] = useState(searchParams?.get('editId') || null);
  const [initialData, setInitialData] = useState<any>(
    searchParams?.get('initialData') ? JSON.parse(searchParams.get('initialData') as string) : null
  );
  const [hasFetched, setHasFetched] = useState(false);

  const { viewerId, isAuthReady } = useViewerFeedback();
  const { settings } = useEventSettings();

  const isEvent = context === 'event';
  
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (creatorId) {
      // 今回はAPIから取得する
      fetch(`/api/creators`)
        .then(res => res.json())
        .then(data => {
           const found = data.find((c: Creator) => c.id === creatorId);
           if (found) setCreator(found);
        })
        .catch(console.error);
    }
  }, [creatorId]);

  // ==== State Management ====
  const [inputType, setInputType] = useState<'free' | 'questions' | null>(
    (initialData?.type as 'free' | 'questions' | null) || null
  );
  const [step, setStep] = useState(inputType ? 2 : 1);
  const [questionStep, setQuestionStep] = useState(1);
  
  // Input Data
  const [content, setContent] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [freeEmotion, setFreeEmotion] = useState('');
  const [activePrimary, setActivePrimary] = useState<string | null>(null);
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  
  // Generation
  const [generationMethod, setGenerationMethod] = useState<'ai' | 'template' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateVariant, setTemplateVariant] = useState(0);

  // 既存データの自動取得
  useEffect(() => {
    const fetchExisting = async () => {
      if (!viewerId || hasFetched || editId) {
        setHasFetched(true);
        return;
      }
      try {
        let existingData = null;
        if (isEvent) {
          const { data } = await supabase.from('SurveyRecord').select('*').eq('viewerId', viewerId).limit(1).maybeSingle();
          existingData = data;
        } else if (creatorId) {
          const { data } = await supabase.from('FeedbackRecord').select('*').eq('viewerId', viewerId).eq('creatorId', creatorId).limit(1).maybeSingle();
          existingData = data;
        }

        if (existingData) {
          setEditId(existingData.id);
          setEditMode(true);
          
          // freeEmotionの分離
          const allDefinedEmotions = [
            ...plutchikEmotions.map(e => e.name),
            ...Object.values(subEmotionsMap).flat()
          ];
          const selected = (existingData.q1 || []).filter((e: string) => allDefinedEmotions.includes(e));
          const free = (existingData.q1 || []).find((e: string) => !allDefinedEmotions.includes(e)) || '';

          setInitialData({
            type: existingData.inputType,
            content: existingData.content,
            selectedEmotions: selected,
            freeEmotion: free,
            q2: existingData.q2,
            q3: existingData.q3,
            referralSource: existingData.referralSources?.[0]
          });

          // 自動で飛ばさず、編集モード選択画面(Step 0)を表示する
          setStep(0);
        }
      } catch (err) {
        console.error('Failed to fetch existing record', err);
      } finally {
        setHasFetched(true);
      }
    };
    fetchExisting();
  }, [viewerId, hasFetched, isEvent, creatorId, editId]);

  // ==== Step Handlers ====
  const handleNextStep = () => setStep((s) => s + 1);
  const handlePrevStep = () => {
    if (step === 2 && inputType === 'questions' && questionStep > 1) {
      setQuestionStep(s => s - 1);
      return;
    }
    
    if (step > 1) {
      if (step === 5 && inputType === 'free') {
        setStep(2);
      } else {
        setStep((s) => s - 1);
      }
    } else {
      if (isEvent) {
        router.push('/viewer');
      } else {
        router.push('/survey/creators?surveySkipped=true');
      }
    }
  };

  // ==== Submit Handler ====
  const handleSubmit = async () => {
    if (!viewerId) {
      alert('認証の初期化が完了していません。少し待ってから再度お試しください。');
      return;
    }
    setIsSubmitting(true);
    // 編集時は既存IDを使用
    const id = editId || Date.now().toString();
    const timestamp = new Date().toISOString();
    const q1Array = [...selectedEmotions, ...(freeEmotion ? [freeEmotion] : [])];

    const baseData = {
      inputType: inputType || 'free',
      content: content,
      ...(inputType === 'questions' ? {
        q1: q1Array,
        q2,
        q3
      } : {})
    };

    try {
      if (isEvent) {
        // EventId取得
        let eventId = '';
        const { data: ev } = await supabase.from('Event').select('id').limit(1).single();
        if (ev) eventId = ev.id;

        const payload: any = {
          ...baseData,
          referralSources: initialData?.referralSource ? [initialData.referralSource] : [],
          viewerId,
          updatedAt: timestamp
        };

        if (editId) {
          const { error } = await supabase.from('SurveyRecord').update(payload).eq('id', editId);
          if (error) throw error;
        } else {
          payload.id = crypto.randomUUID();
          payload.eventId = eventId;
          const { error } = await supabase.from('SurveyRecord').insert([payload]);
          if (error) throw error;
        }
        

        router.push('/survey/creators');
      } else {
        if (creatorId) {
          const payload: any = {
            ...baseData,
            viewerId,
            updatedAt: timestamp
          };

          if (editId) {
            const { error } = await supabase.from('FeedbackRecord').update(payload).eq('id', editId);
            if (error) throw error;
          } else {
            payload.id = crypto.randomUUID();
            payload.creatorId = creatorId;
            const { error } = await supabase.from('FeedbackRecord').insert([payload]);
            if (error) throw error;
          }
          

        }
        router.push('/survey/complete');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('送信に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==== Progress Calculation ====
  const maxSteps = inputType === 'free' ? 3 : 5; // free: Select->Input->Confirm, questions: Select->Input->GenSelect->Edit->Confirm
  let currentProgressStep = step;
  if (inputType === 'free' && step >= 5) {
    currentProgressStep = 3; 
  }
  const progressPercent = (currentProgressStep / maxSteps) * 100;

  // ==========================================
  // Render Steps
  // ==========================================

  // Step 0: 編集方法の選択 (既存データがある場合のみ)
  const renderStep0 = () => (
    <div className="fade-in">
      <h1 className="title">編集方法の選択</h1>
      <p className="subtitle">すでに送信された感想があります。<br/>どのように編集しますか？</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
        <button 
          className="btn-outline" 
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          onClick={() => { 
            if (initialData?.type === 'free') {
              setInputType('free');
              setContent(initialData.content || '');
              setStep(4);
            } else if (initialData?.type === 'questions') {
              setInputType('questions');
              setSelectedEmotions(initialData.selectedEmotions || []);
              setFreeEmotion(initialData.freeEmotion || '');
              setQ2(initialData.q2 || '');
              setQ3(initialData.q3 || '');
              setContent(initialData.content || '');
              if (initialData.content) {
                setGenerationMethod('ai');
                setStep(4);
              } else {
                setStep(2);
              }
            } else {
              setStep(1); // フォールバック
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 600 }}>
            <PenTool className="icon-primary" />
            文章だけ編集しなおす
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', textAlign: 'left' }}>
            前回作成した文章を引き継いで修正します。
          </div>
        </button>

        <button 
          className="btn-outline" 
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          onClick={() => { 
            setStep(1); 
            setContent('');
            setSelectedEmotions([]);
            setFreeEmotion('');
            setQ2('');
            setQ3('');
            setInputType(null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 600 }}>
            <RefreshCw className="icon-primary" />
            新しく作成しなおす
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', textAlign: 'left' }}>
            質問に答え直して、新しい感想を作成します。
          </div>
        </button>
      </div>
    </div>
  );

  // Step 1: 形式選択
  const renderStep1 = () => (
    <div className="fade-in">
      <h1 className="title">{isEvent ? 'イベントアンケート' : '作家への感想'}</h1>
      <p className="subtitle">感想の入力方法を選んでください。</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
        <button 
          className="btn-outline" 
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          onClick={() => { setInputType('free'); handleNextStep(); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 600 }}>
            <PenTool className="icon-primary" />
            自由に記述する
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', textAlign: 'left' }}>
            ご自身の言葉で自由に感想を書きたい方はこちら
          </div>
        </button>

        <button 
          className="btn-outline" 
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          onClick={() => { setInputType('questions'); handleNextStep(); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 600 }}>
            <MessageSquare className="icon-primary" />
            3つの質問から構成する
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', textAlign: 'left' }}>
            「どんな感情になったか」「どこでそう感じたか」などの簡単な質問に答えるだけで、AIが文章を生成します。
          </div>
        </button>
      </div>
    </div>
  );

  // Step 2: 入力フォーム
  const renderStep2 = () => {
    if (inputType === 'free') {
      return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h1 className="title">感想・コメント</h1>
          <p className="subtitle">思いを自由にお書きください。</p>
          <textarea
            className="input-text"
            style={{ flex: 1, minHeight: '200px' }}
            placeholder={isEvent 
              ? (settings.freeEventPlaceholder || '例：素晴らしい体験でした。特に〇〇が印象に残りました。') 
              : (settings.freeCreatorPlaceholder || '例：素晴らしい体験でした。特に〇〇が印象に残りました。')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
          />
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right', marginTop: '4px' }}>
            {content.length} / 1000
          </div>
          <div style={{ marginTop: '24px' }}>
            <button 
              className="btn-primary" 
              disabled={!content.trim()} 
              style={{ opacity: content.trim() ? 1 : 0.5 }}
              onClick={() => { setStep(5); }} // Confirm画面へ直行
            >
              次へ進む
            </button>
          </div>
        </div>
      );
    }



    const toggleEmotion = (emotionName: string) => {
      if (selectedEmotions.includes(emotionName)) {
        setSelectedEmotions(selectedEmotions.filter(e => e !== emotionName));
      } else {
        const currentCount = selectedEmotions.length + (freeEmotion.trim() !== '' ? 1 : 0);
        if (currentCount >= 3) {
          alert('感情は最大3つまで選択できます。不要なものを解除してから選択してください。');
          return;
        }
        setSelectedEmotions([...selectedEmotions, emotionName]);
      }
    };

    const handleWheelClick = (emotionName: string) => {
      setActivePrimary(emotionName);
    };

    const handleWheelDoubleClick = (emotionName: string) => {
      toggleEmotion(emotionName);
    };

    const removeEmotion = (emotionName: string) => {
      setSelectedEmotions(selectedEmotions.filter(e => e !== emotionName));
      if (activePrimary === emotionName) {
        setActivePrimary(null);
      }
    };

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Question Progress */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>
            <span>Question {questionStep} / 3</span>
          </div>
          <div className="progress-bar-container" style={{ height: '4px' }}>
            <div className="progress-bar-fill" style={{ width: `${(questionStep / 3) * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {questionStep === 1 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="title" style={{ alignSelf: 'flex-start' }}>どんな感情になりましたか？</h1>
            <p className="subtitle" style={{ alignSelf: 'flex-start' }}>当てはまるものを最大3つまで選んでください。</p>
            
            {/* Selected Emotions Display */}
            <div style={{ 
              width: '100%', 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px', 
              marginBottom: '16px', 
              marginTop: '16px',
              minHeight: '40px',
              padding: '12px',
              backgroundColor: '#f8f8f8',
              borderRadius: '12px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginRight: '8px' }}>
                選択中 ({selectedEmotions.length + (freeEmotion.trim() !== '' ? 1 : 0)}/3):
              </span>
              {selectedEmotions.map(emo => (
                <div key={emo} className="fade-in" style={{ 
                  backgroundColor: 'var(--color-primary)', 
                  color: 'white', 
                  padding: '4px 10px', 
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {emo}
                  <button onClick={() => removeEmotion(emo)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} color="white" />
                  </button>
                </div>
              ))}
              {freeEmotion.trim() !== '' && (
                <div className="fade-in" style={{ 
                  backgroundColor: 'var(--color-primary)', 
                  color: 'white', 
                  padding: '4px 10px', 
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {freeEmotion}
                  <button onClick={() => setFreeEmotion('')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} color="white" />
                  </button>
                </div>
              )}
              {selectedEmotions.length === 0 && freeEmotion.trim() === '' && (
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>未選択</span>
              )}
            </div>

            {/* Wheel Container */}
            <div style={{ 
              width: '320px', 
              height: '320px', 
              position: 'relative',
              marginTop: '16px',
              margin: '0 auto'
            }}>
              {/* Center decoration */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-surface)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-light)',
                fontSize: '0.8rem',
                textAlign: 'center'
              }}>
                今の<br/>気持ちは？
              </div>

              {plutchikEmotions.map((emo) => {
                const radius = 115; 
                const x = 160 + radius * Math.cos(emo.angle * Math.PI / 180);
                const y = 160 + radius * Math.sin(emo.angle * Math.PI / 180);
                const isSelected = selectedEmotions.includes(emo.name);
                const isActive = activePrimary === emo.name;
                const isOthersSelected = selectedEmotions.length > 0 && !isSelected;

                let scale = '1';
                let boxShadow = 'var(--shadow-sm)';
                let opacity = (isOthersSelected && !isActive) ? 0.6 : 1;

                if (isSelected) {
                  scale = '1.1';
                  boxShadow = `0 4px 12px ${emo.color}90`;
                } else if (isActive) {
                  scale = '1.05';
                  boxShadow = `0 0 0 6px ${emo.color}40`; // 淡い強調
                }

                return (
                  <button 
                    key={emo.name}
                    onClick={() => handleWheelClick(emo.name)}
                    onDoubleClick={() => handleWheelDoubleClick(emo.name)}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                      width: '96px',
                      minHeight: '54px',
                      padding: '6px 4px',
                      borderRadius: '27px',
                      backgroundColor: isSelected ? emo.color : 'var(--color-surface)',
                      border: `2px solid ${emo.color}`,
                      color: 'var(--color-text)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      lineHeight: '1.2',
                      wordBreak: 'keep-all',
                      boxShadow,
                      opacity,
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      scale,
                      zIndex: (isSelected || isActive) ? 10 : 1,
                      touchAction: 'manipulation',
                      userSelect: 'none'
                    }}
                  >
                    {emo.name}
                  </button>
                );
              })}
            </div>

            {/* Sub-emotions panel */}
            {activePrimary && subEmotionsMap[activePrimary] && (
              <div className="fade-in" style={{ 
                width: '100%',
                marginTop: '24px', 
                padding: '16px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '12px' 
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '12px' }}>
                  「{activePrimary}」に関するさらに具体的な感情:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button 
                    onClick={() => toggleEmotion(activePrimary)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '24px',
                      backgroundColor: selectedEmotions.includes(activePrimary) ? 'var(--color-primary)' : 'white',
                      color: selectedEmotions.includes(activePrimary) ? 'white' : 'var(--color-text)',
                      border: `1px solid ${selectedEmotions.includes(activePrimary) ? 'var(--color-primary)' : '#ddd'}`,
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    そのまま（{activePrimary}）
                  </button>

                  {subEmotionsMap[activePrimary].map(subEmo => {
                    const isSubSelected = selectedEmotions.includes(subEmo);
                    return (
                      <button 
                        key={subEmo}
                        onClick={() => toggleEmotion(subEmo)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '24px',
                          backgroundColor: isSubSelected ? 'var(--color-primary)' : 'white',
                          color: isSubSelected ? 'white' : 'var(--color-text)',
                          border: `1px solid ${isSubSelected ? 'var(--color-primary)' : '#ddd'}`,
                          fontSize: '0.9rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {subEmo}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="input-group" style={{ width: '100%', marginTop: '24px' }}>
              <label className="input-label">その他・自由記入</label>
              <input 
                type="text" 
                className="input-text" 
                placeholder="例：言葉にできない感動" 
                value={freeEmotion}
                maxLength={30}
                onChange={(e) => {
                  if (e.target.value.trim() !== '' && freeEmotion.trim() === '' && selectedEmotions.length >= 3) {
                    alert('感情は最大3つまで選択できます。不要なものを解除してから入力してください。');
                    return;
                  }
                  setFreeEmotion(e.target.value);
                }}
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right', marginTop: '4px' }}>
                {freeEmotion.length} / 30
              </div>
            </div>

            <button 
              className="btn-primary"
              disabled={selectedEmotions.length === 0 && !freeEmotion}
              style={{ width: '100%', opacity: (selectedEmotions.length > 0 || freeEmotion) ? 1 : 0.5, marginTop: '24px' }}
              onClick={() => setQuestionStep(2)}
            >
              次へ進む
            </button>
          </div>
        )}

        {questionStep === 2 && (
          <div className="fade-in">
            <h1 className="title">どこでそう感じましたか？</h1>
            <p className="subtitle">具体的に心に残った瞬間、場所、表現などを教えてください。</p>
            <div className="input-group">
              <input 
                type="text" 
                className="input-text" 
                placeholder={isEvent 
                  ? (settings.eventQ2Placeholder || '例：〇〇の展示で、入り口の雰囲気から') 
                  : (settings.creatorQ2Placeholder || '例：作品の〇〇の表現から')}
                value={q2}
                maxLength={100}
                onChange={(e) => setQ2(e.target.value)}
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right', marginTop: '4px' }}>
                {q2.length} / 100
              </div>
            </div>
            <button 
              className="btn-primary"
              style={{ marginTop: '24px' }}
              onClick={() => setQuestionStep(3)}
            >
              次へ進む
            </button>
          </div>
        )}

        {questionStep === 3 && (
          <div className="fade-in">
            <h1 className="title">その理由は何ですか？</h1>
            <p className="subtitle">なぜそう感じたのか、自分の言葉で自由に書いてみてください。</p>
            <div className="input-group">
              <textarea 
                className="input-text" 
                placeholder={isEvent 
                  ? (settings.eventQ3Placeholder || '例：雰囲気が心地よかったから') 
                  : (settings.creatorQ3Placeholder || '例：色使いがとても綺麗だったから')}
                value={q3}
                onChange={(e) => setQ3(e.target.value)}
                maxLength={300}
                rows={4}
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right', marginTop: '4px' }}>
                {q3.length} / 300
              </div>
            </div>
            <button 
              className="btn-primary"
              style={{ marginTop: '24px' }}
              onClick={handleNextStep}
            >
              次へ進む
            </button>
          </div>
        )}
      </div>
    );
  };

  // Step 3: 生成方法選択 (3つの質問のみ)
  const renderStep3 = () => (
    <div className="fade-in">
      <h1 className="title">文章の作成方法</h1>
      <p className="subtitle">回答をもとに文章を作ります。</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
        <button 
          className="btn-outline" 
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          onClick={() => { 
            setGenerationMethod('ai'); 
            generateText('ai'); 
            handleNextStep(); 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 600 }}>
            <Wand2 className="icon-primary" />
            AIにおまかせ生成
          </div>
        </button>

        <button 
          className="btn-outline" 
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          onClick={() => { 
            setGenerationMethod('template'); 
            generateText('template'); 
            handleNextStep(); 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 600 }}>
            <BookOpen className="icon-primary" />
            定型文から選ぶ
          </div>
        </button>
      </div>
    </div>
  );

  const generateText = async (method: 'ai' | 'template') => {
    const q1Str = [...selectedEmotions, ...(freeEmotion ? [freeEmotion] : [])].join('、');
    const tQ2 = q2 || '全体';
    const tQ3 = q3 || '言葉にできない魅力があった';

    if (method === 'ai') {
      setIsGenerating(true);
      try {
        const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
        const accessToken = sessionData.session?.access_token;

        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            emotions: q1Str,
            q2: tQ2,
            q3: tQ3,
            targetName: isEvent ? (settings.eventName || 'イベント') : (creator?.name || '展示作品'),
            targetType: isEvent ? 'event' : 'creator',
          }),
        });

        if (!res.ok) {
          throw new Error('AI生成に失敗しました');
        }

        const data = await res.json();
        setContent(data.content);
      } catch (error) {
        console.error(error);
        alert('文章の生成中にエラーが発生しました。時間をおいて再度お試しください。');
        // フォールバックとしてテンプレートを入れる
        setContent(`このたびは素晴らしい体験をありがとうございます。\n思わず「${q1Str}」という感情が込み上げてきました。\n\n全体を通してとても魅力的でしたが、特に${tQ2}に目を奪われました。${tQ3}という理由もあって、私の心に深く響いたのだと思います。`);
      } finally {
        setIsGenerating(false);
      }
    } else {
      const templates = isEvent ? [
        `イベントに参加して「${q1Str}」という感情が湧きました。\n特に${tQ2}が印象に残っています。\nなぜなら、${tQ3}からです。\n素敵な時間をありがとうございました！`,
        `本イベントで${tQ2}を拝見し、${tQ3}という理由から「${q1Str}」と感じました。\nとても有意義な展示でした。`,
      ] : [
        `この作品を拝見し、言葉にはしきれない「${q1Str}」という感情が心の中に広がりました。\n全体を通してとても素敵な作品ですが、その中でも特に${tQ2}の表現がとても印象に残っています。\nなぜなら、${tQ3}からです。ずっと見ていたくなるような不思議な魅力がありました。\n素晴らしい作品を届けてくださり、本当にありがとうございます！`,
        `素敵な作品を公開してくださり、ありがとうございます。\n作品を拝見している間ずっと、${tQ2}から目が離せませんでした。とても繊細で印象的です。\n${tQ3}という理由からか、自分でも驚くほど「${q1Str}」という気持ちで胸がいっぱいになりました。\nこれからも陰ながら応援しております。また新しい作品を見られる日を楽しみにしています。`
      ];
      setContent(templates[templateVariant % templates.length]);
    }
  };

  // Step 4: 編集
  const renderStep4 = () => {
    if (isGenerating) {
      return (
        <div className="content-area fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <RefreshCw size={40} className="spin" style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>文章を生成中...</h2>
          <p style={{ color: 'var(--color-text-light)', marginTop: '8px' }}>AIがあなたの気持ちを言葉にしています</p>
        </div>
      );
    }

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h1 className="title">文章の調整</h1>
        <p className="subtitle">この内容でよろしいですか？自由に編集できます。</p>
        
        {generationMethod === 'template' && (
          <button 
            className="btn-ghost" 
            style={{ marginBottom: '16px', alignSelf: 'flex-start' }}
            onClick={() => {
              const newVar = templateVariant + 1;
              setTemplateVariant(newVar);
              generateText('template'); // 再生成
            }}
          >
            <RefreshCw size={16} /> 別の定型文を試す
          </button>
        )}

        <textarea
          className="input-text"
          style={{ flex: 1, minHeight: '200px' }}
          value={content}
          maxLength={1000}
          onChange={(e) => setContent(e.target.value)}
        />
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right', marginTop: '4px' }}>
          {content.length} / 1000
        </div>
        
        <div style={{ marginTop: '24px' }}>
          <button className="btn-primary" onClick={handleNextStep}>内容を確認する</button>
        </div>
      </div>
    );
  };

  // Step 5: 最終確認
  const renderStep5 = () => {
    const q1Array = [...selectedEmotions, ...(freeEmotion ? [freeEmotion] : [])];
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h1 className="title">送信内容の確認</h1>
        <p className="subtitle">
          以下の内容で
          {isEvent ? <strong>イベント主催者</strong> : <strong>「{creator?.name || '作家'}」</strong>}
          に送信します。
        </p>

        <div className="card" style={{ marginBottom: '32px' }}>
          {content && (
            <div style={{ marginBottom: inputType === 'questions' ? '24px' : '0', paddingBottom: inputType === 'questions' ? '16px' : '0', borderBottom: inputType === 'questions' ? '1px solid var(--color-border)' : 'none' }}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{content}</p>
            </div>
          )}
          
          {inputType === 'questions' && q1Array.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Q. どんな感情になったか</div>
                <div style={{ fontWeight: 500 }}>{q1Array.join('、')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Q. どこでそう感じたか</div>
                <div style={{ fontWeight: 500 }}>{q2 || '（未回答）'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Q. その理由は</div>
                <div style={{ fontWeight: 500 }}>{q3 || '（未回答）'}</div>
              </div>
            </div>
          )}

          {isEvent && Boolean(initialData?.referralSource) && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Q. 何でこのイベントを知りましたか？</div>
              <div style={{ fontWeight: 500 }}>{String(initialData?.referralSource)}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Send size={18} />
            {isSubmitting ? '送信中...' : '送信する'}
          </button>
        </div>
      </div>
    );
  };

  // 認証完了待ち
  if (!isAuthReady) {
    return (
      <div className="content-area fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--color-text-light)' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="content-area">
      {/* Header / Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button className="btn-ghost" style={{ padding: '8px' }} onClick={handlePrevStep}>
          <ArrowLeft size={20} />
          <span style={{ marginLeft: '4px' }}>{step === 1 ? 'やめる' : '戻る'}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>
          <span>Step {currentProgressStep} / {maxSteps}</span>
          <span>{isEvent ? 'イベントアンケート' : '作家への感想'}</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Steps */}
      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
}

export default function SurveyWizard() {
  return (
    <Suspense fallback={<div className="content-area fade-in" style={{ justifyContent: 'center' }}><p>読み込み中...</p></div>}>
      <SurveyWizardContent />
    </Suspense>
  );
}
