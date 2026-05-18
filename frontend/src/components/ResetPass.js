import React, { useState, useEffect } from "react";
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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
} from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaLock } from "react-icons/fa";
import logo from "../image/logo2.png";
import { logout } from "../store/authSlice";

const API_URL = "http://localhost:5000";

const validateNewPassword = (pwd) => {
  if (pwd.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
  if (!/\d/.test(pwd)) return "Password must contain at least one number";
  if (!/[@$!%*?&#^()_\-+=]/.test(pwd)) {
    return "Password must contain at least one special character (@$!%*?&#^()_-+=)";
  }
  return "";
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const validatePasswordChange = (currentPassword, newPassword, confirmNewPassword) => {
  if (!currentPassword || !newPassword || !confirmNewPassword) return "All fields are required";

  const pwdError = validateNewPassword(newPassword);
  if (pwdError) return pwdError;

  if (newPassword !== confirmNewPassword) return "New passwords do not match";

  if (currentPassword === newPassword) {
    return "New password cannot be the same as the current password";
  }

  return "";
};

const submitPasswordChange = async ({ currentPassword, newPassword }) => {
  return axios.post(
    `${API_URL}/auth/change-password`,
    { currentPassword, newPassword },
    { headers: getAuthHeaders() }
  );
};

function PasswordFields({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
}) {
  return (
    <>
      <FormGroup className="mb-3">
        <Input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </FormGroup>

      <FormGroup className="mb-3">
        <Input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </FormGroup>

      <FormGroup className="mb-4">
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />
      </FormGroup>
    </>
  );
}

function ResetPass() {
  const { user } = useSelector((state) => state.auth);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const validationError = validatePasswordChange(
      currentPassword,
      newPassword,
      confirmNewPassword
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await submitPasswordChange({ currentPassword, newPassword });

      if (!res.data.success) {
        setError(res.data.msg || "Failed to change password");
      } else {
        setInfo("Password updated successfully. You will be logged out...");
        setTimeout(() => {
          dispatch(logout());
          navigate("/", { replace: true });
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Server error changing password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--app-bg)" }} className="d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md="6" lg="4">
            <Card className="shadow-lg border-0">
              <CardBody className="p-4 p-md-5">
                <div className="d-flex align-items-center mb-4" style={{ gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(242,248,255,0.98))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow:
                        "0 14px 30px rgba(30, 136, 229, 0.14), inset 0 1px 0 rgba(255,255,255,0.92)",
                      border: "1px solid rgba(30,136,229,0.10)",
                    }}
                  >
                    <img src={logo} alt="SparkUp logo" style={{ width: "72%", height: "72%", objectFit: "contain" }} />
                  </div>
                  <span style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text)" }}>
                    Spark<span style={{ color: "#ff9f43" }}>Up</span>
                  </span>
                </div>

                <h3 className="fw-bold mb-2" style={{ color: "var(--text)" }}>Reset Password</h3>
                <p className="text-muted small mb-3">Logged in as <strong>{user.email}</strong></p>

                {error ? <Alert color="danger" className="py-2">{error}</Alert> : null}
                {info ? <Alert color="success" className="py-2">{info}</Alert> : null}

                <Form onSubmit={handleSubmit}>
                  <PasswordFields
                    currentPassword={currentPassword}
                    setCurrentPassword={setCurrentPassword}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmNewPassword={confirmNewPassword}
                    setConfirmNewPassword={setConfirmNewPassword}
                  />

                  <div className="d-grid">
                    <Button type="submit" style={{ backgroundColor: "#1a73e8", border: "none" }} disabled={loading}>
                      {loading ? "Saving..." : "Change Password"}
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export function ResetPasswordModal({ isOpen, toggle }) {
  const { user } = useSelector((state) => state.auth);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const validationError = validatePasswordChange(
      currentPassword,
      newPassword,
      confirmNewPassword
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await submitPasswordChange({ currentPassword, newPassword });

      if (!res.data.success) {
        setError(res.data.msg || "Failed to change password.");
      } else {
        setInfo("Password updated successfully. You will be logged out...");
        setTimeout(() => {
          dispatch(logout());
          toggle();
          navigate("/", { replace: true });
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Server error changing password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} backdrop="static" keyboard centered>
      <ModalHeader toggle={toggle}>
        <FaLock className="me-2" />
        Reset Password
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <p className="small text-muted mb-3">Logged in as <strong>{user.email}</strong></p>

          {error ? <Alert color="danger" className="py-2">{error}</Alert> : null}
          {info ? <Alert color="success" className="py-2">{info}</Alert> : null}

          <FormGroup className="mb-3">
            <Label className="small fw-semibold">Current Password</Label>
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormGroup>

          <FormGroup className="mb-3">
            <Label className="small fw-semibold">New Password</Label>
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormGroup>

          <FormGroup className="mb-0">
            <Label className="small fw-semibold">Confirm New Password</Label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggle} disabled={loading}>Cancel</Button>
          <Button type="submit" style={{ backgroundColor: "#1a73e8", border: "none" }} disabled={loading}>
            {loading ? "Saving..." : "Change Password"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
}

export default ResetPass;
