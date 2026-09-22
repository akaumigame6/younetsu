// Supabase Client Mock (localStorage based)

const isBrowser = typeof window !== 'undefined';

const mockSession = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  user: {
    id: 'mock-user-id',
    email: 'admin@example.com',
  },
};

const getStorageItem = (key: string) => {
  if (!isBrowser) return null;
  return localStorage.getItem(key);
};

const setStorageItem = (key: string, value: string) => {
  if (!isBrowser) return;
  localStorage.setItem(key, value);
};

export const supabase: any = {
  auth: {
    getSession: async () => {
      const loggedIn = getStorageItem('mock_logged_in') === 'true';
      return { data: { session: loggedIn ? mockSession : null }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
      // 簡易的なモックログイン（どんなパスワードでも通す、あるいは admin/admin 等）
      setStorageItem('mock_logged_in', 'true');
      return { data: { session: mockSession }, error: null };
    },
    signOut: async () => {
      setStorageItem('mock_logged_in', 'false');
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      const loggedIn = getStorageItem('mock_logged_in') === 'true';
      callback(loggedIn ? 'SIGNED_IN' : 'SIGNED_OUT', loggedIn ? mockSession : null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInAnonymously: async () => {
      setStorageItem('mock_logged_in', 'true');
      return { data: { session: mockSession, user: mockSession.user }, error: null };
    },
    getUser: async (token: string) => {
      if (token === 'mock-access-token') {
        return { data: { user: mockSession.user }, error: null };
      }
      return { data: null, error: new Error('Invalid token') };
    }
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        // Base64に変換してlocalStorageに保存
        return new Promise((resolve) => {
          if (!isBrowser) {
            resolve({ data: { path }, error: null });
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            const images = JSON.parse(getStorageItem(`mock_storage_${bucket}`) || '{}');
            images[path] = base64;
            setStorageItem(`mock_storage_${bucket}`, JSON.stringify(images));
            resolve({ data: { path }, error: null });
          };
          reader.onerror = () => {
            resolve({ data: null, error: new Error('Failed to read file') });
          };
          reader.readAsDataURL(file);
        });
      },
      getPublicUrl: (path: string) => {
        if (!isBrowser) return { data: { publicUrl: '' } };
        const images = JSON.parse(getStorageItem(`mock_storage_${bucket}`) || '{}');
        const base64 = images[path];
        return { data: { publicUrl: base64 || 'https://via.placeholder.com/150' } };
      },
      remove: async (paths: string[]) => {
        if (!isBrowser) return { data: null, error: null };
        const images = JSON.parse(getStorageItem(`mock_storage_${bucket}`) || '{}');
        for (const path of paths) {
          delete images[path];
        }
        setStorageItem(`mock_storage_${bucket}`, JSON.stringify(images));
        return { data: null, error: null };
      }
    })
  }
};
