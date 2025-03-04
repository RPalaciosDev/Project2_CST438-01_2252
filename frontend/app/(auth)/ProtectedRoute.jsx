import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import AuthService from '../services/auth-service';

const ProtectedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      AuthService.isAuthenticated() ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{
            pathname: "/sign-in",
            state: { from: props.location }
          }}
        />
      )
    }
  />
);

export default ProtectedRoute;