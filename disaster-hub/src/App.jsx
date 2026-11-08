import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Alerts from './pages/Alerts.jsx';
import Shelters from './pages/Shelters.jsx';
import Checklist from './pages/Checklist.jsx';
import Plan from './pages/Plan.jsx';
import Supplies from './pages/Supplies.jsx';
import EmergencyCard from './pages/EmergencyCard.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="shelters" element={<Shelters />} />
        <Route path="checklist" element={<Checklist />} />
        <Route path="plan" element={<Plan />} />
        <Route path="supplies" element={<Supplies />} />
        <Route path="emergency-card" element={<EmergencyCard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;