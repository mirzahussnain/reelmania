import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { FaSignInAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const { isSignedIn } = useAuth();
  const navigateTo = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigateTo('/foryou');
    }
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-syne font-bold text-on-surface">
            Welcome
            <span className="block mt-2 text-primary drop-shadow-[0_0_15px_var(--color-primary)]">ReelMania</span>
          </h1>
          <p className="text-on-surface-variant text-lg">Choose how you want to continue</p>
        </div>

        <div className="space-y-4 flex flex-col justify-center items-center">
          <button
            className="lg:w-[30rem] w-[19rem] py-4 bg-primary rounded-xl flex justify-center items-center hover:bg-primary-container hover:shadow-[0_0_15px_var(--color-primary)] transition-all"
            onClick={() => navigateTo("/sign-in")}
          >
            <FaSignInAlt className="text-2xl text-on-primary" />
            <span className="ml-5 text-xl text-on-primary font-bold tracking-wider">Sign in by Email</span>
          </button>

          <div className="relative my-8 w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="divider-h"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-on-surface-variant bg-background">or</span>
            </div>
          </div>

          <button
            className="lg:w-[30rem] w-[20rem] py-4 bg-surface-container-high rounded-xl flex justify-center items-center hover:bg-surface-container-highest transition-all"
            onClick={() => navigateTo("/foryou")}
          >
            <span className="text-xl text-on-surface font-medium tracking-wider">Continue as Guest</span>
          </button>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:text-primary-container transition-colors">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:text-primary-container transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}