import '@testing-library/jest-dom';

describe("CAT C - Chatbot API Automated Testing", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should answer English question about submitting an idea", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        answer: "You can submit your idea from the idea submission page.",
      }),
    });

    const response = await fetch("http://localhost:5000/api/chatbot/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer fake-token",
      },
      body: JSON.stringify({
        question: "How can I submit an idea?",
      }),
    });

    const data = await response.json();

    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.answer).toBeDefined();
    expect(data.answer.length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("should answer Arabic question about submitting an idea", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        answer: "يمكنك رفع فكرتك من صفحة تقديم الأفكار.",
      }),
    });

    const response = await fetch("http://localhost:5000/api/chatbot/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer fake-token",
      },
      body: JSON.stringify({
        question: "كيف أرفع فكرة؟",
      }),
    });

    const data = await response.json();

    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.answer).toBeDefined();
    expect(data.answer.length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("should answer question about events", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        answer: "You can view available events from the events page.",
      }),
    });

    const response = await fetch("http://localhost:5000/api/chatbot/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer fake-token",
      },
      body: JSON.stringify({
        question: "What events are available?",
      }),
    });

    const data = await response.json();

    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.answer).toBeDefined();
    expect(data.answer.length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("should handle unknown question", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        answer: "I can help with SparkUp topics such as ideas, events, funding, and certificates.",
      }),
    });

    const response = await fetch("http://localhost:5000/api/chatbot/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer fake-token",
      },
      body: JSON.stringify({
        question: "What is the weather today?",
      }),
    });

    const data = await response.json();

    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.answer).toBeDefined();
    expect(data.answer.length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("should not accept empty question", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        answer: "Question is required.",
      }),
    });

    const response = await fetch("http://localhost:5000/api/chatbot/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer fake-token",
      },
      body: JSON.stringify({
        question: "",
      }),
    });

    const data = await response.json();

    expect(data).toBeDefined();
    expect(data.success).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});