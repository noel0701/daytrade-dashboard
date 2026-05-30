import { useState, useEffect } from "react";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/data.json")
      .then(r => { if (!r.ok) throw new Error("data.json が見つかりません"); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div style={{ minHeight:"100vh", background:"#0a0c12", display:"flex", alignItems:"center", justifyContent:"center", color:"#ff4d6d", fontFamily:"monospace", padding:20, textAlign:"center" }}>
      <div>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:14 }}>{error}</div>
        <div style={{ fontSize:11, color:"#5a6280", marginTop:8 }}>
          scripts/log_to_json.py を実行して public/data.json を生成してください
        </div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight:"100vh", background:"#0a0c12", display:"flex", alignItems:"center", justifyContent:"center", color:"#00d4ff", fontFamily:"monospace" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:24, marginBottom:8 }}>⚡</div>
        <div style={{ fontSize:13 }}>Loading...</div>
      </div>
    </div>
  );

  return <Dashboard data={data} />;
}
