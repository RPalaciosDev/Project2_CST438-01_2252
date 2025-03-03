import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SignIn from './(auth)/sign-in';
import SignUp from './(auth)/sign-up';
// import Dashboard from './(auth)/dashboard';
// import ProtectedRoute from './(auth)/ProtectedRoute';
// import OAuth2RedirectHandler from './app/(auth)/OAuth2RedirectHandler.jsx';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={SignIn} />
        <Route path="/signup" component={SignUp} />
        {/* <ProtectedRoute path="/dashboard" component={Dashboard} /> */}
        <Route path="/" exact component={SignIn} />
        {/* <Route path="/oauth2/redirect" component={OAuth2RedirectHandler} /> */}
      </Switch>
    </Router>
  );
}

export default App;