import { useState, useEffect } from "react";

function App() {
  const [status, setStatus] = useState("...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
      <div className="p-8 rounded-xl bg-slate-800 shadow-md">
        <h1 className="text-2xl font-bold mb-2">LAMARL Playground</h1>
        <p>Backend status: {status}</p>
      </div>
    </div>
  );
}

export default App;
