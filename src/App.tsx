import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import Layout from '@/components/Layout';
import Onboarding from '@/pages/Onboarding';
import Today from '@/pages/Today';
import SleepLog from '@/pages/SleepLog';
import Family from '@/pages/Family';
import Relax from '@/pages/Relax';
import Review from '@/pages/Review';

function HomeRoute() {
  const profile = useStore((s) => s.profile);

  if (profile?.onboardingDone) {
    return <Navigate to="/today" replace />;
  }

  return <Onboarding />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route element={<Layout />}>
          <Route path="/today" element={<Today />} />
          <Route path="/sleep-log" element={<SleepLog />} />
          <Route path="/family" element={<Family />} />
          <Route path="/relax" element={<Relax />} />
          <Route path="/review" element={<Review />} />
        </Route>
      </Routes>
    </Router>
  );
}
