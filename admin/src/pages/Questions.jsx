import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

function Questions() {
  const [questions, setQuestions] = useState([]);

  const [form, setForm] = useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    order: 1,
  });

  const loadQuestions = async () => {
    const response = await fetch(`${API}/api/questions`);

    const data = await response.json();

    setQuestions(data);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createQuestion = async (e) => {
    e.preventDefault();

    const options = [form.optionA, form.optionB, form.optionC, form.optionD];

    try {
      const response = await fetch(`${API}/api/questions`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          questionText: form.questionText,

          options,

          correctAnswer: form.correctAnswer,

          order: Number(form.order),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);

        return;
      }

      alert("Question added!");

      setForm({
        questionText: "",

        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",

        correctAnswer: "",

        order: questions.length + 2,
      });

      loadQuestions();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteQuestion = async (id) => {
    if (!confirm("Delete this question?")) {
      return;
    }

    await fetch(`${API}/api/questions/${id}`, {
      method: "DELETE",
    });

    loadQuestions();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Question Management</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* FORM */}

        <form
          onSubmit={createQuestion}
          className="bg-white rounded-2xl p-6 shadow-sm mb-8"
        >
          <h2 className="text-xl font-bold mb-6">Add Question</h2>

          <textarea
            name="questionText"
            value={form.questionText}
            onChange={handleChange}
            placeholder="Enter question"
            className="w-full border rounded-xl p-3 mb-4"
            rows="3"
            required
          />

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="optionA"
              value={form.optionA}
              onChange={handleChange}
              placeholder="Option A"
              className="border rounded-xl p-3"
              required
            />

            <input
              name="optionB"
              value={form.optionB}
              onChange={handleChange}
              placeholder="Option B"
              className="border rounded-xl p-3"
              required
            />

            <input
              name="optionC"
              value={form.optionC}
              onChange={handleChange}
              placeholder="Option C"
              className="border rounded-xl p-3"
              required
            />

            <input
              name="optionD"
              value={form.optionD}
              onChange={handleChange}
              placeholder="Option D"
              className="border rounded-xl p-3"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <select
              name="correctAnswer"
              value={form.correctAnswer}
              onChange={handleChange}
              className="border rounded-xl p-3 bg-white"
              required
            >
              <option value="">Select correct answer</option>

              <option value={form.optionA}>Option A</option>

              <option value={form.optionB}>Option B</option>

              <option value={form.optionC}>Option C</option>

              <option value={form.optionD}>Option D</option>
            </select>

            <input
              name="order"
              type="number"
              min="1"
              value={form.order}
              onChange={handleChange}
              placeholder="Question number"
              className="border rounded-xl p-3"
              required
            />
          </div>

          <button className="mt-5 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl">
            Add Question
          </button>
        </form>

        {/* QUESTIONS */}

        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question._id}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex justify-between gap-5">
                <div>
                  <p className="font-bold">
                    Q{question.order}. {question.questionText}
                  </p>

                  <div className="grid md:grid-cols-2 gap-2 mt-4">
                    {question.options.map((option, index) => (
                      <div
                        key={option}
                        className={`p-3 rounded-lg ${
                          option === question.correctAnswer
                            ? "bg-green-100 text-green-700 font-semibold"
                            : "bg-gray-100"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => deleteQuestion(question._id)}
                  className="text-red-500 font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Questions;
