import { useLocation } from "react-router";

export function App() {
  const location = useLocation();

  return (
    <main>
      <h1>MoodFit v3 Bootstrap</h1>
      <p>Current path: {location.pathname}</p>
    </main>
  );
}
