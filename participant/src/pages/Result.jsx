import { useNavigate } from "react-router-dom";

function Result() {
  const navigate = useNavigate();

  const participant = JSON.parse(localStorage.getItem("participant"));

  const finish = () => {
    localStorage.removeItem("participant");

    navigate("/register");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="bg-white shadow-xl rounded-3xl p-10 text-center max-w-md w-full">
        <div className="text-6xl mb-5">🎉</div>

        <h1 className="text-3xl font-bold">Quiz Completed!</h1>

        <p className="text-gray-500 mt-3">Thank you for participating.</p>

        {participant && (
          <div className="bg-gray-50 rounded-xl p-4 mt-6 text-left">
            <p>
              <strong>PS No:</strong> {participant.psNo}
            </p>

            <p className="mt-2">
              <strong>Vertical:</strong> {participant.vertical}
            </p>
          </div>
        )}

        <button
          onClick={finish}
          className="mt-7 w-full bg-green-600 text-white py-3 rounded-xl font-semibold"
        >
          Finish
        </button>
      </div>
    </div>
  );
}

export default Result;
