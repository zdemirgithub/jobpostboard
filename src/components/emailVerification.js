import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';

function EmailVerification() {
    const [status, setStatus] = useState('Verifying...');
    const { token } = useParams();
    const history = useHistory();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                await axios.post(`http://localhost:5000/api/companies/verify/${token}`);
                setStatus('Email verified successfully! Redirecting to login...');
                setTimeout(() => {
                    history.push('/');
                }, 3000);
            } catch (error) {
                setStatus('Verification failed. Please try again or contact support.');
            }
        };

        verifyEmail();
    }, [token, history]);

    return (
        <div className="auth-container">
            <h2>Email Verification</h2>
            <div className={status.includes('failed') ? 'error' : ''}>
                {status}
            </div>
        </div>
    );
}

export default EmailVerification;
