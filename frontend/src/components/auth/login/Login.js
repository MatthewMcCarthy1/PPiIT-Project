import React, { useState } from "react";
import '../login/Login.css';
import { API_BASE_URL } from '../../../config'; // Importing API base URL from config

/**
 * Login Component
 * Handles user authentication by validating credentials against the backend
 * 
 * @param {function} setUser - Function to update user state in parent component upon successful login
 * @returns {JSX.Element} Login form
 */
function Login({ setUser }) {
  // State variables for form management
  const [email, setEmail] = useState("");       // Stores user's email input
  const [password, setPassword] = useState(""); // Stores user's password input
  const [error, setError] = useState('');       // Stores error messages for display
  const [showPassword, setShowPassword] = useState(false); // Controls password visibility toggle

  /**
   * Handles the login form submission
   * Authenticates user against backend and updates app state on success
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    try {
      const backendUrl = API_BASE_URL;
      
      // Send login request to backend
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session management
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
      {/* Display error message when authentication fails */}
      {error && <p style={{color: 'red'}}>{error}</p>}
      
      {/* Email input field */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      {/* Password input with visibility toggle */}
      <div className="password-container">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* Password visibility toggle button */}
        <i
          className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
          onClick={() => setShowPassword(!showPassword)} 
          aria-label={showPassword ? "Hide password" : "Show password"}
        ></i>
      </div>
      
      {/* Form submission button */}
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
