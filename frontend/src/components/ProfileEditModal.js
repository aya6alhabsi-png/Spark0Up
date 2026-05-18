import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormGroup,
  Label,
  Input,
  Alert,
  Row,
  Col,
  Spinner,
} from "reactstrap";
import { useDispatch } from "react-redux";
import { setUser } from "../store/authSlice";
import { FaUpload, FaUser } from "react-icons/fa";

const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const toAbsoluteImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // backend returns something like: /uploads/xxx.jpg
  return `${API}${url}`;
};

export default function ProfileEditModal({ isOpen, toggle, user }) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    birthday: "",
    gender: "",
    fieldOfInterest: "",
    bio: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  // avoid memory leak for local previews
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        try { URL.revokeObjectURL(preview); } catch {}
      }
    };
  }, [preview]);


  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD USER ---------------- */

  useEffect(() => {
    if (user && isOpen) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        birthday: user.birthday
          ? String(user.birthday).slice(0, 10)
          : "",
        gender: user.gender || "",
        fieldOfInterest: user.fieldOfInterest || "",
        bio: user.bio || "",
      });

      setPreview(toAbsoluteImageUrl(user.imageUrl || ""));
      setImageFile(null);
    }
  }, [user, isOpen]);

  /* ---------------- INPUT CHANGE ---------------- */

  const setField = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  /* ---------------- IMAGE SELECT ---------------- */

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // allow only images
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setError("");

    setImageFile(file);
    setPreview(URL.createObjectURL(file)); // preview
  };

  /* ---------------- SAVE ---------------- */

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const formData = new FormData();

      Object.keys(form).forEach((key) =>
        formData.append(key, form[key])
      );

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.msg || "Update failed");
        return;
      }

      dispatch(setUser(data.user));
      toggle();
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
      <ModalHeader toggle={toggle}>Edit Profile</ModalHeader>

      <ModalBody>
        {error && <Alert color="danger">{error}</Alert>}

        {/* IMAGE UPLOAD */}
        <div className="text-center mb-4">
          <div
            style={{
              width: 120,
              height: 120,
              margin: "auto",
              borderRadius: "50%",
              overflow: "hidden",
              background: "#eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <FaUser size={40} />
            )}
          </div>

          <Label className="mt-3 btn btn-outline-primary">
            <FaUpload className="me-2" />
            Choose Image
            <Input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Label>
        </div>

        <Row>
          <Col md="6">
            <FormGroup>
              <Label>Name</Label>
              <Input value={form.name} onChange={setField("name")} />
            </FormGroup>
          </Col>

          <Col md="6">
            <FormGroup>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={setField("phone")} />
            </FormGroup>
          </Col>

          <Col md="6">
            <FormGroup>
              <Label>Birthday</Label>
              <Input
                type="date"
                value={form.birthday}
                onChange={setField("birthday")}
              />
            </FormGroup>
          </Col>


          {user?.role !== "admin" && (
            <>
              <Col md="6">
                <FormGroup>
                  <Label>Gender for Reports</Label>
                  <Input type="select" value={form.gender} onChange={setField("gender")}>
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </Input>
                </FormGroup>
              </Col>

              <Col md="6">
                <FormGroup>
                  <Label>Field / Specialization</Label>
                  <Input
                    value={form.fieldOfInterest}
                    onChange={setField("fieldOfInterest")}
                    placeholder="Example: Software Engineering"
                  />
                </FormGroup>
              </Col>
            </>
          )}

          <Col md="12">
            <FormGroup>
              <Label>Bio</Label>
              <Input
                type="textarea"
                rows="3"
                value={form.bio}
                onChange={setField("bio")}
              />
            </FormGroup>
          </Col>
        </Row>
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>

        <Button color="primary" onClick={handleSave} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Save Changes"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}