import React, { useState } from "react";

function Login({ setUser }) {
  // State for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    //TODO: Implement login logic with backend API
    console.log("Login attempt:", email, password);
    setUser({ email }); // Temporary: set user on submit, will be removed 
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {/* Email input field */}
      <input
        type="email"
        placeholder="Email"
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
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
