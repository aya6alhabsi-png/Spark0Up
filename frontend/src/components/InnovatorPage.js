import React, { useContext, useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import {
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaKey,
  FaLightbulb,
  FaCalendarAlt,
  FaClipboardList,
  FaRobot,
  FaEdit,
  FaLanguage,
  FaMoon,
  FaSun,
  FaBell,
  FaCommentDots,
  FaCertificate,
  FaBolt,
  FaComments,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../image/logo2.png";
import { ResetPasswordModal } from "./ResetPass";
import { logout, updateUser } from "../store/authSlice";
import ProfileEditModal from "./ProfileEditModal";
import FeedbackPopup from "./FeedbackPopup";
import { AppContext } from "../context/AppContext";

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
        color: "#fff",
        fontSize: "0.95rem",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        className="me-2"
        style={{ width: 18, display: "inline-flex", justifyContent: "center" }}
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

function InnovatorPage() {
  const { user } = useSelector((state) => state.auth);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: "bot", text: "Hello, I am SparkUp Assistant. Ask me about idea submission, tracking, events, certificates, funding, reports, or notifications." },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { theme, lang, toggleTheme, toggleLang, t } = useContext(AppContext);

  const toggleReset = () => setResetOpen((o) => !o);
  const toggleAiModal = () => setAiModalOpen((o) => !o);
  const toggleProfileModal = () => setProfileModalOpen((o) => !o);
  const toggleFeedback = () => setFeedbackOpen((o) => !o);

  const phone = user?.phone || user?.phoneNumber || user?.mobile || "+000 00000000";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };


  const askSparkUpAssistant = async () => {
    const question = chatQuestion.trim();
    if (!question || chatLoading) return;
    setChatMessages((messages) => [...messages, { sender: "user", text: question }]);
    setChatQuestion("");
    setChatLoading(true);
    try {
      const token = getAuthToken(user);
      const res = await fetch(`${API_URL}/api/chatbot/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setChatMessages((messages) => [...messages, { sender: "bot", text: data?.answer || data?.msg || "I could not answer that. Try asking about SparkUp flow." }]);
    } catch (e) {
      setChatMessages((messages) => [...messages, { sender: "bot", text: "Server error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const innovatorName = user?.name || "Innovator";

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
  const getProfileImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_URL}${url}`;
  };

  const mainCards = [
    {
      key: "submitIdea",
      title: lang === "ar" ? "إرسال فكرة جديدة" : "Submit New Idea",
      text:
        lang === "ar"
          ? "أضف العنوان والوصف والفئة ونموذج الملكية الفكرية."
          : "Add title, abstract, category, and IP declaration to safely submit your idea.",
      icon: <FaLightbulb size={40} />,
      bg: "#123b73",
    },
    {
      key: "myIdeas",
      title: lang === "ar" ? "أفكاري وتقدمي" : "My Ideas, Tracking & Funder Chat",
      text:
        lang === "ar"
          ? "شاهد كل أفكارك وحالاتها: بانتظار، قيد المراجعة، معروضة، ممولة."
          : "View tracking, funding status, and open Chat with Funder after acceptance.",
      icon: <FaClipboardList size={38} />,
      bg: "#133a63",
    },
    {
      key: "events",
      title: lang === "ar" ? "الفعاليات والهاكاثونات" : "Events & Hackathons",
      text:
        lang === "ar"
          ? "تصفح الورش والهاكاثونات وبرامج الابتكار وسجل بسهولة."
          : "Browse workshops, hackathons, and innovation programs and register easily.",
      icon: <FaCalendarAlt size={40} />,
      bg: "#122f4c",
    },
    {
      key: "myEvents",
      title: lang === "ar" ? "فعالياتي المسجلة" : "My Registered Events",
      text:
        lang === "ar"
          ? "تابع الفعاليات التي سجلت فيها، ثم امسح QR الحضور للحصول على الشهادة."
          : "Track events you registered for, then scan the attendance QR to unlock certificates.",
      icon: <FaCalendarAlt size={32} />,
      bg: "#12325b",
    },
    {
      key: "certificates",
      title: lang === "ar" ? "شهاداتي" : "My Certificates",
      text:
        lang === "ar"
          ? "حمّل شهادات الفعاليات بعد تأكيد حضورك بواسطة QR."
          : "Download your event certificates after your QR attendance is confirmed.",
      icon: <FaCertificate size={36} />,
      bg: "#0f4f8f",
    },
    {
      key: "feedback",
      title: lang === "ar" ? "التقييم والملاحظات" : "Feedback",
      text:
        lang === "ar"
          ? "أرسل رأيك في المنصة من خلال نافذة سريعة."
          : "Send your feedback using a quick popup.",
      icon: <FaCommentDots size={34} />,
      bg: "#0f4a88",
    },

    {
      key: "activity",
      title: lang === "ar" ? "التحديثات المباشرة" : "Real-time Activity Feed",
      text: lang === "ar" ? "تابع آخر تحديثات الأفكار والفعاليات فوراً." : "Follow live updates for ideas, events, reviews, feedback, and discussions.",
      icon: <FaBolt size={34} />,
      bg: "#18485c",
    },
    {
      key: "forum",
      title: lang === "ar" ? "مجتمع النقاش" : "Community Forum",
      text: lang === "ar" ? "اسأل وشارك وتواصل مع مجتمع SparkUp." : "Ask questions and share ideas with the SparkUp community.",
      icon: <FaComments size={34} />,
      bg: "#18485c",
    },
  ];

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleCardClick = (key) => {
    if (key === "events" || key === "myEvents") {
      navigate("/events");
      return;
    }

    if (key === "certificates") {
      navigate("/certificates");
      return;
    }

    if (key === "submitIdea") {
      navigate("/ideas?view=submit");
      return;
    }

    if (key === "myIdeas") {
      navigate("/ideas?view=progress");
      return;
    }

    if (key === "activity") {
      navigate("/activity");
      return;
    }

    if (key === "forum") {
      navigate("/forum");
      return;
    }

    if (key === "feedback") {
      toggleFeedback();
      return;
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "var(--app-bg)" }}
      className="d-flex align-items-stretch"
    >
      <Container fluid className="py-4">
        <Row className="h-100 flex-row-reverse">
          <Col md="3" lg="2" className="d-flex flex-column" style={{ maxWidth: 260 }}>
            <Card
              className="h-100 shadow border-0"
              style={{ backgroundColor: "#f59c32", color: "#fff" }}
            >
              <CardBody className="d-flex flex-column p-3 p-md-4">
                <div className="d-flex flex-column align-items-center mb-4">
                  {user?.imageUrl ? (
                    <img
                      src={getProfileImageSrc(user.imageUrl)}
                      alt="Profile"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <FaUserCircle size={48} />
                  )}

                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="fw-semibold">
                      {t("hi")} {innovatorName}
                    </span>
                    <button
                      type="button"
                      onClick={toggleProfileModal}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FaEdit size={16} />
                    </button>
                  </div>

                  <Badge
                    pill
                    color="light"
                    className="mt-1 text-uppercase"
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.06em",
                      color: "#f57c00",
                    }}
                  >
                    {lang === "ar" ? "مبتكر" : "Innovator"}
                  </Badge>

                  {user?.bio ? (
                    <div
                      className="mt-2 text-center"
                      style={{ maxWidth: 260, fontSize: "0.85rem", opacity: 0.95 }}
                    >
                      {user.bio}
                    </div>
                  ) : null}
                </div>

                <div className="small mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <FaEnvelope className="me-2" />
                    <span className="text-truncate">{user?.email}</span>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <FaPhone className="me-2" />
                    <span>{phone}</span>
                  </div>

                  <SidebarRow icon={<FaKey />} text={t("resetPassword")} onClick={toggleReset} />
                  <SidebarRow icon={<FaLanguage />} text={t("language")} onClick={toggleLang} />
                  <SidebarRow
                    icon={theme === "light" ? <FaMoon /> : <FaSun />}
                    text={t("theme")}
                    onClick={toggleTheme}
                  />
                  <SidebarRow
                    icon={<NotificationIcon count={unreadNotifications} />}
                    text={lang === "ar" ? "الإشعارات" : "Notifications"}
                    onClick={() => {
                      navigate("/notifications");
                    }}
                  />
                </div>

                

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

                <div className="flex-grow-1" />

                <div className="d-flex justify-content-center">
                 
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col md="9" lg="10" className="mt-4 mt-md-0">
            

            <Row className="gy-4">
              {mainCards.map((card) => (
                <Col key={card.key} sm="6" lg="4">
                  <Card
                    className="shadow border-0 h-100"
                    style={{
                      backgroundColor: card.bg,
                      color: "#fff",
                      borderRadius: "18px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleCardClick(card.key)}
                  >
                    <CardBody className="d-flex flex-column justify-content-between p-4">
                      <div>
                        <div className="mb-3">{card.icon}</div>
                        <h5 className="fw-bold mb-2">{card.title}</h5>
                        <p className="small mb-0">{card.text}</p>
                      </div>
                      <div className="mt-3 text-end">
                        <Button size="sm" color="light">
                          {lang === "ar" ? "فتح" : "Open"}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>

      <ResetPasswordModal isOpen={resetOpen} toggle={toggleReset} />

      <Modal isOpen={aiModalOpen} toggle={toggleAiModal} centered size="lg">
        <ModalHeader toggle={toggleAiModal}>SparkUp Smart Assistant</ModalHeader>
        <ModalBody>
          <div style={{ borderRadius: 18, background: "#f5f9ff", border: "1px solid #dbeafe", padding: 16, maxHeight: 360, overflowY: "auto" }}>
            {chatMessages.map((message, index) => (
              <div key={index} className={`d-flex mb-3 ${message.sender === "user" ? "justify-content-end" : "justify-content-start"}`}>
                <div style={{ maxWidth: "78%", borderRadius: 16, padding: "10px 14px", background: message.sender === "user" ? "#1e67c7" : "#ffffff", color: message.sender === "user" ? "#fff" : "#102846", border: message.sender === "user" ? "none" : "1px solid #e4edf8", lineHeight: 1.6 }}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <div className="d-flex gap-2 mt-3">
            <textarea
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askSparkUpAssistant();
                }
              }}
              placeholder="Ask about SparkUp idea flow, events, reports, certificates..."
              rows={2}
              className="form-control"
              style={{ borderRadius: 14 }}
            />
            <Button color="primary" onClick={askSparkUpAssistant} disabled={chatLoading} style={{ borderRadius: 14, minWidth: 92 }}>
              {chatLoading ? "..." : "Ask"}
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleAiModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <FeedbackPopup isOpen={feedbackOpen} toggle={toggleFeedback} />

      <ProfileEditModal
        isOpen={profileModalOpen}
        toggle={toggleProfileModal}
        user={user}
        onSaved={(u) => dispatch(updateUser(u))}
      />
    </div>
  );
}

export default InnovatorPage;