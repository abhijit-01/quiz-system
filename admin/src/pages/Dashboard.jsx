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
];

function Dashboard() {
  const [participants, setParticipants] = useState([]);
  const [responses, setResponses] = useState([]);
  const [fastest, setFastest] = useState([]);

  const loadData = async () => {
    try {
      const [participantsResponse, responsesResponse, fastestResponse] =
        await Promise.all([
          fetch(`${API}/api/participants`),
          fetch(`${API}/api/responses`),
          fetch(`${API}/api/responses/fastest`),
        ]);

      const participantsData = await participantsResponse.json();
      const responsesData = await responsesResponse.json();
      const fastestData = await fastestResponse.json();

      setParticipants(participantsData);
      setResponses(responsesData);
      setFastest(fastestData);
    } catch (error) {
      console.error("Dashboard error:", error);
    }
  };

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

  // -----------------------------------------
  // PARTICIPATION GRAPH
  // -----------------------------------------

  const participationData = verticals.map((vertical) => {
    const count = participants.filter(
      (participant) => participant.vertical === vertical,
    ).length;

    return {
      vertical,
      participants: count,
    };
  });

  // -----------------------------------------
  // ANSWER GRAPH
  // -----------------------------------------

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}

      <header className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold">Quiz Admin Dashboard</h1>

          <p className="text-gray-400 mt-1">Live competition monitoring</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <StatCard title="Participants" value={participants.length} />

          <StatCard title="Total Answers" value={responses.length} />

          <StatCard
            title="Correct Answers"
            value={responses.filter((response) => response.isCorrect).length}
          />

          <StatCard
            title="Fastest Response"
            value={
              fastest.length
                ? `${(fastest[0].responseTime / 1000).toFixed(2)}s`
                : "--"
            }
          />
        </div>

        {/* PARTICIPATION */}

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

        {/* ANSWERS */}

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

        {/* FASTEST FINGER */}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Fastest Finger First</h2>

            <p className="text-gray-500 text-sm">Fastest correct responses</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3">Rank</th>

                  <th>Name</th>

                  <th>PS No.</th>

                  <th>Vertical</th>

                  <th>Question</th>

                  <th>Response Time</th>
                </tr>
              </thead>

              <tbody>
                {fastest.map((item, index) => (
                  <tr key={item._id} className="border-b">
                    <td className="py-3 font-bold">#{index + 1}</td>

                    {/* NAME */}
                    <td className="font-medium">
                      {item.participant?.name || "—"}
                    </td>

                    {/* PS NO */}
                    <td>{item.participant?.psNo || "—"}</td>

                    {/* VERTICAL */}
                    <td>{item.participant?.vertical || "—"}</td>

                    {/* QUESTION */}
                    <td>Q{item.question?.order}</td>

                    {/* RESPONSE TIME */}
                    <td className="font-semibold text-green-600">
                      {(item.responseTime / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <p className="text-gray-500 text-sm">{title}</p>

      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

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
