import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
import { seedKnowledgeBase } from "./lib/offlineDB"

// Seed WHO/ICDS knowledge base into IndexedDB on first launch
seedKnowledgeBase().catch(console.warn)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
