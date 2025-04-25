import React, { useState } from "react";
import "../register/Register.css";
import { API_BASE_URL } from "../../../config"; // Importing API base URL from config

/**
 * Register Component
 * Handles new user registration with ATU email validation
 * 
 * @param {function} setUser - Function to update user state in parent component upon successful registration
 * @returns {JSX.Element} Registration form
 */
function Register({ setUser }) {
  // State variables for form management
  const [email, setEmail] = useState("");       // Stores user's email input (must be @atu.ie)
  const [password, setPassword] = useState(""); // Stores user's password (min 8 characters)
  const [error, setError] = useState("");       // Stores validation/error messages
  const [showPassword, setShowPassword] = useState(false); // Controls password visibility toggle
  const [isLoading, setIsLoading] = useState(false);       // Tracks registration request status

  /**
   * Handles the registration form submission
   * Validates input, sends registration request, and updates app state on success
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Set loading state to show feedback to user

    // Input validation
    // Email domain validation - ensures institutional email only
    if (!email.endsWith("@atu.ie")) {
      setError("Only @atu.ie email addresses are allowed to register.");
      setIsLoading(false);
      return;
    }
    
    // Password strength validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }
    try {
      const backendUrl = API_BASE_URL;

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
        // Update to store both email and id
        setUser(data.user);
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
      {/* Display validation errors or server response messages */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {isLoading ? (
        /* Loading indicator shown during registration request processing */
        <div className="loading-spinner">
          Registering account...
          {/* You can replace this text with a spinner icon if desired */}
        </div>
      ) : (
        <>
          {/* Email input field with institutional domain requirement */}
          <input
            type="email"
            placeholder="Email (@atu.ie)"
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
              className={`fas ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            ></i>
          </div>
          {/* Form submission button */}
          <button type="submit">Register</button>
        </>
      )}
    </form>
  );
}

export default Register;
