
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Menu, LayoutList, Bell, Loader2 } from 'lucide-react';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { MainPage } from './pages/MainPage';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { ChapterDetails } from './pages/ChapterDetails';
import { MyTasks } from './pages/MyTasks';
import { TaskDetails } from './pages/TaskDetails';
import { Team } from './pages/Team';
import { UserDetails } from './pages/UserDetails';
import { Settings } from './pages/Settings';
import { CalendarPage } from './pages/CalendarPage';
import { ClassifiedsPage } from './pages/ClassifiedsPage';
// Admin Pages
import { AdminPage } from './pages/AdminPage';
import { ProjectManagerPage } from './pages/admin/ProjectManagerPage';
import { ChapterChairPage } from './pages/admin/ChapterChairPage';
import { PresidentPage } from './pages/admin/PresidentPage';
import { VToolsReportPage } from './pages/admin/VToolsReportPage';

import { currentUserMock } from './lib/utils';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loading } = useData();

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-blue-600 gap-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-medium text-gray-600">Carregando ProjectHub...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 h-16 md:h-20 flex items-center shrink-0 z-10">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LayoutList className="w-5 h-5" />
              </button>
              
              <div className="flex items-center ml-1 md:ml-4">
                <img 
                  src="/assets/LogoRamoIEEE.png" 
                  alt="Logo Ramo Estudantil IEEE UnB" 
                  className="h-10 md:h-12 w-auto object-contain" 
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="flex items-center gap-2 pl-2 md:pl-4 border-l border-gray-200 ml-1 md:ml-2">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {currentUserMock.avatar}
                </div>
                <div className="text-sm hidden md:block">
                  <p className="font-bold text-gray-800 leading-none">{currentUserMock.nome}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{currentUserMock.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<MyTasks />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/chapters/:id" element={<ChapterDetails />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team/:id" element={<UserDetails />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/classifieds" element={<ClassifiedsPage />} />
            
            {/* Rotas Administrativas */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/project-manager" element={<ProjectManagerPage />} />
            <Route path="/admin/chapter-chair" element={<ChapterChairPage />} />
            <Route path="/admin/president" element={<PresidentPage />} />
            <Route path="/admin/vtools-report" element={<VToolsReportPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <DataProvider>
      <Router>
        <AppLayout />
      </Router>
    </DataProvider>
  );
}
