import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { Github, Link2, AlertCircle } from 'lucide-react';
import ProgressBar from './components/ProgressBar';
import AdminControls from './components/AdminControls';
import LoginModal from './components/LoginModal';
import { isValidGitHubPRUrl } from './utils/validation';
import { savePRProgress, getPRProgress } from './utils/storage';
import { verifySlackUser, handleSlackCallback } from './utils/slack';
import Cookies from 'js-cookie';

const stages = [
  'PR Approved',
  'Ordering PCBs',
  'Printing your 3d Case!',
  'Out for Shipping',
  'Shipped :D ',
];

function App() {
  const [prUrl, setPrUrl] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState('');
  const clientSecret = import.meta.env.VITE_VITING_CODE;
  const navigate = useNavigate();

  useEffect(() => {
    const loadProgress = () => {
      if (isSubmitted && prUrl) {
        const savedProgress = getPRProgress(prUrl);
        if (savedProgress) {
          setProgress(savedProgress.progress);
          setCurrentStage(savedProgress.currentStage);
        } else {
          setProgress(0);
          setCurrentStage(stages[0]);
          savePRProgress(prUrl, 0, stages[0]);
        }
      }
    };

    loadProgress();
  }, [isSubmitted, prUrl]);

  useEffect(() => {
    const verifyExistingUser = async () => {
      const token = Cookies.get('slack_token');
      const userId = Cookies.get('slack_user_id');
      
      if (token && userId) {
        const { isAuthorized, error } = await verifySlackUser(token, userId);
        if (isAuthorized) {
          setIsAdmin(true);
        } else if (error) {
          setLoginError(error);
        }
      }
    };

    verifyExistingUser();
  }, []);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code && clientSecret) {
        const { success, error } = await handleSlackCallback(code, clientSecret);
        
        if (success) {
          const token = Cookies.get('slack_token');
          const userId = Cookies.get('slack_user_id');
          
          if (token && userId) {
            const { isAuthorized, error: verifyError } = await verifySlackUser(token, userId);
            if (isAuthorized) {
              setIsAdmin(true);
              navigate('/');
            } else {
              setLoginError(verifyError || 'Unauthorized user');
            }
          }
        } else {
          setLoginError(error || 'Authentication failed');
        }
      }
    };

    handleOAuthCallback();
  }, [navigate, clientSecret]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidGitHubPRUrl(prUrl)) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
    setIsSubmitted(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    Cookies.remove('slack_token');
    Cookies.remove('slack_user_id');
  };

  const handleProgressChange = (newProgress: number) => {
    if (!isAdmin) return;
    
    setProgress(newProgress);
    const newStage = stages[Math.floor((newProgress / 100) * (stages.length - 1))];
    setCurrentStage(newStage);
    
    if (prUrl) {
      savePRProgress(prUrl, newProgress, newStage);
    }
  };

  return (
    <Routes>
      <Route path="/callback" element={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Completing authentication...</p>
          </div>
        </div>
      } />
      <Route path="/" element={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-3">
                  <Github className="w-10 h-10" />
                  <h1 className="text-4xl font-bold">PR Progress Tracker</h1>
                </div>
                <div>
                  {isAdmin ? (
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Admin Login
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-gray-700">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="pr-url" className="block text-sm font-medium text-gray-300">
                        GitHub Pull Request URL
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Link2 className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          id="pr-url"
                          name="pr-url"
                          type="url"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="https://github.com/hackclub/hackpad/pull/1"
                          value={prUrl}
                          onChange={(e) => setPrUrl(e.target.value)}
                        />
                      </div>
                      {!isValid && (
                        <div className="flex items-center space-x-2 text-red-400 text-sm mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Invalid GitHub PR URL</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      Track Progress
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">Pull Request Status</h2>
                      <p className="text-gray-400 text-sm break-all">{prUrl}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-400">{currentStage}</span>
                        <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
                      </div>
                      <ProgressBar progress={progress} />
                    </div>

                    {isAdmin && (
                      <AdminControls
                        progress={progress}
                        currentStage={currentStage}
                        stages={stages}
                        onProgressChange={handleProgressChange}
                        onStageChange={(stage) => {
                          if (!isAdmin) return;
                          setCurrentStage(stage);
                          if (prUrl) {
                            savePRProgress(prUrl, progress, stage);
                          }
                        }}
                      />
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setIsSubmitted(false);
                          setPrUrl('');
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Track Another PR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showLoginModal && (
            <LoginModal
              onClose={() => {
                setShowLoginModal(false);
                setLoginError('');
              }}
              error={loginError}
            />
          )}
        </div>
      } />
    </Routes>
  );
}

function Root() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default Root;