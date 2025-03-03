import React, { useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

const OAuth2RedirectHandler = () => {
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    // Get token from URL parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Store token and user info
      const userData = {
        token: token,
        // We might want to decode JWT to get user details here
      };
      localStorage.setItem('user', JSON.stringify(userData));
      history.push('/dashboard');
    } else {
      history.push('/login');
    }
  }, [location, history]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-xl">Processing authentication...</div>
        <div className="mt-4">Please wait while we redirect you.</div>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;