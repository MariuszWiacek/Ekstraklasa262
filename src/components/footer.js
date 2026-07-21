import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';


const Footer = () => {


  const footerStyle = {
    fontSize: "15px",
    color: 'white',
    
  };

  const mwStyle = {
    textAlign: 'center',
    fontSize: '12px',
    backgroundImage: 'rgba(0, 0, 0, 0.6)'
  };

  return (
    <>
      <div className="site-footer">
        <hr></hr>
        <footer style={footerStyle}>
          
              <div className="col-md-12">
                <div className="social-icons" style={{ display: "flex", justifyContent: "space-around", padding: '50px'}}>
                  <a href="http://github.com/MariuszWiacek">
                    <FontAwesomeIcon icon={faGithub} size="2x" />
                  </a>
                  <Link to="https://wa.me/447448952003" target="_blank">
                    <FontAwesomeIcon icon={faWhatsapp} size="2x" style={{ color: '#00ff0d' }} />
                  </Link>
                  <a href="#">
                    <FontAwesomeIcon icon={faTwitter} size="2x" style={{ color: '#00ccff' }} />
                  </a>
                  <div style={mwStyle}>
                    <p>&copy; 2024 Created by MW</p>
                 
              </div>

            </div>
          </div>
        </footer>
      </div>

    </>
  );
};

export default Footer;
