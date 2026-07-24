import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useProjects } from "../../hooks/useProjects";

export function AppShell({ children }) {
  const { projects, loading, error } = useProjects();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Generate fixed random particles
  const [particles] = useState(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `-${Math.random() * 15 + 5}vh`,
      size: `${Math.random() * 120 + 60}px`,
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 25 + 15}s`,
      drift: `${Math.random() * 120 - 60}px`,
      opacity: Math.random() * 0.15 + 0.05,
    }));
  });

  // Track global mouse position for card glows
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll(".mouse-glow-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden">
      {/* Ambient Background Glow Blobs */}
      <div className="pointer-events-none fixed -left-20 top-20 -z-10 h-[450px] w-[450px] rounded-full bg-teal-400/15 dark:bg-teal-900/10 blur-[100px] ambient-blob-1" />
      <div className="pointer-events-none fixed right-10 bottom-20 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-400/15 dark:bg-indigo-900/10 blur-[100px] ambient-blob-2" />
      <div className="pointer-events-none fixed left-1/2 top-1/2 -z-10 h-[350px] w-[350px] rounded-full bg-pink-400/10 dark:bg-pink-900/5 blur-[100px] ambient-blob-1" />

      {/* Floating background particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="bg-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            "--particle-duration": p.duration,
            "--particle-drift": p.drift,
            "--particle-opacity": p.opacity,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        projects={projects}
        loading={loading}
        error={error}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <main className="ml-0 lg:ml-64 mt-14 min-h-[calc(100vh-3.5rem)] p-4 md:p-6 bg-transparent text-gray-900 dark:text-gray-100 transition-all duration-200">
        {children}
      </main>
    </div>
  );
}
