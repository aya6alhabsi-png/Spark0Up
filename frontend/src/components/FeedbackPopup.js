import React, { useState } from "react";
import { Modal, ModalBody, Button, Input, Alert, Spinner } from "reactstrap";
import { FaStar, FaRegStar } from "react-icons/fa";
import { api, authHeaders } from "./api";

function StarPicker({ value, onChange }) {
  return (
    <div className="d-flex justify-content-center gap-2 my-4">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const Icon = active ? FaStar : FaRegStar;

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              color: active ? "#ffcf4d" : "#d7dce6",
              fontSize: 36,
              filter: active ? "drop-shadow(0 6px 10px rgba(255, 207, 77, 0.28))" : "none",
            }}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

export default function FeedbackPopup({ isOpen, toggle }) {
  const [rating, setRating] = useState(4);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErr("");
    setOk("");

    if (!message.trim()) {
      setErr("Please write your feedback.");
      return;
    }

    try {
      setLoading(true);
      await api.post(
        "/feedback",
        { rating: Number(rating), message: message.trim() },
        { headers: authHeaders() }
      );

      setOk("Feedback submitted successfully. Thank you!");
      setMessage("");
      setRating(4);

      setTimeout(() => {
        setOk("");
        toggle();
      }, 900);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalBody
        style={{
          background: "linear-gradient(135deg, #dfe9ff 0%, #e7ecff 55%, #f7e6ef 100%)",
          borderRadius: 24,
          padding: "30px 26px",
        }}
      >
        <div
          style={{
            maxWidth: 460,
            margin: "0 auto",
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.55)",
            borderRadius: 24,
            padding: "28px 24px",
            boxShadow: "0 18px 36px rgba(19, 45, 89, 0.12)",
          }}
        >
          <h2
            className="text-center"
            style={{
              color: "#102846",
              fontWeight: 900,
              marginBottom: 14,
            }}
          >
            Rate your experience
          </h2>

          <p
            className="text-center"
            style={{
              color: "#6d7f99",
              lineHeight: 1.8,
              marginBottom: 0,
            }}
          >
            We highly value your feedback! Kindly take a moment to rate your experience and provide your valuable feedback.
          </p>

          <StarPicker value={rating} onChange={setRating} />

          {err && <Alert color="danger">{err}</Alert>}
          {ok && <Alert color="success">{ok}</Alert>}

          <Input
            type="textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your experience!"
            style={{
              minHeight: 120,
              borderRadius: 18,
              borderColor: "#dbe5f4",
              background: "rgba(255,255,255,0.82)",
              boxShadow: "0 10px 22px rgba(16, 40, 70, 0.06)",
            }}
          />

          <div className="text-center mt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                borderRadius: 999,
                padding: "12px 34px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #ffd65a, #f1bd17)",
                border: "none",
                color: "#6b5200",
                boxShadow: "0 12px 24px rgba(241, 189, 23, 0.25)",
              }}
            >
              {loading ? <Spinner size="sm" /> : "Send"}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
