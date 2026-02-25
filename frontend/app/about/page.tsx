export default function AboutPage() {
  return (
    <div className="glass p-6">
      <h2 className="text-neonBlue font-bold mb-4">About</h2>
      <div>Student: [اسم الطالب]</div>
      <div>Supervisor: [اسم المشرف]</div>
      <div className="mt-4">Tools: Next.js, FastAPI, PyTorch, SQLite, TailwindCSS, shadcn/ui, Framer Motion, Recharts</div>
      <div className="mt-4">Future work: SHAP الحقيقي، adversarial traffic، online learning</div>
    </div>
  );
}