export default function PrayerCard({ schedule }) {
  if (!schedule) return null;

  const { tanggal, imsak, subuh, dzuhur, ashar, maghrib, isya } = schedule;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full text-gray-800">
      <h2 className="text-xl font-semibold text-center mb-4">
        Jadwal Shalat Hari Ini
      </h2>
      <p className="text-center text-sm text-gray-500 mb-3">{tanggal}</p>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="font-medium">Imsak</p>
          <p>{imsak}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="font-medium">Subuh</p>
          <p>{subuh}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="font-medium">Dzuhur</p>
          <p>{dzuhur}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="font-medium">Ashar</p>
          <p>{ashar}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="font-medium">Maghrib</p>
          <p>{maghrib}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="font-medium">Isya</p>
          <p>{isya}</p>
        </div>
      </div>
    </div>
  );
}
