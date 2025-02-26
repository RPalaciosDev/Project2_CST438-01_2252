import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
// Import will be restored when the component is created
// import OAuth2RedirectHandler from './components/auth/OAuth2RedirectHandler';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/" exact component={LoginForm} />
          <Route path="/login" component={LoginForm} />
          <Route path="/signup" component={SignupForm} />
          {/* Route will be restored when the component is created */}
          {/* <Route path="/oauth2/redirect" component={OAuth2RedirectHandler} /> */}
        </Switch>
      </Router>
    </div>
  );
}

export default App;