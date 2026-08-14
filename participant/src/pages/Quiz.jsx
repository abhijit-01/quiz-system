import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function Quiz() {
  const navigate = useNavigate();

  const participant = JSON.parse(localStorage.getItem("participant"));

  const [sessionId, setSessionId] = useState(null);

  const [question, setQuestion] = useState(null);

  const [questionNumber, setQuestionNumber] = useState(0);

  const [totalQuestions, setTotalQuestions] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState("");

  const [timeLeft, setTimeLeft] = useState(30);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // ==========================================
  // START QUIZ
  // ==========================================

  useEffect(() => {
    if (!participant) {
      navigate("/register");

      return;
    }

    const startQuiz = async () => {
      try {
        const response = await fetch(`${API}/api/responses/start`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            participantId: participant.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message);

          return;
        }

        setSessionId(data.sessionId);

        setQuestion(data.question);

        setQuestionNumber(data.questionNumber);

        setTotalQuestions(data.totalQuestions);

        setTimeLeft(Math.ceil((data.remainingMs || 30000) / 1000));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    startQuiz();
  }, []);

  // ==========================================
  // TIMER
  // ==========================================

  useEffect(() => {
    if (!sessionId || !question) return;

    if (timeLeft <= 0) {
      submitAnswer();

      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, sessionId, question]);

  // ==========================================
  // SUBMIT
  // ==========================================

  const submitAnswer = async () => {
    if (submitting) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${API}/api/responses/submit`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          sessionId,

          answer: selectedAnswer || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);

        return;
      }

      // --------------------------------
      // QUIZ FINISHED
      // --------------------------------

      if (data.completed) {
        navigate("/result");

        return;
      }

      // --------------------------------
      // NEXT QUESTION
      // --------------------------------

      setQuestion(data.question);

      setQuestionNumber(data.questionNumber);

      setTotalQuestions(data.totalQuestions);

      setSelectedAnswer("");

      setTimeLeft(Math.ceil(data.remainingMs / 1000));
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Starting quiz...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No question available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-5 py-8">
      <div className="max-w-3xl mx-auto">
        {/* HEADER */}

        <div className="flex justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">PS No.</p>

            <p className="font-bold">{participant.psNo}</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Question</p>

            <p className="font-bold">
              {questionNumber} / {totalQuestions}
            </p>
          </div>
        </div>

        {/* CARD */}

        <div className="bg-white rounded-3xl shadow-xl p-7">
          {/* TIMER */}

          <div className="flex justify-center mb-7">
            <div
              className={`
                w-20 h-20
                rounded-full
                border-4
                flex
                items-center
                justify-center
                text-xl
                font-bold

                ${
                  timeLeft <= 10
                    ? "border-red-500 text-red-500"
                    : "border-green-600 text-green-600"
                }
              `}
            >
              {timeLeft}
            </div>
          </div>

          {/* QUESTION */}

          <h2 className="text-xl md:text-2xl font-bold mb-7">
            {question.questionText}
          </h2>

          {/* OPTIONS */}

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={option}
                disabled={submitting}
                onClick={() => setSelectedAnswer(option)}
                className={`
                    w-full
                    text-left
                    p-4
                    rounded-xl
                    border
                    transition

                    ${
                      selectedAnswer === option
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-green-400"
                    }
                  `}
              >
                <span className="font-bold mr-3">
                  {String.fromCharCode(65 + index)}.
                </span>

                {option}
              </button>
            ))}
          </div>

          {/* SUBMIT */}

          <button
            onClick={submitAnswer}
            disabled={submitting}
            className="
              w-full
              mt-8
              bg-green-600
              hover:bg-green-700
              text-white
              font-bold
              py-4
              rounded-xl
              disabled:opacity-50
            "
          >
            {submitting
              ? "Submitting..."
              : timeLeft <= 0
                ? "Time Up"
                : "Submit Answer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
