import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Row,
  Col,
  Button,
  Input,
  Alert,
  Spinner,
  Badge,
  Progress,
} from "reactstrap";
import {
  FaArrowLeft,
  FaBell,
  FaCheckCircle,
  FaClock,
  FaFileContract,
  FaLink,
  FaMoneyBillWave,
  FaUserTie,
  FaClipboardCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, authHeaders } from "./api";
import "bootstrap/dist/css/bootstrap.min.css";

const CONTRACT_STEPS = ["Drafted", "Signed", "In Implementation", "Completed"];

const statusColor = (status) => {
  if (status === "Completed") return "success";
  if (status === "In Implementation") return "warning";
  if (status === "Signed") return "primary";
  return "secondary";
};

const progressValue = (status) => {
  const index = CONTRACT_STEPS.indexOf(status || "Drafted");
  return index === -1 ? 25 : ((index + 1) / CONTRACT_STEPS.length) * 100;
};

const money = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function FundingPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const isFunder = user?.role === "funder";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [programs, setPrograms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [filter, setFilter] = useState("all");

  const stats = useMemo(() => ({
    contracts: contracts.length,
    draft: contracts.filter((c) => c.status === "Drafted").length,
    active: contracts.filter((c) => ["Signed", "In Implementation"].includes(c.status)).length,
    completed: contracts.filter((c) => c.status === "Completed").length,
  }), [contracts]);

  const filteredContracts = useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter((c) => c.status === filter);
  }, [contracts, filter]);

  const fetchAll = async () => {
    setErr("");
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get("/funding-programs", { headers: authHeaders() }),
        api.get("/contracts", { headers: authHeaders() }),
      ]);
      setPrograms(pRes.data?.programs || []);
      setContracts(cRes.data?.contracts || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load funding data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isAdmin && !isFunder) {
      navigate(-1);
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateContract = async (id, status) => {
    setErr("");
    setOk("");
    try {
      await api.patch(`/contracts/${id}/status`, { status }, { headers: authHeaders() });
      setOk("Contract status updated.");
      fetchAll();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update contract");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f8ff" }}>
      <Container fluid className="py-4 px-3 px-lg-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <div style={{ color: "#f59c32", fontWeight: 950, letterSpacing: ".08em", textTransform: "uppercase" }}>
              SparkUp Funding Center
            </div>
            <h1 className="mb-1" style={{ color: "#0f2747", fontWeight: 950 }}>Funding & Contracts</h1>
            <p className="text-muted mb-0">
              Simple flow: Funder accepts → Admin saves agreement → Contract appears here automatically.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button color="light" className="rounded-pill fw-bold px-4" onClick={() => navigate("/notifications")}>
              <FaBell className="me-2" />Notifications
            </Button>
            <Button color="dark" className="rounded-pill fw-bold px-4" onClick={() => navigate(-1)}>
              <FaArrowLeft className="me-2" />Back
            </Button>
          </div>
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {ok && <Alert color="success">{ok}</Alert>}

        <Row className="g-3 mb-4">
          <Col md="6" xl="3"><StatCard icon={<FaFileContract />} label="Total Contracts" value={stats.contracts} helper="Created after agreement" /></Col>
          <Col md="6" xl="3"><StatCard icon={<FaClipboardCheck />} label="Drafted" value={stats.draft} helper="Waiting for signature" /></Col>
          <Col md="6" xl="3"><StatCard icon={<FaClock />} label="Active" value={stats.active} helper="Signed / implementation" /></Col>
          <Col md="6" xl="3"><StatCard icon={<FaCheckCircle />} label="Completed" value={stats.completed} helper="Resolved projects" /></Col>
        </Row>

        {isAdmin && (
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 26 }}>
            <CardBody className="p-4">
              <h4 className="fw-bold mb-3" style={{ color: "#0f2747" }}>How to create a contract</h4>
              <Row className="g-3">
                <Step number="1" title="Open idea communication" text="Go to Ideas Board and open the accepted idea funding room." />
                <Step number="2" title="Fill Agreement Details" text="Admin enters budget, deadline, conditions, required documents, and milestones." />
                <Step number="3" title="Save agreement" text="The system creates the contract automatically and it appears on this page." />
              </Row>
            </CardBody>
          </Card>
        )}

        <Card className="border-0 shadow-sm" style={{ borderRadius: 28 }}>
          <CardBody className="p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h4 className="fw-bold mb-1" style={{ color: "#0f2747" }}>Contracts</h4>
                <small className="text-muted">No manual contract form here. The admin creates it from Agreement Details after the funding discussion.</small>
              </div>
              <Input type="select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 250, borderRadius: 14 }}>
                <option value="all">All contracts</option>
                {CONTRACT_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Input>
            </div>

            {loading ? (
              <div className="text-center py-5"><Spinner color="primary" /><div className="mt-3 text-muted">Loading funding data...</div></div>
            ) : filteredContracts.length === 0 ? (
              <EmptyBox text="No contracts yet. Save Agreement Details from the communication room first." />
            ) : (
              filteredContracts.map((c) => <ContractCard key={c._id} contract={c} isAdmin={isAdmin} isFunder={isFunder} updateContract={updateContract} />)
            )}
          </CardBody>
        </Card>

        {programs.length > 0 && (
          <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: 26 }}>
            <CardBody className="p-4">
              <h5 className="fw-bold mb-3" style={{ color: "#0f2747" }}>Available Funding Programs</h5>
              <Row className="g-3">
                {programs.map((p) => <Col md="6" xl="4" key={p._id}><ProgramMini program={p} /></Col>)}
              </Row>
            </CardBody>
          </Card>
        )}
      </Container>
    </div>
  );
}

