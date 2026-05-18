import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Input,
  Alert,
  Spinner,
} from "reactstrap";
import axios from "axios";
import { FaUserShield, FaPlus, FaTimes } from "react-icons/fa";

const API_URL = "http://localhost:5000";

/**
 * CAT A: Add New Admin (M3F2)
 * POST /admin/create-admin (admin only)
 */
export default function AddAdminModal({ isOpen, toggle, onCreated }) {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setErr("");
    setMsg("");
  };

  const handleToggle = () => {
    reset();
    toggle();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!token) {
      setErr("Missing admin token. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/create-admin`,
        { name: name.trim(), email: email.trim(), password },
        { headers: authHeaders }
      );
      setMsg(res.data?.msg || "Admin created");
      onCreated?.(res.data?.admin);
      setName("");
      setEmail("");
      setPassword("");
    } catch (e2) {
      setErr(e2.response?.data?.msg || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={handleToggle} centered>
      <ModalHeader toggle={handleToggle}>
        <span className="d-inline-flex align-items-center gap-2">
          <FaUserShield /> Add New Admin
        </span>
      </ModalHeader>
      <Form onSubmit={handleCreate}>
        <ModalBody>
          {err && (
            <Alert color="danger" className="py-2">
              {err}
            </Alert>
          )}
          {msg && (
            <Alert color="success" className="py-2">
              {msg}
            </Alert>
          )}

          <FormGroup className="mb-3">
            <label className="small text-muted">Admin Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </FormGroup>

          <FormGroup className="mb-3">
            <label className="small text-muted">Admin Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormGroup>

          <FormGroup className="mb-0">
            <label className="small text-muted">Temporary Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div className="small text-muted mt-1">
              The new admin can change it later using Reset Password.
            </div>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={handleToggle} disabled={loading}>
            <span className="d-inline-flex align-items-center gap-2">
              <FaTimes /> Close
            </span>
          </Button>
          <Button
            type="submit"
            style={{ backgroundColor: "#ff9f43", border: "none" }}
            disabled={loading}
          >
            <span className="d-inline-flex align-items-center gap-2">
              {loading ? <Spinner size="sm" /> : <FaPlus />}
              {loading ? "Creating..." : "Create Admin"}
            </span>
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
}
