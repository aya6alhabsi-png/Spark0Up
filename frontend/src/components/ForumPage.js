import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Input, Spinner, Alert } from "reactstrap";
import {
  FaBookmark,
  FaComment,
  FaEllipsisH,
  FaImage,
  FaPaperPlane,
  FaPaperclip,
  FaRegBookmark,
  FaRegEdit,
  FaRegHeart,
  FaReply,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

import { API_URL, api, authHeaders } from "./api";

const topicPalette = {
  general: { label: "General", color: "#2563eb", bg: "#eaf0ff" },
  ideas: { label: "Ideas & Innovation", color: "#0f766e", bg: "#dff8ef" },
  funding: { label: "Funding & Grants", color: "#7c3aed", bg: "#ede9fe" },
  events: { label: "Events", color: "#f97316", bg: "#fff0e6" },
  feedback: { label: "Feedback", color: "#db2777", bg: "#fce7f3" },
};

function getInitials(name, role) {
  const source = name || role || "User";
  return (
    source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function getImageSrc(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}

function UserAvatar({ person, size = 46 }) {
  const [ok, setOk] = useState(true);
  const src = getImageSrc(person?.imageUrl || person?.profileImage || "");

  if (src && ok) {
    return (
      <img
        className="spark-avatar-img"
        src={src}
        alt={person?.name || "User"}
        onError={() => setOk(false)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="spark-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size <= 32 ? 12 : 15,
      }}
    >
      {getInitials(person?.name, person?.role)}
    </span>
  );
}

function getTopic(post) {
  const text = `${post.title || ""} ${post.message || ""}`.toLowerCase();

  if (text.includes("fund") || text.includes("grant") || text.includes("budget")) {
    return topicPalette.funding;
  }

  if (text.includes("event") || text.includes("webinar") || text.includes("workshop")) {
    return topicPalette.events;
  }

  if (text.includes("feedback") || text.includes("suggest")) {
    return topicPalette.feedback;
  }

  if (text.includes("idea") || text.includes("innovation") || text.includes("solution")) {
    return topicPalette.ideas;
  }

  return topicPalette.general;
}

export default function ForumPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const commentRefs = useRef({});

  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [showComments, setShowComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [search, setSearch] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);

  const fetchPosts = async () => {
    setErr("");
    setLoading(true);

    try {
      const res = await api.get("/api/forum", {
        headers: authHeaders(),
      });

      const loadedPosts = res.data?.posts || [];
      setPosts(loadedPosts);

      const likedMap = {};
      loadedPosts.forEach((post) => {
        if (Array.isArray(post.likes)) {
          likedMap[post._id] = post.likes.some(
            (id) => String(id) === String(user?._id)
          );
        }
      });
      setLikedPosts(likedMap);
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to load thoughts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    fetchPosts();
  }, [navigate, user]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return posts.filter((post) => {
      const isMine = String(post.author?._id) === String(user?._id);

      if (activeView === "mine" && !isMine) return false;
      if (activeView === "saved" && !savedPosts[post._id]) return false;

      if (!q) return true;

      return `${post.title || ""} ${post.message || ""} ${post.author?.name || ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [posts, search, activeView, user?._id, savedPosts]);

  const createPost = async (e) => {
    e.preventDefault();

    setErr("");
    setSuccess("");

    if (!title.trim() || !message.trim()) {
      setErr("Please write a title and message before posting.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("message", message);

      if (imageFile) formData.append("image", imageFile);
      if (attachmentFile) formData.append("attachment", attachmentFile);

      await api.post("/api/forum", formData, {
        headers: authHeaders(),
      });

      setTitle("");
      setMessage("");
      setImageFile(null);
      setAttachmentFile(null);
      setSuccess("Thought shared successfully.");

      fetchPosts();
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const addComment = async (postId) => {
    setErr("");

    const text = commentInputs[postId] || "";

    if (!text.trim()) {
      setErr("Comment cannot be empty.");
      return;
    }

    try {
      await api.post(
        `/api/forum/${postId}/comment`,
        { text },
        { headers: authHeaders() }
      );

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      setShowComments((prev) => ({
        ...prev,
        [postId]: true,
      }));

      fetchPosts();
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to add comment");
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/api/forum/${postId}`, {
        headers: authHeaders(),
      });

      fetchPosts();
    } catch (error) {
      setErr(error.response?.data?.message || "You are not allowed to delete this post");
    }
  };

  const handleCommentClick = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    setTimeout(() => {
      commentRefs.current[postId]?.focus();
    }, 100);
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.patch(
        `/api/forum/${postId}/like`,
        {},
        { headers: authHeaders() }
      );

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likesCount: res.data.likesCount,
                likes: Array(res.data.likesCount).fill("liked"),
              }
            : post
        )
      );

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: res.data.liked,
      }));
    } catch (error) {
      setErr("Failed to update like");
    }
  };

  const handleSave = (postId) => {
    setSavedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const navItem = (key, icon, label) => (
    <button
      type="button"
      onClick={() => setActiveView(key)}
      className="spark-forum-nav-btn"
      style={{
        background:
          activeView === key
            ? "linear-gradient(135deg,#123bff,#4f46e5)"
            : "transparent",
        color: activeView === key ? "#fff" : "#1f2a44",
        boxShadow:
          activeView === key
            ? "0 14px 28px rgba(37,99,235,.24)"
            : "none",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="spark-forum-page tour-community">
      <style>{`
        .spark-forum-page{
          min-height:100vh;
          background:#f8fbff;
          color:#10172f;
          font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        }

        .spark-forum-layout{
          display:grid;
          grid-template-columns:260px minmax(0,1fr);
          gap:28px;
          max-width:1400px;
          margin:0 auto;
          padding:30px;
        }

        .spark-forum-sidebar{
          background:#fff;
          border-radius:24px;
          padding:24px;
          border:1px solid #e7eef9;
          height:fit-content;
          position:sticky;
          top:20px;
          box-shadow:0 18px 48px rgba(15,23,42,.07);
        }

        .spark-forum-logo{
          font-size:30px;
          font-weight:950;
          color:#123bff;
          letter-spacing:-.8px;
        }

        .spark-forum-logo span{
          color:#ff8a00;
        }

        .spark-forum-tagline{
          color:#64748b;
          font-size:13px;
          font-weight:700;
          margin-top:4px;
        }

        .spark-forum-section-title{
          margin-top:40px;
          margin-bottom:14px;
          font-size:13px;
          font-weight:900;
          text-transform:uppercase;
          color:#64748b;
        }

        .spark-forum-nav-btn{
          width:100%;
          border:none;
          height:54px;
          border-radius:14px;
          display:flex;
          align-items:center;
          gap:12px;
          padding:0 18px;
          font-weight:850;
          margin-bottom:10px;
          transition:.2s ease;
          cursor:pointer;
        }

        .spark-create-card{
          background:#fff;
          border-radius:24px;
          padding:22px;
          border:1px solid #e7eef9;
          margin-bottom:24px;
          box-shadow:0 18px 48px rgba(15,23,42,.07);
        }

        .spark-avatar{
          border-radius:50%;
          background:linear-gradient(135deg,#123bff,#4f46e5);
          color:#fff;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          font-weight:900;
          flex:0 0 auto;
        }

        .spark-avatar-img{
          border-radius:50%;
          object-fit:cover;
          border:2px solid #fff;
          flex:0 0 auto;
          box-shadow:0 12px 22px rgba(37,99,235,.18);
        }

        .spark-create-input{
          height:56px;
          border-radius:16px !important;
          border:1px solid #dbe4f0 !important;
          font-weight:700;
          box-shadow:none !important;
        }

        .spark-create-message{
          border-radius:16px !important;
          border:1px solid #dbe4f0 !important;
          min-height:100px;
          resize:vertical;
          box-shadow:none !important;
        }

        .spark-soft-btn{
          border:none;
          background:#f3f6fd;
          padding:11px 18px;
          border-radius:14px;
          font-weight:850;
          color:#34415f;
          cursor:pointer;
        }

        .spark-file-note{
          font-size:12px;
          color:#52617d;
          font-weight:800;
          background:#f5f8ff;
          border:1px solid #e2e9f7;
          border-radius:999px;
          padding:7px 11px;
        }

        .spark-post-btn{
          border:none;
          border-radius:16px;
          background:linear-gradient(135deg,#123bff,#4f46e5);
          font-weight:900;
          padding:12px 26px;
          box-shadow:0 14px 28px rgba(37,99,235,.24);
        }

        .spark-feed-head{
          display:flex;
          justify-content:space-between;
          align-items:center;
          flex-wrap:wrap;
          gap:14px;
          margin-bottom:22px;
        }

        .spark-search{
          border-radius:14px !important;
          border:1px solid #dbe4f0 !important;
          box-shadow:none !important;
          font-weight:700;
        }

        .spark-discussion-card{
          background:#fff;
          border-radius:22px;
          border:1px solid #e7eef9;
          padding:22px;
          margin-bottom:18px;
          box-shadow:0 14px 36px rgba(15,23,42,.06);
        }

        .spark-topic-pill{
          display:inline-flex;
          border-radius:12px;
          padding:6px 12px;
          font-size:12px;
          font-weight:900;
        }

        .spark-discussion-title{
          font-size:20px;
          font-weight:950;
          margin:16px 0 10px;
          color:#10172f;
        }

        .spark-discussion-text{
          color:#475569;
          line-height:1.7;
          margin-bottom:16px;
        }

        .spark-post-media{
          width:100%;
          border-radius:18px;
          margin-top:10px;
          object-fit:cover;
          max-height:420px;
          border:1px solid #e7eef9;
        }

        .spark-attachment-link{
          display:inline-flex;
          align-items:center;
          gap:8px;
          border:1px solid #dfe7f5;
          border-radius:14px;
          padding:10px 13px;
          text-decoration:none;
          color:#123bff;
          font-weight:900;
          background:#f8fbff;
          margin:10px 0 16px;
        }

        .spark-meta{
          display:flex;
          align-items:center;
          gap:10px;
          flex-wrap:wrap;
          margin-top:18px;
          font-size:13px;
          color:#53627d;
          font-weight:750;
        }

        .spark-role{
          background:#eef2ff;
          color:#2563eb;
          padding:4px 10px;
          border-radius:999px;
          font-size:12px;
          font-weight:900;
          text-transform:capitalize;
        }

        .spark-actions{
          display:flex;
          align-items:center;
          gap:20px;
        }

        .spark-icon-btn{
          border:none;
          background:transparent;
          font-weight:850;
          display:inline-flex;
          align-items:center;
          gap:7px;
          color:#475569;
          cursor:pointer;
          transition:.2s ease;
        }

        .spark-icon-btn:hover{
          transform:translateY(-1px);
          color:#123bff;
        }

        .spark-icon-btn.active-comment{
          color:#123bff;
        }

        .spark-icon-btn.active-like{
          color:#e11d48;
        }

        .spark-icon-btn.active-save{
          color:#123bff;
        }

        .spark-icon-btn.delete-btn{
          color:#dc2626;
        }

        .spark-comment-box{
          margin-top:18px;
          border-top:1px solid #edf2fb;
          padding-top:16px;
        }

        .spark-comment{
          background:#f8fbff;
          border:1px solid #e7eef9;
          border-radius:14px;
          padding:12px;
          margin-top:10px;
        }

        @media(max-width:900px){
          .spark-forum-layout{
            grid-template-columns:1fr;
            padding:18px;
          }

          .spark-forum-sidebar{
            position:static;
          }

          .spark-actions{
            gap:13px;
          }
        }
      `}</style>

      <div className="spark-forum-layout">
        <aside className="spark-forum-sidebar">
          <div className="spark-forum-logo">
            Spark<span>Up</span>
          </div>

          <div className="spark-forum-tagline">
            Ignite Ideas. Build Impact.
          </div>

          <div className="spark-forum-section-title">Share Your Thought</div>

          {navItem("all", <FaComment />, "Thoughts")}
          {navItem("mine", <FaRegEdit />, "My Posts")}
          {navItem("saved", <FaBookmark />, "Saved")}
        </aside>

        <main>
          {err && <Alert color="danger" style={{ borderRadius: 16 }}>{err}</Alert>}
          {success && <Alert color="success" style={{ borderRadius: 16 }}>{success}</Alert>}

          {user?.role !== "admin" && activeView !== "saved" && (
            <form onSubmit={createPost} className="spark-create-card">
              <div className="d-flex gap-3 align-items-center mb-3">
                <UserAvatar person={user} />

                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="spark-create-input"
                  placeholder="Share your thought..."
                />
              </div>

              <Input
                type="textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="spark-create-message mb-3"
                placeholder="Write your idea, question, or update..."
              />

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex gap-2 flex-wrap">
                  <label className="spark-soft-btn">
                    <FaImage className="me-2" />
                    Image
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <label className="spark-soft-btn">
                    <FaPaperclip className="me-2" />
                    Attach
                    <input
                      hidden
                      type="file"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  {imageFile && <span className="spark-file-note">Image: {imageFile.name}</span>}
                  {attachmentFile && <span className="spark-file-note">File: {attachmentFile.name}</span>}
                </div>

                <Button disabled={submitting} className="spark-post-btn">
                  <FaPaperPlane className="me-2" />
                  {submitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </form>
          )}

          <div className="spark-feed-head">
            <div className="d-flex align-items-center gap-2">
              <h4 className="m-0 fw-bold">
                {activeView === "mine"
                  ? "My Thoughts"
                  : activeView === "saved"
                  ? "Saved Thoughts"
                  : "Share Your Thought"}
              </h4>

              <Badge pill style={{ background: "#edf3ff", color: "#3151a4" }}>
                {filteredPosts.length}
              </Badge>
            </div>

            <div className="position-relative">
              <FaSearch
                style={{
                  position: "absolute",
                  top: 14,
                  left: 13,
                  color: "#71809a",
                }}
              />

              <Input
                className="spark-search"
                style={{ paddingLeft: 38 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search thoughts..."
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner />
            </div>
          ) : filteredPosts.length === 0 ? (
            <Alert color="info" style={{ borderRadius: 16 }}>
              No thoughts yet.
            </Alert>
          ) : (
            filteredPosts.map((post) => {
              const canDelete =
                user?.role === "admin" ||
                String(post.author?._id) === String(user?._id);

              const topic = getTopic(post);
              const comments = post.comments || [];
              const commentCount = comments.length;
              const isLiked = likedPosts[post._id];

              const likeCount =
                post.likesCount ??
                post.likes?.length ??
                0;

              const isSaved = savedPosts[post._id];
              const commentsOpen = showComments[post._id];

              return (
                <article className="spark-discussion-card" key={post._id}>
                  <div className="d-flex justify-content-between gap-3">
                    <span
                      className="spark-topic-pill"
                      style={{
                        background: topic.bg,
                        color: topic.color,
                      }}
                    >
                      {topic.label}
                    </span>

                    <button type="button" className="spark-icon-btn">
                      <FaEllipsisH />
                    </button>
                  </div>

                  <h3 className="spark-discussion-title">{post.title}</h3>

                  <p className="spark-discussion-text">{post.message}</p>

                  {post.imageUrl && (
                    <img
                      className="spark-post-media"
                      src={getImageSrc(post.imageUrl)}
                      alt="Shared"
                    />
                  )}

                  {post.attachmentUrl && (
                    <a
                      className="spark-attachment-link"
                      href={getImageSrc(post.attachmentUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaPaperclip />
                      {post.attachmentName || "Open attachment"}
                    </a>
                  )}

                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="spark-meta">
                      <UserAvatar person={post.author} size={32} />

                      <span style={{ fontWeight: 900, color: "#10172f" }}>
                        {post.author?.name || "User"}
                      </span>

                      <span className="spark-role">
                        {post.author?.role || "user"}
                      </span>

                      <span>
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleString()
                          : ""}
                      </span>
                    </div>

                    <div className="spark-actions">
                      <button
                        type="button"
                        className={`spark-icon-btn ${commentsOpen ? "active-comment" : ""}`}
                        onClick={() => handleCommentClick(post._id)}
                        title="Comment"
                      >
                        <FaComment />
                        {commentCount}
                      </button>

                      <button
                        type="button"
                        className={`spark-icon-btn ${isLiked ? "active-like" : ""}`}
                        onClick={() => handleLike(post._id)}
                        title="Like"
                      >
                        <FaRegHeart />
                        {likeCount}
                      </button>

                      <button
                        type="button"
                        className={`spark-icon-btn ${isSaved ? "active-save" : ""}`}
                        onClick={() => handleSave(post._id)}
                        title="Save"
                      >
                        {isSaved ? <FaBookmark /> : <FaRegBookmark />}
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          className="spark-icon-btn delete-btn"
                          onClick={() => deletePost(post._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="spark-comment-box">
                    {commentsOpen &&
                      comments.slice(-2).map((comment, idx) => (
                        <div key={idx} className="spark-comment">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <UserAvatar person={comment.user} size={28} />

                            <div style={{ fontWeight: 850, color: "#10172f" }}>
                              {comment.user?.name || "User"}{" "}
                              <span className="text-muted fw-normal text-capitalize">
                                {comment.user?.role}
                              </span>
                            </div>
                          </div>

                          <div style={{ color: "#40506d" }}>
                            {comment.text}
                          </div>
                        </div>
                      ))}

                    <div className="d-flex gap-2 mt-3">
                      <Input
                        innerRef={(el) => {
                          commentRefs.current[post._id] = el;
                        }}
                        value={commentInputs[post._id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post._id]: e.target.value,
                          }))
                        }
                        placeholder="Add response..."
                        style={{
                          borderRadius: 14,
                          border: "1px solid #e1e9f7",
                        }}
                      />

                      <Button
                        onClick={() => addComment(post._id)}
                        style={{
                          borderRadius: 14,
                          background: "#123bff",
                          border: 0,
                          fontWeight: 850,
                        }}
                      >
                        <FaReply />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
