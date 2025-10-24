import React, { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Stop the form from refreshing the page

    try {
      // This is the key part!
      // We send a POST request to our Node.js backend
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success! Welcome, ${data.user.name}`);
        // Here you would save the user's token and redirect to the dashboard
        // For example: localStorage.setItem('token', data.token);
        // window.location.href = '/dashboard';
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (err) {
      setMessage('Login failed. Is the server running?');
    }
  };

  return (
    <div /* Your login form styling here */>
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign In</button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}

export default Login;
