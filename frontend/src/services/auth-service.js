class AuthService {
    login(username, password) {
      return fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Invalid credentials');
        }
        return response.json();
      })
      .then(data => {
        if (data.token) {
          localStorage.setItem('user', JSON.stringify(data));
        }
        return data;
      });
    }
  
    logout() {
      localStorage.removeItem('user');
    }
  
    register(username, email, password, fullName) {
      return fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          fullName
        })
      });
    }
  
    getCurrentUser() {
      return JSON.parse(localStorage.getItem('user'));
    }
  
    isAuthenticated() {
      const user = this.getCurrentUser();
      return !!user && !!user.token;
    }
  
    getAuthHeader() {
      const user = this.getCurrentUser();
      if (user && user.token) {
        return { 'Authorization': 'Bearer ' + user.token };
      } else {
        return {};
      }
    }
  }
  
  export default new AuthService();