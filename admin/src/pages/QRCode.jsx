import { QRCodeCanvas } from "qrcode.react";

function QRCodePage() {
  const participantURL = "http://localhost:5173/register";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
        <h1 className="text-3xl font-bold mb-3">Scan to Participate</h1>

        <p className="text-gray-500 mb-8">
          Scan this QR code to register for the quiz
        </p>

        <div className="flex justify-center">
          <QRCodeCanvas value={participantURL} size={280} level="H" />
        </div>

        <p className="text-sm text-gray-400 mt-6">
          Scan using your mobile phone
        </p>
      </div>
    </div>
  );
}

export default QRCodePage;
