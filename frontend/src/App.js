import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AnimatedBackground from './components/AnimatedBackground';
import Home from './pages/Home';
import CreateBounty from './pages/CreateBounty';
import BountyList from './pages/BountyList';
import MyBounties from './pages/MyBounties';
import BountyDetail from './pages/BountyDetail';
import './utils/walletTest'; // Auto-run wallet tests

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="page-shell min-h-screen">
          <AnimatedBackground />
          <div className="relative z-[1] mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 pb-12 pt-24 sm:px-6 lg:px-10">
            <Header />
            <main className="relative z-10 flex-1 pb-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateBounty />} />
                <Route path="/bounties" element={<BountyList />} />
                <Route path="/my-bounties" element={<MyBounties />} />
                <Route path="/bounty/:id" element={<BountyDetail />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
