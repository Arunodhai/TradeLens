import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/src/AuthContext';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { LineChart, Loader2, AlertCircle } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

export function Login() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } =
    useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/app', { replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password);
      } else {
        await resetPassword(email);
        setInfo('Password reset email sent. Check your inbox.');
      }
    } catch (err: any) {
      setError(friendlyError(err?.code));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(friendlyError(err?.code));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <LineChart className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">TradeLens</span>
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                  mode === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Log in
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                  mode === 'signup'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-1">Reset password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send a reset link.
              </p>
            </div>
          )}

          {/* Error / info */}
          {error && (
            <div className="flex items-center space-x-2 text-destructive bg-destructive/10 text-sm p-3 rounded-md mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md mb-4">
              {info}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {mode !== 'forgot' && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </Button>
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={submitting}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          {/* Footer links */}
          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setInfo(''); }}
                className="hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setInfo(''); }}
                className="hover:text-foreground transition-colors"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}

function friendlyError(code?: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
