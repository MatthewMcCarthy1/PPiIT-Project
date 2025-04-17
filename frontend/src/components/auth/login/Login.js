import React, { useState } from "react";
import '../login/Login.css';

function Login({ setUser }) {
  // State for form inputs and error message
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Get the current hostname from the window location
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      } else {
        setError(data.message || 'An error occurred during login');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } 
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {/* Email input field */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {/* Password input field */}
      <div className="password-container">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <i
          className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
          onClick={() => setShowPassword(!showPassword)} 
        ></i>
      </div>
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
