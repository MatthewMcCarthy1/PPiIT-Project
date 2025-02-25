import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import HomePage from "./components/HomePage";

function App() {
  // State to keep track of the user that is logged in
  const [user, setUser] = useState(null);

  // Effect to check for a stored user in localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Function to set the user and store in localStorage
  const handleSetUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <div className="App">
      {/* Conditional rendering based on user authentication state */}
      {!user ? (
        <>
          {/* Show Login and Register components if no user is logged in */}
          <Login setUser={handleSetUser} />
          <Register setUser={handleSetUser} />
        </>
      ) : (
        // Show HomePage if a user is logged in
        <HomePage user={user} setUser={setUser} />
      )}
    </div>
  );
}

export default App;
