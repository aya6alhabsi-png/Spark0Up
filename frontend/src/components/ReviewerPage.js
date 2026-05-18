import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, Button, Badge } from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBell,
  FaEdit,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaLanguage,
  FaKey,
  FaTasks,
  FaCommentDots,
  FaCalendarAlt,
  FaCertificate,
  FaBolt,
  FaComments,
} from "react-icons/fa";

import { logout } from "../store/authSlice";
import ProfileEditModal from "./ProfileEditModal";
import FeedbackPopup from "./FeedbackPopup";
import { AppContext } from "../context/AppContext";
import GuidedTour from "./GuidedTour";

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

function getAuthToken(user) {
  const directToken =
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    user?.token;

  if (directToken) return directToken;

  try {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    return savedUser?.token || savedUser?.accessToken || "";
  } catch (error) {
    return "";
  }
}

function getUnreadCount(data) {
  return Number(
    data?.count ??
      data?.unreadCount ??
      data?.totalUnread ??
      data?.unread ??
      0
  );
}


function getProfileImageSrc(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}

function SidebarRow({ icon, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="d-flex align-items-center mb-3 w-100"
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        color: "#ffffff",
        fontSize: "0.95rem",
        cursor: "pointer",
        textAlign: "left",
        fontWeight: 700,
      }}
    >
      <span
        className="me-2"
        style={{
          width: 18,
          display: "inline-flex",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>

      <span>{text}</span>
    </button>
  );
}

