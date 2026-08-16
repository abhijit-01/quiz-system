import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL;

const socket = io(API);

const verticals = [
  "Power Electronics",
  "ESDM",
  "Mobility",
  "Robotics and Automation",
  "Strategic EPS",
  "Support Staff",
];

function Dashboard() {
  const [participants, setParticipants] = useState([]);
  const [responses, setResponses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const [resetting, setResetting] = useState(false);

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  const loadData = async () => {
    try {
      const [participantsResponse, responsesResponse, leaderboardResponse] =
        await Promise.all([
          fetch(`${API}/api/participants`),
          fetch(`${API}/api/responses`),
          fetch(`${API}/api/responses/leaderboard`),
        ]);

      const participantsData = await participantsResponse.json();

      const responsesData = await responsesResponse.json();

      const leaderboardData = await leaderboardResponse.json();

      setParticipants(participantsData);
      setResponses(responsesData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Dashboard error:", error);
    }
  };

  // ==========================================
  // RESET QUIZ
  // ==========================================

  const resetQuiz = async () => {
    if (resetting) return;

    const confirmation = window.confirm(
      "⚠️ RESET QUIZ\n\nThis will permanently delete:\n\n• All participants\n• All responses\n• All quiz sessions\n\nQuestions will NOT be deleted.\n\nAre you sure you want to continue?",
    );

    if (!confirmation) return;

    const resetCode = window.prompt('Type "RESET" to confirm:');

    if (resetCode !== "RESET") {
      if (resetCode !== null) {
        alert("Reset cancelled. You must type RESET exactly.");
      }

      return;
    }

    try {
      setResetting(true);

      const response = await fetch(`${API}/api/responses/reset`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Reset failed");
      }

      alert("Quiz data reset successfully!");

      await loadData();
    } catch (error) {
      console.error("Reset error:", error);

      alert(error.message || "Failed to reset quiz data.");
    } finally {
      setResetting(false);
    }
  };

  // ==========================================
  // LIVE UPDATES
  // ==========================================

  useEffect(() => {
    loadData();

    socket.on("answerSubmitted", () => {
      loadData();
    });

    socket.on("participantRegistered", () => {
      loadData();
    });

    return () => {
      socket.off("answerSubmitted");
      socket.off("participantRegistered");
    };
  }, []);

  // ==========================================
  // PARTICIPATION GRAPH
  // ==========================================

  const participationData = verticals.map((vertical) => {
    const count = participants.filter(
      (participant) => participant.vertical === vertical,
    ).length;

    return {
      vertical,
      participants: count,
    };
  });

  // ==========================================
  // ANSWER GRAPH
  // ==========================================

  const answerData = verticals.map((vertical) => {
    const verticalResponses = responses.filter(
      (response) => response.participant?.vertical === vertical,
    );

    const correct = verticalResponses.filter(
      (response) => response.isCorrect,
    ).length;

    const incorrect = verticalResponses.filter(
      (response) => !response.isCorrect,
    ).length;

    return {
      vertical,
      correct,
      incorrect,
    };
  });

  // ==========================================
  // VERTICAL EFFICIENCY RANKING
  // ==========================================

  const efficiencyData = verticals.map((vertical) => {
    const participantCount = participants.filter(
      (participant) => participant.vertical === vertical,
    ).length;

    const correctAnswers = responses.filter(
      (response) =>
        response.participant?.vertical === vertical && response.isCorrect,
    ).length;

    const efficiency =
      participantCount > 0 ? correctAnswers / participantCount : 0;

    // Find best individual from this vertical
    const bestIndividualIndex = leaderboard.findIndex(
      (item) => item.participant?.vertical === vertical,
    );

    return {
      vertical,
      participantCount,
      correctAnswers,
      efficiency,

      bestIndividualRank:
        bestIndividualIndex === -1 ? Infinity : bestIndividualIndex,
    };
  });

  // ==========================================
  // SORT VERTICALS
  //
  // 1. Higher efficiency wins
  // 2. If same efficiency,
  //    better individual ranking wins
  // ==========================================

  efficiencyData.sort((a, b) => {
    if (b.efficiency !== a.efficiency) {
      return b.efficiency - a.efficiency;
    }

    return a.bestIndividualRank - b.bestIndividualRank;
  });

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ======================================
          HEADER
      ====================================== */}

      <header className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            {/* TITLE */}

            <div>
              <h1 className="text-2xl font-bold">Quiz Admin Dashboard</h1>

              <p className="text-gray-400 mt-1">Live competition monitoring</p>
            </div>

            {/* ADMIN CONTROL */}

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right mr-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Admin Control
                </p>

                <p className="text-sm text-gray-400">Quiz data management</p>
              </div>

              <button
                onClick={resetQuiz}
                disabled={resetting}
                className="
                  group
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  border
                  border-red-500/30
                  bg-red-500/10
                  hover:bg-red-500/20
                  hover:border-red-500/50
                  text-red-400
                  hover:text-red-300
                  font-semibold
                  text-sm
                  transition-all
                  duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {/* RESET ICON */}

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992M16.023 9.348l2.185-2.185m-2.185 2.185 2.185 2.185M6.977 14.652H1.985m4.992 0-2.185 2.185m2.185-2.185-2.185-2.185M9.75 4.5a7.5 7.5 0 1 1-3.674 14.038"
                  />
                </svg>

                {resetting ? "Resetting..." : "Reset Quiz"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ======================================
            STATS
        ====================================== */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <StatCard title="Participants" value={participants.length} />

          <StatCard title="Total Answers" value={responses.length} />

          <StatCard
            title="Correct Answers"
            value={responses.filter((response) => response.isCorrect).length}
          />

          <StatCard
            title="Current Leader"
            value={
              leaderboard.length
                ? leaderboard[0].participant?.name || "--"
                : "--"
            }
          />
        </div>

        {/* ======================================
            PARTICIPATION GRAPH
        ====================================== */}

        <ChartCard
          title="Participants by Vertical"
          subtitle="Live registration count"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={participationData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="vertical" tick={{ fontSize: 12 }} />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Bar
                dataKey="participants"
                fill="#16a34a"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ======================================
            ANSWER GRAPH
        ====================================== */}

        <ChartCard
          title="Live Answer Statistics"
          subtitle="Correct vs incorrect answers by vertical"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={answerData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="vertical" tick={{ fontSize: 12 }} />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="correct"
                name="Correct"
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="incorrect"
                name="Incorrect"
                fill="#dc2626"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ======================================
            VERTICAL EFFICIENCY RANKING
        ====================================== */}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Vertical Efficiency Ranking</h2>

            <p className="text-gray-500 text-sm">
              Ranked by correct answers per participant. Ties are decided by the
              highest-ranked individual.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3">Rank</th>

                  <th>Vertical</th>

                  <th>Efficiency</th>
                </tr>
              </thead>

              <tbody>
                {efficiencyData.map((item, index) => (
                  <tr key={item.vertical} className="border-b">
                    <td className="py-3 font-bold">
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                    </td>

                    <td className="font-medium">{item.vertical}</td>

                    <td className="font-bold text-green-600">
                      {item.efficiency.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================
            INDIVIDUAL LEADERBOARD
        ====================================== */}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Individual Leaderboard</h2>

            <p className="text-gray-500 text-sm">
              Ranked by correct answers, with total quiz time as the tie-breaker
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3">Rank</th>

                  <th>Name</th>

                  <th>PS No.</th>

                  <th>Vertical</th>

                  <th>Correct</th>

                  <th>Total Time</th>
                </tr>
              </thead>

              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No responses yet
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item, index) => (
                    <tr
                      key={item.participant?._id || index}
                      className="border-b"
                    >
                      <td className="py-3 font-bold">
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `#${index + 1}`}
                      </td>

                      <td className="font-medium">
                        {item.participant?.name || "—"}
                      </td>

                      <td>{item.participant?.psNo || "—"}</td>

                      <td>{item.participant?.vertical || "—"}</td>

                      <td className="font-bold">{item.correctAnswers}</td>

                      <td className="font-semibold text-green-600">
                        {(item.totalQuizTime / 1000).toFixed(2)}s
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <p className="text-gray-500 text-sm">{title}</p>

      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

// ==========================================
// CHART CARD
// ==========================================

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
      <h2 className="text-xl font-bold">{title}</h2>

      <p className="text-gray-500 text-sm mb-6">{subtitle}</p>

      <div className="h-[350px]">{children}</div>
    </div>
  );
}

export default Dashboard;
