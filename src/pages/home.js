import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import '../styles/animations.css'; 
import TeamLogos from '../components/teamLogos'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';
import InstallPWAButton from "../components/PWA";

const Home = () => {
    return (
        <div className="fade-in">
            <h1 style={welcomeMessageStyle}>
                Typer LIGI POLSKIEJ - Wiosna 2026
            </h1>

            {/* 🔥 Install Button (top placement) */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <InstallPWAButton />
            </div>

            <TeamLogos />
           
            <Container fluid style={linkContainerStyle}>
                <Row>
                    <Col md={6} className="spde-in">
                        <div className="section">
                            <p>
                                Typer LIGI POLSKIEJ sezonu 2025/26.<br />
                                To idealne miejsce dla pasjonatów piłki nożnej, którzy chcą sprawdzić swoje umiejętności przewidywania wyników meczów.
                            </p>
                        </div>

                        <hr />

                        <div className="section">
                            <h2>Jak to działa?</h2>
                            <hr />
                            <p>Rejestracja: <br /> Utwórz konto, aby móc typować wyniki.</p>
                            <p>Typowanie: <br /> Przewiduj wyniki nadchodzących meczów LIGI POLSKIEJ.</p>
                            <p>Punktacja: <br /> Zdobywaj punkty za trafne prognozy.</p>
                            <p>Ranking: <br /> Sprawdzaj swoje miejsce w tabeli.</p>
                        </div>

                        <div className="section">
                            <p>Dołącz do zabawy i sprawdź, jak dobrze znasz naszą ligę!</p>
                        </div>

                        <hr />

                        <a
                            href="/bets"
                            style={linkStyle}
                            onMouseEnter={(e) => (e.currentTarget.style.color = linkHoverStyle.color)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = linkStyle.color)}
                        >
                            TYPUJ - <span style={{ color: '#00ff0d' }}>TUTAJ</span>
                        </a>

                        {/* 🔥 BEST placement (after interaction CTA) */}
                        <InstallPWAButton />

                        <p>
                            Masz pytanie? WhatsApp{' '}
                            <Link to="https://wa.me/447448952003" target="_blank">
                                <FontAwesomeIcon icon={faWhatsapp} size="2x" style={{ color: '#00ff0d' }} />
                            </Link>
                        </p>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

const welcomeMessageStyle = {
    fontWeight: 'bold',
    marginBottom: '5%',
    textAlign: 'center',
    fontFamily: 'Rubik',
    fontSize: '300%',
};

const linkContainerStyle = {
    textAlign: 'left', // ✅ fixed typo
    backgroundColor: '#212529ab',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
};

const linkStyle = {
    color: '#ff4500',
    textDecoration: 'none',
    fontSize: '16px',
    display: 'block',
    marginBottom: '10px',
    transition: 'color 0.3s ease',
};

const linkHoverStyle = {
    color: '#ff6347',
};

export default Home;