import { AppointmentProvider } from './context/AppointmentContext';
import SchedulerApp from './pages/SchedulerApp';

function App() {
  return (
    <AppointmentProvider>
      <SchedulerApp />
    </AppointmentProvider>
  );
}

export default App;
