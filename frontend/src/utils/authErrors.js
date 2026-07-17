const MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
};

export function friendlyAuthError(error) {
  return MESSAGES[error?.code] || error?.message || 'Something went wrong. Please try again.';
}