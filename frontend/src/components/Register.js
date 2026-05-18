import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
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
  Spinner,
  Alert,
} from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import regFormValidationSchema from "../validation/regFormValidationSchema";
import logo from "../image/logo2.png";
import auth from "../image/auth.png";
import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaBirthdayCake,
  FaLock,
  FaArrowRight,
} from "react-icons/fa";
import "./authElegant.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [fieldOfInterest, setFieldOfInterest] = useState("");
  const [role, setRole] = useState("Innovator");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [localError, setLocalError] = useState("");

  const { status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    const values = {
      name,
      email,
      phone,
      password,
      confirmPassword,
    };

    regFormValidationSchema
      .validate(values, { abortEarly: false })
      .then(() => {
        setValidationErrors({});
        const roleSlug = role.toLowerCase();

        dispatch(
          registerUser({
            name,
            email,
            password,
            role: roleSlug,
            phone,
            birthday,
            gender,
            fieldOfInterest,
          })
        )
          .unwrap()
          .then(() => navigate("/login"))
          .catch(() => {});
      })
      .catch((validationError) => {
        const fieldErrors = {};
        validationError.inner.forEach((err) => {
          if (err.path && !fieldErrors[err.path]) {
            fieldErrors[err.path] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
      });
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(90deg, #edf5ff 0%, #f7f2ec 100%)",
  };

  const outerCardStyle = {
    border: "none",
    borderRadius: "28px",
    overflow: "hidden",
    boxShadow: "0 18px 50px rgba(25, 52, 88, 0.10)",
    background: "var(--surface-bg)",
  };

  const leftSideStyle = {
    background: "linear-gradient(180deg, #edf5ff 0%, #fbf3ea 100%)",
    padding: "34px 26px",
    minHeight: "100%",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  const rightSideStyle = {
    background: "var(--surface-bg)",
    padding: "38px 38px 34px",
  };

  const labelStyle = {
    fontWeight: 700,
    color: "#314964",
    fontSize: "0.95rem",
    marginBottom: "8px",
    display: "block",
  };

  const inputWrapStyle = {
    display: "flex",
    alignItems: "center",
    background: "var(--surface-bg)",
    border: "1px solid #cfe0f2",
    borderRadius: "15px",
    minHeight: "48px",
    padding: "0 14px",
  };

  const iconStyle = {
    color: "#ff7a00",
    fontSize: "0.95rem",
    marginRight: "10px",
    minWidth: "16px",
  };

  const inputStyle = {
    border: "none",
    boxShadow: "none",
    background: "transparent",
    paddingLeft: 0,
    color: "#334e68",
  };

  const roleCard = (active) => ({
    flex: 1,
    borderRadius: "14px",
    padding: "12px 14px",
    border: active ? "2px solid #2f80ed" : "1px solid #d5e3f1",
    background: active ? "#eef6ff" : "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: active ? "#2f80ed" : "#3f556f",
    transition: "0.2s ease",
  });

  const submitBtnStyle = {
    border: "none",
    borderRadius: "16px",
    minHeight: "50px",
    fontWeight: 800,
    fontSize: "1rem",
    background: "linear-gradient(90deg, #2f80ed 0%, #ff7a00 100%)",
    boxShadow: "0 14px 30px rgba(47, 128, 237, 0.18)",
  };

  return (
    <div style={pageStyle} className="d-flex align-items-center">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg="9" xl="8">
            <Card style={outerCardStyle}>
              <Row className="g-0">
                <Col lg="5">
                  <div style={leftSideStyle}>
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

                    
                  </div>
                </Col>

                <Col lg="7">
                  <CardBody style={rightSideStyle}>
                    <h2
                      style={{
                        color: "#16365c",
                        fontWeight: 800,
                        fontSize: "2.15rem",
                        marginBottom: "4px",
                      }}
                    >
                      Register
                    </h2>

                    <p
                      style={{
                        color: "#6c829d",
                        marginBottom: "22px",
                      }}
                    >
                      Create your new account details.
                    </p>

                    {error && (
                      <Alert color="danger" className="py-2 rounded-4">
                        {error}
                      </Alert>
                    )}

                    {localError && (
                      <Alert color="danger" className="py-2 rounded-4">
                        {localError}
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Full name</label>
                        <div style={inputWrapStyle}>
                          <FaUser style={iconStyle} />
                          <Input
                            style={inputStyle}
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        {validationErrors.name && (
                          <div className="text-danger small mt-2">
                            {validationErrors.name}
                          </div>
                        )}
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Email</label>
                        <div style={inputWrapStyle}>
                          <FaEnvelope style={iconStyle} />
                          <Input
                            type="email"
                            style={inputStyle}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        {validationErrors.email && (
                          <div className="text-danger small mt-2">
                            {validationErrors.email}
                          </div>
                        )}
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Phone</label>
                        <div style={inputWrapStyle}>
                          <FaPhoneAlt style={iconStyle} />
                          <Input
                            style={inputStyle}
                            placeholder="Phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                        {validationErrors.phone && (
                          <div className="text-danger small mt-2">
                            {validationErrors.phone}
                          </div>
                        )}
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Birthday</label>
                        <div style={inputWrapStyle}>
                          <FaBirthdayCake style={iconStyle} />
                          <Input
                            type="date"
                            style={inputStyle}
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                          />
                        </div>
                      </FormGroup>


                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Gender for admin report</label>
                        <div style={inputWrapStyle}>
                          <FaUser style={iconStyle} />
                          <Input
                            type="select"
                            style={inputStyle}
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                          >
                            <option value="">Select gender</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                          </Input>
                        </div>
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Field / Specialization for admin report</label>
                        <div style={inputWrapStyle}>
                          <FaUser style={iconStyle} />
                          <Input
                            style={inputStyle}
                            placeholder="Example: Software, Business, Engineering"
                            value={fieldOfInterest}
                            onChange={(e) => setFieldOfInterest(e.target.value)}
                          />
                        </div>
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Role</label>
                        <div className="d-flex gap-3">
                          <div
                            style={roleCard(role === "Innovator")}
                            onClick={() => setRole("Innovator")}
                          >
                            <Input
                              type="radio"
                              checked={role === "Innovator"}
                              readOnly
                              className="me-2 mt-0"
                            />
                            Innovator
                          </div>

                          <div
                            style={roleCard(role === "Funder")}
                            onClick={() => setRole("Funder")}
                          >
                            <Input
                              type="radio"
                              checked={role === "Funder"}
                              readOnly
                              className="me-2 mt-0"
                            />
                            Funder
                          </div>
                        </div>
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Password</label>
                        <div style={inputWrapStyle}>
                          <FaLock style={iconStyle} />
                          <Input
                            type="password"
                            style={inputStyle}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        {validationErrors.password && (
                          <div className="text-danger small mt-2">
                            {validationErrors.password}
                          </div>
                        )}
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <label style={labelStyle}>Confirm Password</label>
                        <div style={inputWrapStyle}>
                          <FaLock style={iconStyle} />
                          <Input
                            type="password"
                            style={inputStyle}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                        {validationErrors.confirmPassword && (
                          <div className="text-danger small mt-2">
                            {validationErrors.confirmPassword}
                          </div>
                        )}
                      </FormGroup>

                      <div
                        className="d-flex justify-content-between align-items-center mb-3"
                        style={{ fontSize: "0.95rem" }}
                      >
                        <span style={{ color: "#6c829d" }}>
                          Already have an account?{" "}
                          <Link
                            to="/login"
                            className="text-decoration-none"
                            style={{ color: "#ff7a00", fontWeight: 700 }}
                          >
                            Login
                          </Link>
                        </span>
                      </div>

                      <div className="d-grid">
                        <Button
                          type="submit"
                          style={submitBtnStyle}
                          disabled={status === "loading"}
                        >
                          {status === "loading" ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              Register <FaArrowRight className="ms-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </CardBody>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Register;