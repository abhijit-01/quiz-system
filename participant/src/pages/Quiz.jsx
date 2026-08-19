import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL;

const socket = io(API);

function Quiz() {
  const navigate = useNavigate();

  const participant = JSON.parse(localStorage.getItem("participant"));

  const [quizStatus, setQuizStatus] = useState("not_started");

  const [sessionId, setSessionId] = useState(null);

  const [question, setQuestion] = useState(null);

  const [questionNumber, setQuestionNumber] = useState(0);

  const [totalQuestions, setTotalQuestions] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState("");

  const [timeLeft, setTimeLeft] = useState(30);

  const [loading, setLoading] = useState(true);

  const [startingQuiz, setStartingQuiz] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ==================================================
  // CHECK QUIZ STATUS
  // ==================================================

  const checkQuizStatus = async () => {
    try {
      const response = await fetch(`${API}/api/quiz/status`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get quiz status");
      }

      setQuizStatus(data.status);

      return data.status;
    } catch (error) {
      console.error("Quiz status error:", error);

      return null;
    }
  };

  // ==================================================
  // START PARTICIPANT QUIZ SESSION
  // ==================================================

  const startParticipantQuiz = async () => {
    if (!participant?.id) {
      navigate("/register");
      return;
    }

    if (startingQuiz || sessionId) {
      return;
    }

    try {
      setStartingQuiz(true);

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
        if (data.quizEnded) {
          setQuizStatus("ended");
          return;
        }

        if (data.quizNotStarted) {
          setQuizStatus("not_started");
          return;
        }

        alert(data.message);
        return;
      }

      // Already completed
      if (data.completed) {
        navigate("/result");
        return;
      }

      setSessionId(data.sessionId);

      setQuestion(data.question);

      setQuestionNumber(data.questionNumber);

      setTotalQuestions(data.totalQuestions);

      setTimeLeft(Math.ceil((data.remainingMs || 30000) / 1000));

      setQuizStatus("started");
    } catch (error) {
      console.error("Start participant quiz error:", error);
    } finally {
      setStartingQuiz(false);
      setLoading(false);
    }
  };

  // ==================================================
  // INITIAL LOAD + SOCKET EVENTS
  // ==================================================

  useEffect(() => {
    if (!participant) {
      navigate("/register");
      return;
    }

    const initialize = async () => {
      const status = await checkQuizStatus();

      if (status === "started") {
        await startParticipantQuiz();
      } else {
        setLoading(false);
      }
    };

    initialize();

    // ----------------------------------------------
    // ADMIN STARTED QUIZ
    // ----------------------------------------------

    socket.on("quizStarted", () => {
      console.log("Quiz started by admin");

      setQuizStatus("started");

      startParticipantQuiz();
    });

    // ----------------------------------------------
    // ADMIN ENDED QUIZ
    // ----------------------------------------------

    socket.on("quizEnded", () => {
      console.log("Quiz ended by admin");

      setQuizStatus("ended");

      setQuestion(null);
    });

    return () => {
      socket.off("quizStarted");
      socket.off("quizEnded");
    };
  }, []);

  // ==================================================
  // TIMER
  // ==================================================

  useEffect(() => {
    if (!sessionId || !question || quizStatus !== "started") {
      return;
    }

    if (timeLeft <= 0) {
      submitAnswer();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, sessionId, question, quizStatus]);

  // ==================================================
  // SUBMIT ANSWER
  // ==================================================

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

      // ----------------------------------------------
      // QUIZ FINISHED
      // ----------------------------------------------

      if (data.completed) {
        navigate("/result");
        return;
      }

      // ----------------------------------------------
      // NEXT QUESTION
      // ----------------------------------------------

      setQuestion(data.question);

      setQuestionNumber(data.questionNumber);

      setTotalQuestions(data.totalQuestions);

      setSelectedAnswer("");

      setTimeLeft(Math.ceil(data.remainingMs / 1000));
    } catch (error) {
      console.error("Submit answer error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600">Checking quiz status...</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // WAITING FOR ADMIN
  // ==================================================

  if (quizStatus === "not_started") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-5">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⏳</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            You're Registered!
          </h1>

          <p className="text-gray-500 mt-3">
            Please wait for the admin to start the quiz.
          </p>

          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Participant</p>

            <p className="font-bold">{participant?.name}</p>

            <p className="text-sm text-gray-500 mt-2">
              PS No. {participant?.psNo}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-green-600">
            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />

            <span className="text-sm font-medium">
              Waiting for quiz to start...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // QUIZ ENDED
  // ==================================================

  if (quizStatus === "ended") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-5">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏁</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Quiz Has Ended</h1>

          <p className="text-gray-500 mt-3">
            The administrator has ended the quiz.
          </p>

          <p className="text-sm text-gray-400 mt-6">
            Thank you for participating.
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // QUIZ STARTING
  // ==================================================

  if (startingQuiz && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600">Starting quiz...</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // NO QUESTION
  // ==================================================

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>No question available.</p>
      </div>
    );
  }

  // ==================================================
  // QUIZ UI
  // ==================================================

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