function NotificationIcon({ count = 0 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <FaBell />

      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -9,
            right: -14,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 999,
            background: "#ff3b1f",
            color: "#fff",
            fontSize: 11,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
            lineHeight: 1,
            zIndex: 5,
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

function ActionCard({ icon, title, text, btnText, onClick, bg = "#123b73" }) {
  return (
    <Card
      className="shadow border-0 h-100"
      style={{
        backgroundColor: bg,
        color: "#fff",
        borderRadius: "18px",
        cursor: "pointer",
        minHeight: 218,
      }}
      onClick={onClick}
    >
      <CardBody className="d-flex flex-column justify-content-between p-4">
        <div>
          <div className="mb-3" style={{ color: "#fff" }}>
            {icon}
          </div>

          <h5 className="fw-bold mb-2" style={{ color: "#fff" }}>
            {title}
          </h5>

          <p className="small mb-0" style={{ color: "#fff", lineHeight: 1.6 }}>
            {text}
          </p>
        </div>

        <div className="mt-3 text-end">
          <Button
            size="sm"
            color="light"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {btnText}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function ReviewerPage() {
  const { user } = useSelector((state) => state.auth);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageOk, setImageOk] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { theme, lang, toggleTheme, toggleLang, t } = useContext(AppContext);

  const profileImg = useMemo(
    () => getProfileImageSrc(user?.imageUrl || ""),
    [user?.imageUrl]
  );

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const token = getAuthToken(user);

        if (!token) {
          setUnreadNotifications(0);
          return;
        }

        const requestOptions = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const urls = [
          `${API_URL}/api/notifications/unread-count`,
          `${API_URL}/notifications/unread-count`,
        ];

        let data = null;

        for (const url of urls) {
          const res = await fetch(url, requestOptions);
          if (res.ok) {
            data = await res.json();
            break;
          }
        }

        if (!data) {
          setUnreadNotifications(0);
          return;
        }

        setUnreadNotifications(getUnreadCount(data));
      } catch (error) {
        console.log("Failed to load unread notification count", error);
      }
    };

    if (user) {
      fetchUnreadNotifications();
      const interval = setInterval(fetchUnreadNotifications, 8000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [user]);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const toggleProfile = () => setProfileOpen((o) => !o);
  const toggleFeedback = () => setFeedbackOpen((o) => !o);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const phone = user?.phone || "-";
  const isActive = user?.status === "active";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--app-bg)",
      }}
      className="d-flex"
    >
      <GuidedTour type="reviewer" />

      <Container fluid className="py-4">
        <Row className="h-100 flex-row-reverse">
          <Col md="3" lg="2" style={{ maxWidth: 280 }}>
            <Card
              className="h-100 shadow border-0"
              style={{
                backgroundColor: "#f59c32",
                color: "#fff",
                borderRadius: 24,
              }}
            >
              <CardBody className="p-3 p-md-4 d-flex flex-column">
                <div className="d-flex flex-column align-items-center mb-4">
                  <div
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "rgba(255,255,255,.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid rgba(255,255,255,.35)",
                    }}
                  >
                    {profileImg && imageOk ? (
                      <img
                        src={profileImg}
                        alt="Profile"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={() => setImageOk(false)}
                      />
                    ) : (
                      <FaUser size={36} />
                    )}
                  </div>

                  <div className="fw-semibold mt-3">
                    {t("hi")} {user?.name}
                  </div>

                  <Badge
                    pill
                    color="light"
                    className="mt-1 text-uppercase"
                    style={{
                      fontSize: "0.65rem",
                      letterSpacing: "0.06em",
                      color: "#f57c00",
                    }}
                  >
                    {lang === "ar" ? "مراجع" : "REVIEWER"}
                  </Badge>

                  <div className="mt-2 d-flex align-items-center gap-2">
                    <span className="fw-semibold">
                      {lang === "ar" ? "الحالة:" : "Status:"}
                    </span>

                    <Badge color={isActive ? "success" : "warning"}>
                      {user.status || "pending"}
                    </Badge>
                  </div>
                </div>

                <div className="small mb-3">
                  <div className="d-flex align-items-center mb-3">
                    <FaEnvelope className="me-2" />
                    <span className="text-truncate">{user?.email}</span>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <FaPhone className="me-2" />
                    <span>{phone}</span>
                  </div>

                  <SidebarRow icon={<FaLanguage />} text={t("language")} onClick={toggleLang} />

                  <SidebarRow
                    icon={theme === "light" ? <FaMoon /> : <FaSun />}
                    text={t("theme")}
                    onClick={toggleTheme}
                  />

                  <SidebarRow
                    icon={<NotificationIcon count={unreadNotifications} />}
                    text={lang === "ar" ? "الإشعارات" : "Notifications"}
                    onClick={() => navigate("/notifications")}
                  />

                  <SidebarRow
                    icon={<FaEdit />}
                    text={lang === "ar" ? "تعديل الملف" : "Edit Profile"}
                    onClick={toggleProfile}
                  />

                  <SidebarRow
                    icon={<FaKey />}
                    text={lang === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                    onClick={() => navigate("/resetpass")}
                  />

                 <Button
                                   color="light"
                                   size="sm"
                                   className="w-100 mb-3"
                                   style={{
                                     color: "#f57c00",
                                     fontWeight: 600,
                                     borderRadius: "999px",
                                   }}
                                   onClick={handleLogout}
                                 >
                                   {t("logout")}
                                 </Button>
                </div>

                <div className="flex-grow-1" />
              </CardBody>
            </Card>
          </Col>

          <Col md="9" lg="10" className="mt-4 mt-md-0">
            <Row className="gy-4">
              <Col md="6" xl="4">
                <ActionCard
                  icon={<FaTasks size={40} />}
                  title={lang === "ar" ? "الأفكار المعيّنة" : "Assigned Ideas"}
                  text={lang === "ar" ? "ادخل مباشرة إلى مساحة المراجعة." : "Jump straight into your review queue."}
                  btnText={lang === "ar" ? "فتح" : "Open"}
                  bg="#133a63"
                  onClick={() => navigate("/ideas?view=progress")}
                />
              </Col>

              <Col md="6" xl="4">
                <ActionCard
                  icon={<FaCalendarAlt size={40} />}
                  title={lang === "ar" ? "الفعاليات" : "Events"}
                  text={lang === "ar" ? "استعرض الفعاليات." : "Browse reviewer events."}
                  btnText={lang === "ar" ? "فتح" : "Open"}
                  bg="#133a63"
                  onClick={() => navigate("/events")}
                />
              </Col>

              <Col md="6" xl="4">
                <ActionCard
                  icon={<FaCertificate size={36} />}
                  title={lang === "ar" ? "شهاداتي" : "My Certificates"}
                  text={lang === "ar" ? "حمّل شهاداتك." : "Download your certificates."}
                  btnText={lang === "ar" ? "فتح" : "Open"}
                  bg="#133a63"
                  onClick={() => navigate("/certificates")}
                />
              </Col>

              <Col md="6" xl="4">
                <ActionCard
                  icon={<FaBolt size={34} />}
                  title={lang === "ar" ? "التحديثات المباشرة" : "Real-time Activity"}
                  text={lang === "ar" ? "تابع آخر التحديثات." : "View live platform updates."}
                  btnText={lang === "ar" ? "فتح" : "Open"}
                  bg="#133a63"
                  onClick={() => navigate("/activity")}
                />
              </Col>

              <Col md="6" xl="4">
                <ActionCard
                  icon={<FaComments size={34} />}
                  title={lang === "ar" ? "مجتمع النقاش" : "Community Forum"}
                  text={lang === "ar" ? "شارك في نقاشات SparkUp." : "Join professional discussions."}
                  btnText={lang === "ar" ? "فتح" : "Open"}
                  bg="#133a63"
                  onClick={() => navigate("/forum")}
                />
              </Col>

              <Col md="6" xl="4">
                <ActionCard
                  icon={<FaCommentDots size={34} />}
                  title={lang === "ar" ? "التقييم والملاحظات" : "Feedback"}
                  text={lang === "ar" ? "أرسل ملاحظاتك للإدارة." : "Send feedback to admin."}
                  btnText={lang === "ar" ? "فتح" : "Open"}
                  bg="#133a63"
                  onClick={toggleFeedback}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      <FeedbackPopup isOpen={feedbackOpen} toggle={toggleFeedback} />

      <ProfileEditModal
        isOpen={profileOpen}
        toggle={toggleProfile}
        user={user}
      />
    </div>
  );
}