import React, { useState } from "react";

function Login({ setUser }) {
  //state for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    //TODO: Implement login logic with backend API
    console.log("Login attempt:", email, password);
    setUser({ email }); //temporary: set user on submit, will be removed 
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {/*email input field */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {/*password input field */}
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
