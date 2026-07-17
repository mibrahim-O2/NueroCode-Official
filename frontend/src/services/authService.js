import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import { apiClient, TOKEN_STORAGE_KEY } from './apiClient';

async function exchangeFirebaseToken(firebaseUser) {
  const idToken = await firebaseUser.getIdToken();
  const { access_token, user } = await apiClient.post('/auth/login', { id_token: idToken });
  localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
  return user;
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return exchangeFirebaseToken(result.user);
}

export async function loginWithGithub() {
  const result = await signInWithPopup(auth, githubProvider);
  return exchangeFirebaseToken(result.user);
}

export async function fetchCurrentUser() {
  return apiClient.get('/auth/me');
}

export async function logout() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  await signOut(auth).catch(() => {});
}