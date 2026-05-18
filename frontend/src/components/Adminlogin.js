
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import {Container,Row,Col,Card,CardBody,Form,FormGroup,Input,Button,Spinner,Alert} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../image/logo2.png';
import illustration from '../image/home.png';
import loginValidationSchema from '../validation/loginValidation';

function Adminlogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({}); 

  const { status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const values = { email, password };

    loginValidationSchema
      .validate(values, { abortEarly: false })
      .then(() => {
        setValidationErrors({});
        dispatch(login({ email, password, role: 'admin' }))
          .unwrap()
          .then(() => navigate('/admin'))
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(160deg, #e8f2ff 0%, #eef7ff 40%, #ffffff 100%)',
      }}
      className="d-flex align-items-center"
    >
      <Container>
        <Row className="justify-content-center align-items-center">
          
          <Col
            lg="6"
            className="d-none d-lg-flex justify-content-center align-items-center"
          >
            <img
              src={illustration}
              alt="Admin Login"
              style={{
                width: '80%',
                maxWidth: '480px',
                filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.15))',
              }}
            />
          </Col>

    
          <Col lg="5" md="7">
            <Card
              className="border-0 shadow-lg"
              style={{
                borderRadius: '18px',
                background: '#ffffff',
              }}
            >
              <CardBody className="px-4 px-md-5 py-5">
               
                <div className="d-flex align-items-center mb-4" style={{ gap: 12 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 16,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(242,248,255,0.98))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 14px 30px rgba(30, 136, 229, 0.14), inset 0 1px 0 rgba(255,255,255,0.92)',
                      border: '1px solid rgba(30,136,229,0.10)',
                    }}
                  >
                    <img
                      src={logo}
                      alt="SparkUp logo"
                      style={{ width: '72%', height: '72%', objectFit: 'contain' }}
                    />
                  </div>
                  <h2
                    className="fw-bold m-0"
                    style={{
                      fontSize: '1.72rem',
                      letterSpacing: '0.2px',
                      background: 'linear-gradient(90deg, #184f89 0%, #2f80ed 45%, #ff7a00 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    SparkUp
                  </h2>
                </div>

                <h3
                  className="fw-bold mb-4"
                  style={{ color: '#1a4d80', fontSize: '1.5rem' }}
                >
                  Admin Login
                </h3>

               
                {error && (
                  <Alert color="danger" className="py-2 text-center">
                    {error}
                  </Alert>
                )}

             
                <Form onSubmit={handleSubmit}>
                  <FormGroup className="mb-3">
                    <Input
                      type="email"
                      className="py-2"
                      style={{ borderRadius: '10px' }}
                      value={email}
                      placeholder="Admin Email"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {validationErrors.email && (
                      <div className="text-danger small mt-1">
                        {validationErrors.email}
                      </div>
                    )}
                  </FormGroup>

                  <FormGroup className="mb-2">
                    <Input
                      type="password"
                      className="py-2"
                      style={{ borderRadius: '10px' }}
                      value={password}
                      placeholder="Password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {validationErrors.password && (
                      <div className="text-danger small mt-1">
                        {validationErrors.password}
                      </div>
                    )}
                  </FormGroup>

             
                  <div className="text-end mb-3">
                    <Link
                      to="/forgetpass"
                      className="text-decoration-none"
                      style={{ color: '#1a73e8', fontSize: '0.9rem' }}
                    >
                      Forget Password?
                    </Link>
                  </div>

             
                  <div className="d-grid">
                    <Button
                      type="submit"
                      className="py-2"
                      style={{
                        background:
                          'linear-gradient(135deg, #1a73e8 0%, #4f9cf9 40%, #ff9f43 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                      }}
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? (
                        <Spinner size="sm" />
                      ) : (
                        'Login'
                      )}
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

export default Adminlogin;
