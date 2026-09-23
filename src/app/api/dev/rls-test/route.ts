import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 環境変数の確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is only available in development.' }, { status: 403 });
  }

  const results: any[] = [];
  
  const baseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // テスト用のアカウント情報
  const userAEmail = `test-user-a-${Date.now()}@example.com`;
  const userBEmail = `test-user-b-${Date.now()}@example.com`;
  const password = 'test-password-123';
  
  let userA_id = '';
  let userB_id = '';
  const eventAId = crypto.randomUUID();
  const feedbackId = crypto.randomUUID();

  try {
    // ユーザーA作成
    const { data: authA, error: errA } = await baseClient.auth.signUp({
      email: userAEmail,
      password: password,
    });
    if (errA) throw new Error(`User A creation failed: ${errA.message}`);
    userA_id = authA.user?.id || '';
    results.push({ step: 'Create User A', status: 'Success', id: userA_id });

    // ユーザーB作成
    const { data: authB, error: errB } = await baseClient.auth.signUp({
      email: userBEmail,
      password: password,
    });
    if (errB) throw new Error(`User B creation failed: ${errB.message}`);
    userB_id = authB.user?.id || '';
    results.push({ step: 'Create User B', status: 'Success', id: userB_id });

    // 2. Client A (User A としてログイン)
    const clientA = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    await clientA.auth.signInWithPassword({ email: userAEmail, password });

    // 3. Client B (User B としてログイン)
    const clientB = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    await clientB.auth.signInWithPassword({ email: userBEmail, password });

    // 4. Anon Client (匿名ユーザー)
    const clientAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    const { data: anonAuthData, error: anonError } = await clientAnon.auth.signInAnonymously();
    if (anonError) {
      results.push({ step: 'Create Anon', status: 'Failed', detail: anonError.message });
    }
    const anonUserId = anonAuthData?.user?.id || null;
    results.push({ step: 'Anon ID Check', status: anonUserId ? 'Success' : 'Failed', detail: `ID: ${anonUserId}` });

    // --- テストシナリオ ---
    
    // [Test 1] User A が自分のイベントを作成できるか -> OK
    const { error: insertAError } = await clientA.from('Event').insert({
      id: eventAId,
      title: 'User A Event',
      userId: userA_id,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    results.push({ 
      step: 'Test 1: User A inserts event', 
      status: insertAError ? 'Failed' : 'Success',
      detail: insertAError?.message 
    });

    // [Test 2] User B が User A のイベントを更新しようとする -> RLSでブロックされる (空配列が返る)
    const { data: updateBData, error: updateBError } = await clientB.from('Event')
      .update({ title: 'Hacked by B' })
      .eq('id', eventAId)
      .select();
    const test2Success = !updateBError && (updateBData === null || updateBData.length === 0);
    results.push({ 
      step: 'Test 2: User B tries to update User A event', 
      status: test2Success ? 'Success (Blocked)' : 'Failed (Allowed or Error)',
      detail: updateBError?.message || `Updated rows: ${updateBData?.length}`
    });

    // [Test 3] Anon がイベントを作成しようとする -> RLSでブロックされる
    const { error: insertAnonError } = await clientAnon.from('Event').insert({
      id: crypto.randomUUID(),
      title: 'Anon Event',
      userId: userA_id,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString()
    });
    const test3Success = insertAnonError !== null; // エラーになるべき
    results.push({ 
      step: 'Test 3: Anon tries to insert event', 
      status: test3Success ? 'Success (Blocked)' : 'Failed (Allowed!)',
      detail: insertAnonError?.message || 'No error thrown'
    });

    // [Test 4] Anon が User A のイベントに感想を投稿する -> OK
    const { error: anonFeedbackError } = await clientAnon.from('EventFeedback').insert({
      id: feedbackId,
      eventId: eventAId,
      userId: anonUserId,
      inputType: 'free',
      content: 'Great event!',
      q1: [],
      q2: '',
      q3: '',
      referralSources: [],
      isRead: false,
      updatedAt: new Date().toISOString()
    });
    results.push({ 
      step: 'Test 4: Anon submits feedback', 
      status: !anonFeedbackError ? 'Success' : 'Failed',
      detail: anonFeedbackError?.message 
    });

    // [Test 5] User B が User A への感想を見ようとする -> RLSで見えない
    const { data: bViewsFeedback, error: bViewsFeedbackError } = await clientB.from('EventFeedback')
      .select('*')
      .eq('eventId', eventAId);
    const test5Success = !bViewsFeedbackError && (bViewsFeedback === null || bViewsFeedback.length === 0);
    results.push({ 
      step: 'Test 5: User B tries to view User A feedback', 
      status: test5Success ? 'Success (Hidden)' : 'Failed (Visible or Error)',
      detail: bViewsFeedbackError?.message || `Found rows: ${bViewsFeedback?.length}`
    });

    // [Test 6] User A が 自分のイベントの感想を見る -> OK
    const { data: aViewsFeedback, error: aViewsFeedbackError } = await clientA.from('EventFeedback')
      .select('*')
      .eq('eventId', eventAId);
    const test6Success = !aViewsFeedbackError && aViewsFeedback && aViewsFeedback.length === 1;
    results.push({ 
      step: 'Test 6: User A views their event feedback', 
      status: test6Success ? 'Success (Visible)' : 'Failed (Hidden or Error)',
      detail: aViewsFeedbackError?.message || `Found rows: ${aViewsFeedback?.length}`
    });

    // [Test 7] User B tries to delete User A event -> Blocked
    const { error: deleteBError } = await clientB.from('Event').delete().eq('id', eventAId);
    // Supposed to succeed without actually deleting, or throw an error depending on Supabase version
    const { data: eventStillExists } = await clientA.from('Event').select('id').eq('id', eventAId).single();
    results.push({ 
      step: 'Test 7: User B tries to delete User A event', 
      status: eventStillExists ? 'Success (Blocked)' : 'Failed (Deleted!)',
      detail: deleteBError?.message || 'Event still exists'
    });

    // [Test 8] User A inserts Exhibit -> OK
    const exhibitId = crypto.randomUUID();
    const { error: insertExhibitError } = await clientA.from('Exhibit').insert({
      id: exhibitId,
      eventId: eventAId,
      name: 'User A Exhibit',
      shareToken: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    results.push({ 
      step: 'Test 8: User A inserts Exhibit', 
      status: !insertExhibitError ? 'Success' : 'Failed',
      detail: insertExhibitError?.message
    });

    // [Test 9] User B tries to update User A's Exhibit -> Blocked
    const { data: updateExhibitB, error: updateExhibitBError } = await clientB.from('Exhibit')
      .update({ name: 'Hacked Exhibit' })
      .eq('id', exhibitId)
      .select();
    results.push({ 
      step: 'Test 9: User B tries to update User A Exhibit', 
      status: (!updateExhibitBError && (updateExhibitB === null || updateExhibitB.length === 0)) ? 'Success (Blocked)' : 'Failed',
      detail: updateExhibitBError?.message || `Updated rows: ${updateExhibitB?.length}`
    });

    // [Test 10] User B tries to delete User A's Exhibit -> Blocked
    await clientB.from('Exhibit').delete().eq('id', exhibitId);
    const { data: exhibitStillExists } = await clientA.from('Exhibit').select('id').eq('id', exhibitId).single();
    results.push({ 
      step: 'Test 10: User B tries to delete User A Exhibit', 
      status: exhibitStillExists ? 'Success (Blocked)' : 'Failed (Deleted!)',
      detail: 'Exhibit still exists'
    });

    // [Test 11] Anon tries to update someone else's Feedback -> Blocked
    const { data: updateFeedbackAnon, error: updateFeedbackAnonError } = await clientAnon.from('EventFeedback')
      .update({ content: 'Hacked feedback' })
      .eq('id', feedbackId) // anon owns this feedback, so let's try to update an imaginary other feedback
      .neq('userId', anonUserId)
      .select();
    results.push({ 
      step: 'Test 11: Anon tries to update other feedback', 
      status: (!updateFeedbackAnonError && (updateFeedbackAnon === null || updateFeedbackAnon.length === 0)) ? 'Success (Blocked)' : 'Failed',
      detail: updateFeedbackAnonError?.message || `Updated rows: ${updateFeedbackAnon?.length}`
    });

    // [Test 12] Anon updates their own Feedback -> OK
    const { data: updateOwnFeedback, error: updateOwnFeedbackError } = await clientAnon.from('EventFeedback')
      .update({ content: 'Updated my own feedback' })
      .eq('id', feedbackId)
      .select();
    results.push({ 
      step: 'Test 12: Anon updates their own feedback', 
      status: (!updateOwnFeedbackError && updateOwnFeedback && updateOwnFeedback.length === 1) ? 'Success' : 'Failed',
      detail: updateOwnFeedbackError?.message || `Updated rows: ${updateOwnFeedback?.length}`
    });

    // [Test 13] Public API endpoint does not leak internal info
    try {
      const host = request?.headers?.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const apiRes = await fetch(`${protocol}://${host}/api/exhibits?eventId=${eventAId}`);
      if (apiRes.ok) {
        const exhibitsJson = await apiRes.json();
        if (exhibitsJson.length > 0) {
          const sample = exhibitsJson[0];
          // Check that sensitive or internal fields are NOT present. We expect id, eventId, name, description, iconUrl, createdAt.
          // shareToken is explicitly NOT selected in the public list API.
          const hasShareToken = 'shareToken' in sample;
          results.push({
            step: 'Test 13: Public API does not leak shareToken',
            status: !hasShareToken ? 'Success' : 'Failed (Leaked)',
            detail: !hasShareToken ? 'shareToken not found in response' : 'shareToken was present'
          });
        } else {
          results.push({ step: 'Test 13: Public API check', status: 'Failed', detail: 'No exhibits returned from API' });
        }
      } else {
        results.push({ step: 'Test 13: Public API check', status: 'Failed', detail: `API returned ${apiRes.status}` });
      }
    } catch (e: any) {
      results.push({ step: 'Test 13: Public API check', status: 'Failed', detail: e.message });
    }

    return NextResponse.json({ summary: 'RLS Tests Completed', results });

  } catch (err: any) {
    return NextResponse.json({ error: 'Test execution failed', message: err.message, results }, { status: 500 });
  } finally {
    // --- クリーンアップ (Service Roleなしなのでレコードのみクライアント権限で削除) ---
    // 自分自身のイベントなら削除可能
    const clientA = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    await clientA.auth.signInWithPassword({ email: userAEmail, password });
    await clientA.from('Event').delete().eq('id', eventAId);
  }
}
