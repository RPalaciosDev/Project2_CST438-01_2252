import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={LoginForm} />
        <Route path="/signup" component={SignupForm} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <Route path="/" exact component={LoginForm} />
        <Route path="/oauth2/redirect" component={OAuth2RedirectHandler} />
      </Switch>
    </Router>
  );
}

export default App;