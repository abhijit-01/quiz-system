import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

const verticals = [
  "Power Electronics",
  "ESDM",
  "Mobility",
  "Robotics and Automation",
  "Strategic EPS",
];

function Register() {
  const navigate = useNavigate();

  const [psNo, setPsNo] = useState("");
  const [vertical, setVertical] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (!psNo || !vertical) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API}/api/participants/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          psNo,
          vertical,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      localStorage.setItem("participant", JSON.stringify(data.participant));

      navigate("/quiz");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quiz Challenge</h1>

            <p className="text-gray-500 mt-2">Register to participate</p>
          </div>

          <form onSubmit={handleRegister}>
            <label className="block text-sm font-medium mb-2">PS No.</label>

            <input
              type="text"
              value={psNo}
              onChange={(e) => setPsNo(e.target.value)}
              placeholder="Enter your PS No."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-green-500"
            />

            <label className="block text-sm font-medium mb-2">Vertical</label>

            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-5 bg-white outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select your vertical</option>

              {verticals.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-sm">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Registering..." : "Start Quiz"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
