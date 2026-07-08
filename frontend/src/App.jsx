import { useAuth } from "./contexts";
import AppRouter from "./router";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--page-bg)" }}
      >
        <p style={{ color: "var(--text)" }}>⏳ Đang tải...</p>
      </div>
    );
  }

  return <AppRouter />;
}

export default App;
