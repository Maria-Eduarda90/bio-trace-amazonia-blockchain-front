import './global.css'
import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import BatchList from './components/BatchList';
import BatchDashboard from './components/BatchDashboard';
import BatchManager from './components/BatchManager';

// Wrapper to parse ID from URL params for the Dashboard
const DashboardWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) return null;

    return (
        <BatchDashboard
            batchId={id}
            onBack={() => navigate('/')}
        />
    );
};

// Wrapper for Admin/Manager
const ManagerWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) return null;

    return (
        <BatchManager
            batchId={id}
            onBack={() => navigate('/')}
        />
    )
}

// Wrapper for List to handle navigation prop
const ListWrapper: React.FC = () => {
    const navigate = useNavigate();
    return (
        <BatchList onSelectBatch={(id) => navigate(`/batch/${id}`)} />
    );
}

const App: React.FC = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<ListWrapper />} />
                <Route path="/batch/:id" element={<DashboardWrapper />} />
                <Route path="/manage/:id" element={<ManagerWrapper />} />
            </Routes>
        </HashRouter>
    );
};

export default App;