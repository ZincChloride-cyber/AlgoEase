import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import Header from './components/Header';
import Home from './pages/Home';
import CreateBounty from './pages/CreateBounty';
import BountyList from './pages/BountyList';
import MyBounties from './pages/MyBounties';
import BountyDetail from './pages/BountyDetail';


function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateBounty />} />
              <Route path="/bounties" element={<BountyList />} />
              <Route path="/my-bounties" element={<MyBounties />} />
              <Route path="/bounty/:id" element={<BountyDetail />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
