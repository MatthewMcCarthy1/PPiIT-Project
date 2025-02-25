import React, { useState } from "react";

function Register({ setUser }) {
  // State for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Check if the email ends with @atu.ie
    if (!email.endsWith("@atu.ie")) {
      alert("Only @atu.ie email addresses are allowed to register.");
      return;
    }
    // TODO: Implement registration logic with backend API
    console.log("Registration attempt:", email, password);
    setUser({ email }); // Temporary: set user on submit, will be removed
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
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
