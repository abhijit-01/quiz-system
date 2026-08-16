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

  const efficiencyData = verticals
    .map((vertical) => {
      const participantCount = participants.filter(
        (participant) => participant.vertical === vertical,
      ).length;

      const correctAnswers = responses.filter(
        (response) =>
          response.participant?.vertical === vertical && response.isCorrect,
      ).length;

      const efficiency =
        participantCount > 0 ? correctAnswers / participantCount : 0;

      return {
        vertical,
        participantCount,
        correctAnswers,
        efficiency,
      };
    })
    .sort((a, b) => b.efficiency - a.efficiency);

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ======================================
          HEADER
      ====================================== */}

      <header className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold">Quiz Admin Dashboard</h1>

          <p className="text-gray-400 mt-1">Live competition monitoring</p>
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
              Ranked by correct answers per participant
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
                      {/* RANK */}

                      <td className="py-3 font-bold">
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `#${index + 1}`}
                      </td>

                      {/* NAME */}

                      <td className="font-medium">
                        {item.participant?.name || "—"}
                      </td>

                      {/* PS NO */}

                      <td>{item.participant?.psNo || "—"}</td>

                      {/* VERTICAL */}

                      <td>{item.participant?.vertical || "—"}</td>

                      {/* CORRECT */}

                      <td className="font-bold">{item.correctAnswers}</td>

                      {/* TOTAL TIME */}

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
