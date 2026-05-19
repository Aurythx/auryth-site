import ThunderstormBackground from "@/components/ThunderstormBackground";

export default function Home() {
  return (
    <main style={{ position: "relative", minHeight: "100vh" }}>
      <ThunderstormBackground />

      {/* Your existing homepage content goes here, on top of the storm */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* your content */}
      </div>
    </main>
  );
}
