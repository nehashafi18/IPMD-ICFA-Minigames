// Flat solid background — no gradients, no orbs
export default function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ background: '#F5F0EB' }}
    />
  );
}