function StatCard({ icon, label, value, helper }) {
  return <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 24 }}><CardBody className="p-4 d-flex align-items-center gap-3"><div style={{ width: 54, height: 54, borderRadius: 18, background: "linear-gradient(135deg,#0f2747,#1e80ff)", color: "white", display: "grid", placeItems: "center", fontSize: 20 }}>{icon}</div><div><div style={{ color: "#64748b", fontSize: 12, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</div><div style={{ color: "#0f2747", fontSize: 30, fontWeight: 950 }}>{value}</div><small className="text-muted">{helper}</small></div></CardBody></Card>;
}

function Step({ number, title, text }) {
  return <Col md="4"><div className="p-3 h-100 rounded-4" style={{ background: "#f8fbff", border: "1px solid #dbeafe" }}><div className="d-flex align-items-center gap-3 mb-2"><span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "#ff9f2f", color: "white", fontWeight: 900 }}>{number}</span><strong style={{ color: "#0f2747" }}>{title}</strong></div><small className="text-muted" style={{ lineHeight: 1.7 }}>{text}</small></div></Col>;
}

function ProgramMini({ program }) {
  return <div className="p-3 rounded-4 h-100" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}><Badge color="primary" pill className="mb-2">Program</Badge><div className="fw-bold" style={{ color: "#0f2747" }}>{program.name}</div><small className="text-muted"><FaMoneyBillWave className="me-2" />{money(program.budget)} OMR</small></div>;
}

function ContractCard({ contract, isAdmin, isFunder, updateContract }) {
  const idea = contract.ideaId || {};
  return (
    <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: 24 }}>
      <CardBody className="p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <Badge color={statusColor(contract.status)} pill className="px-3 py-2 mb-2">{contract.status || "Drafted"}</Badge>
            <h5 className="fw-bold mb-1" style={{ color: "#0f2747" }}>{idea.title || "Idea Contract"}</h5>
            <div className="text-muted small"><FaUserTie className="me-2" />Funder: {contract.funderId?.name || "Assigned funder"}</div>
            <div className="text-muted small mt-1"><FaMoneyBillWave className="me-2" />Final budget: {money(contract.finalBudget)} OMR</div>
            {contract.deadline && <div className="text-muted small mt-1">Deadline: {new Date(contract.deadline).toLocaleDateString()}</div>}
            {contract.contractUrl && <div className="small mt-2"><FaLink className="me-2" /><a href={contract.contractUrl} target="_blank" rel="noreferrer">Open contract file</a></div>}
            {contract.conditions && <div className="mt-3 p-3 rounded-4" style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>{contract.conditions}</div>}
          </div>
          <div style={{ minWidth: 260 }}>
            <div className="small fw-bold mb-1" style={{ color: "#0f2747" }}>Contract progress</div>
            <Progress value={progressValue(contract.status)} style={{ height: 10, borderRadius: 999 }} />
            <div className="d-flex justify-content-between mt-2">{CONTRACT_STEPS.map((s) => <span key={s} style={{ fontSize: 11, color: contract.status === s ? "#0f2747" : "#94a3b8", fontWeight: contract.status === s ? 900 : 500 }}>{s}</span>)}</div>
          </div>
        </div>
        {(isAdmin || isFunder) && <div className="d-flex flex-wrap gap-2 mt-3">{CONTRACT_STEPS.filter((s) => s !== contract.status).map((s) => <Button key={s} size="sm" color={statusColor(s)} className="rounded-pill px-3" onClick={() => updateContract(contract._id, s)}>{s}</Button>)}</div>}
      </CardBody>
    </Card>
  );
}

function EmptyBox({ text }) {
  return <div className="text-center p-5 rounded-4" style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", color: "#64748b" }}><FaFileContract size={36} color="#1e80ff" /><h6 className="fw-bold mt-3 mb-1" style={{ color: "#0f2747" }}>{text}</h6><small>New contracts will appear here automatically.</small></div>;
}
