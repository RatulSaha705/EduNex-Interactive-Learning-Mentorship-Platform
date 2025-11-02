import "./App.css";
import Register from "./components/Register";
import Login from "./components/Login";
import { useState } from "react";

function App() {
  const [showRegister, setShowRegister] = useState(true);

  return (
    <div className="App">
      <div className="text-center my-3">
        <button
          className={`btn me-2 ${
            showRegister ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setShowRegister(true)}
        >
          Register
        </button>
        <button
          className={`btn ${
            !showRegister ? "btn-success" : "btn-outline-success"
          }`}
          onClick={() => setShowRegister(false)}
        >
          Login
        </button>
      </div>
      {showRegister ? <Register /> : <Login />}
    </div>
  );
}

export default App;
