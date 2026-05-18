import { useState } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Input,
  Button,
  Alert,
} from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowRight, FaEnvelope, FaKey, FaLock } from "react-icons/fa";
import logo from "../image/logo2.png";
import auth from "../image/auth.png";
import "./authElegant.css";

const API_URL = "http://localhost:5000";

function Forgetpass() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setInfo(
        res.data?.msg || "If this email exists, a confirmation code has been sent."
      );
      setStep(2);
    } catch (err) {
      console.error("Forgot-password error:", err.response?.data || err.message);
      setError(
        err.response?.data?.msg ||
          "Failed to send confirmation code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (!code.trim()) {
      setError("Please enter the confirmation code.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/verify-code`, { email, code });

      if (!res.data.success) {
        setError(res.data.msg || "Invalid or expired code.");
      } else {
        setInfo("Code verified successfully.");
        setStep(3);
      }
    } catch (err) {
      console.error("Verify-code error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        code,
        newPassword,
      });

      if (!res.data.success) {
        setError(res.data.msg || "Failed to reset password.");
      } else {
        setInfo("Password changed successfully! Redirecting...");
        setTimeout(() => {
          if (res.data.role === "admin") {
            navigate("/adminlogin");
          } else {
            navigate("/login");
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Reset-password error:", err.response?.data || err.message);
      setError(
        err.response?.data?.msg ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <Form onSubmit={handleEmailSubmit}>
          <FormGroup className="mb-4">
            <label className="spark-auth-input-label">Email</label>
            <div className="spark-auth-input-group">
              <FaEnvelope />
              <Input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </FormGroup>

          <Button type="submit" className="spark-auth-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Confirmation Code"}
            {!loading && <FaArrowRight className="ms-2" />}
          </Button>
        </Form>
      );
    }

    if (step === 2) {
      return (
        <Form onSubmit={handleCodeSubmit}>
          <p className="spark-auth-muted mb-3">
            We sent a confirmation code to <strong>{email}</strong>
          </p>

          <FormGroup className="mb-4">
            <label className="spark-auth-input-label">Confirmation Code</label>
            <div className="spark-auth-input-group">
              <FaKey />
              <Input
                type="text"
                placeholder="Enter confirmation code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          </FormGroup>

          <Button type="submit" className="spark-auth-btn" disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
            {!loading && <FaArrowRight className="ms-2" />}
          </Button>
        </Form>
      );
    }

    return (
      <Form onSubmit={handlePasswordSubmit}>
        <p className="spark-auth-muted mb-3">
          Set a new password for <strong>{email}</strong>
        </p>

        <FormGroup className="mb-3">
          <label className="spark-auth-input-label">New Password</label>
          <div className="spark-auth-input-group">
            <FaLock />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
        </FormGroup>

        <FormGroup className="mb-4">
          <label className="spark-auth-input-label">Confirm Password</label>
          <div className="spark-auth-input-group">
            <FaLock />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>
        </FormGroup>

        <Button type="submit" className="spark-auth-btn" disabled={loading}>
          {loading ? "Saving..." : "Change Password"}
          {!loading && <FaArrowRight className="ms-2" />}
        </Button>
      </Form>
    );
  };

  const stepTitle =
    step === 1
      ? "Forget Password"
      : step === 2
      ? "Enter Confirmation Code"
      : "Set New Password";

  const stepText =
    step === 1
      ? "Enter your email to receive a confirmation code."
      : step === 2
      ? "Check your email and enter the code."
      : "Create your new password and confirm it.";

  return (
    <div className="spark-auth-page">
      <div className="spark-auth-bg-shape spark-auth-shape-one" />
      <div className="spark-auth-bg-shape spark-auth-shape-two" />

      <Container className="py-5">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg="10" xl="9">
            <Card className="spark-auth-card-clean border-0">
              <CardBody className="p-0">
                <Row className="g-0">
                  <Col lg="5" className="spark-auth-side">
                    <div className="spark-auth-left-logo">
                      <img src={logo} alt="logo" className="spark-auth-logo" />
                    </div>

                    <div className="spark-auth-side-copy">
                      <img
                        src={auth}
                        alt="auth"
                        className="spark-auth-side-image"
                      />
                    </div>

                    
                  </Col>

                  <Col lg="7" className="spark-auth-form-wrap">
                    <div className="spark-auth-form-box">
                      <h3>{stepTitle}</h3>
                      <p className="spark-auth-muted">{stepText}</p>

                      {error && (
                        <Alert color="danger" className="rounded-4">
                          {error}
                        </Alert>
                      )}

                      {info && (
                        <Alert color="info" className="rounded-4">
                          {info}
                        </Alert>
                      )}

                      {renderStep()}

                      <div className="spark-auth-links mt-4">
                        <span>
                          Back to <Link to="/login">Login</Link>
                        </span>

                        {step > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setStep(step - 1);
                              setError("");
                              setInfo("");
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ff7a00",
                              fontWeight: 700,
                              padding: 0,
                            }}
                          >
                            Previous Step
                          </button>
                        )}
                      </div>

                      <Button
                        type="button"
                        color="link"
                        className="w-100 mt-3 text-decoration-none"
                        onClick={() => navigate("/login")}
                        style={{ color: "#ff7a00", fontWeight: 700 }}
                      >
                        Back to Login
                      </Button>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Forgetpass;