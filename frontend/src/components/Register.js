import React, { useState } from "react";

function Register({ setUser }) {
  // State for form inputs and error message
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Check if the email ends with @atu.ie
    if (!email.endsWith("@atu.ie")) {
      setError("Only @atu.ie email addresses are allowed to register.");
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    try {
      // Send a POST request to the server for registration
      const response = await fetch('http://localhost:8000/server.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'register', email, password }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setUser({ email });
      } else {
        setError(data.message || 'An error occurred during registration');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {/* Email input field */}
      <input
        type="email"
        placeholder="Email (@atu.ie)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {/* Password input field */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
