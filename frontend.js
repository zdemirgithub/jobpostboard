// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmailVerification from './components/EmailVerification';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Switch>
          <Route exact path="/" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/verify/:token" component={EmailVerification} />
          <PrivateRoute path="/dashboard" component={Dashboard} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;

// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        mobile: ''
    });
    const [error, setError] = useState('');
    const history = useHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/companies/register', formData);
            alert('Registration successful! Please check your email for verification.');
            history.push('/');
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-container">
            <h2>Company Registration</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Company Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        required
                    />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
    const [jobs, setJobs] = useState([]);
    const [newJob, setNewJob] = useState({
        title: '',
        description: '',
        experienceLevel: '',
        candidates: '',
        endDate: ''
    });

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/jobs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(response.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const candidateEmails = newJob.candidates.split(',').map(email => email.trim());
            
            await axios.post('http://localhost:5000/api/jobs', {
                ...newJob,
                candidates: candidateEmails
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Job posted successfully!');
            setNewJob({
                title: '',
                description: '',
                experienceLevel: '',
                candidates: '',
                endDate: ''
            });
            fetchJobs();
        } catch (error) {
            alert('Error posting job');
        }
    };

    return (
        <div className="dashboard">
            <h2>Post New Job</h2>
            <form onSubmit={handleSubmit} className="job-form">
                <input
                    type="text"
                    placeholder="Job Title"
                    value={newJob.title}
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                    required
                />
                <textarea
                    placeholder="Job Description"
                    value={newJob.description}
                    onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                    required
                />
                <input
                    type="text"
                    placeholder="Experience Level"
                    value={newJob.experienceLevel}
                    onChange={(e) => setNewJob({...newJob, experienceLevel: e.target.value})}
                    required
                />
                <input
                    type="text"
                    placeholder="Candidate Emails (comma-separated)"
                    value={newJob.candidates}
                    onChange={(e) => setNewJob({...newJob, candidates: e.target.value})}
                    required
                />
                <input
                    type="date"
                    value={newJob.endDate}
                    onChange={(e) => setNewJob({...newJob, endDate: e.target.value})}
                    required
                />
                <button type="submit">Post Job</button>
            </form>

            <h2>Posted Jobs</h2>
            <div className="jobs-list">
                {jobs.map(job => (
                    <div key={job._id} className="job-card">
                        <h3>{job.title}</h3>
                        <p>{job.description}</p>
                        <p>Experience Level: {job.experienceLevel}</p>
                        <p>End Date: {new Date(job.endDate).toLocaleDateString()}</p>
                        <p>Candidates: {job.candidates.join(', ')}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
