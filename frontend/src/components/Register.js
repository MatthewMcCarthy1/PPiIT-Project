import React, { useState } from "react";
import "../components-css/Register.css";

function Register({ setUser }) {
  // State for form inputs and error message
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Set loading to true when registration starts

    // Check if the email ends with @atu.ie
    if (!email.endsWith("@atu.ie")) {
      setError("Only @atu.ie email addresses are allowed to register.");
      setIsLoading(false); // Stop loading if validation fails
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false); // Stop loading if validation fails
      return;
    }
    try {
      // Get the current hostname from the window location
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;

      // Send a POST request to the server for registration
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ action: "register", email, password }),
      });
      const data = await response.json();
      if (data.success) {
        setUser({ email });
      } else {
        setError(data.message || "An error occurred during registration");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false); // Stop loading after registration completes
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {isLoading ? (
        <div className="loading-spinner">
          Registering account...
          {/* You can replace this text with a spinner icon if desired */}
        </div>
      ) : (
        <>
          {/* Email input field */}
          <input
            type="email"
            placeholder="Email (@atu.ie)"
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
              className={`fas ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
              onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state
            ></i>
          </div>
          <button type="submit">Register</button>
        </>
      )}
    </form>
  );
}

export default Register;
