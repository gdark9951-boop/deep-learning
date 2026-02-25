export default function ThreatIntelPage() {
  return (
    <div className="glass p-6">
      <h2 className="text-neonBlue font-bold mb-4">Threat Intel</h2>
      <ul className="list-disc ml-6 text-neonCyan">
        <li>DoS: هجوم تعطيل الخدمة</li>
        <li>Probe: هجوم استطلاع الشبكة</li>
        <li>R2L: هجوم وصول عن بعد للمستخدم</li>
        <li>U2R: هجوم تصعيد الصلاحيات</li>
      </ul>
    </div>
  );
}