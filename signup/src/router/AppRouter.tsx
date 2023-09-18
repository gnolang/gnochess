import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Home from '../components/pages/Home/Home.tsx';
import Success from '../components/pages/Success/Success.tsx';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={'/'} element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path={'/success'} element={<Success />} />
        </Route>
        <Route path="*" element={<Navigate to={'/'} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
