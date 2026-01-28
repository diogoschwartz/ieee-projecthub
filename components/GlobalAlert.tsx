import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AlertCircle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

type AlertType = 'error' | 'warning' | 'success' | 'info';

interface GlobalAlertContextType {
    showAlert: (title: string, message: string, type?: AlertType) => void;
    hideAlert: () => void;
}

const GlobalAlertContext = createContext<GlobalAlertContextType | undefined>(undefined);

export const useGlobalAlert = () => {
    const context = useContext(GlobalAlertContext);
    if (!context) {
        throw new Error('useGlobalAlert must be used within a GlobalAlertProvider');
    }
    return context;
};

export const GlobalAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState({
        title: '',
        message: '',
        type: 'error' as AlertType
    });

    const showAlert = (title: string, message: string, type: AlertType = 'error') => {
        setConfig({ title, message, type });
        setIsOpen(true);
    };

    const hideAlert = () => setIsOpen(false);

    // Auto-hide after 5 seconds for non-errors
    useEffect(() => {
        if (isOpen && config.type !== 'error') {
            const timer = setTimeout(hideAlert, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, config.type]);

    const getIcon = () => {
        switch (config.type) {
            case 'error': return <ShieldAlert className="w-6 h-6 text-red-600" />;
            case 'warning': return <AlertCircle className="w-6 h-6 text-amber-600" />;
            case 'success': return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
            default: return <AlertCircle className="w-6 h-6 text-blue-600" />;
        }
    };

    const getColors = () => {
        switch (config.type) {
            case 'error': return 'bg-red-50 border-red-200 text-red-900';
            case 'warning': return 'bg-amber-50 border-amber-200 text-amber-900';
            case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
            default: return 'bg-blue-50 border-blue-200 text-blue-900';
        }
    };

    return (
        <GlobalAlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}

            {/* Overlay/Toast Container */}
            <div className={`fixed top-4 right-4 z-[9999] transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
                <div className={`w-96 rounded-xl shadow-2xl border ${getColors()} p-4 flex gap-4 relative overflow-hidden`}>
                    {/* Decorative Stripe */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.type === 'error' ? 'bg-red-500' :
                            config.type === 'warning' ? 'bg-amber-500' :
                                config.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}></div>

                    <div className="shrink-0 pt-1">
                        {getIcon()}
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-base mb-1">{config.title}</h3>
                        <p className="text-sm opacity-90 leading-relaxed">{config.message}</p>
                    </div>

                    <button onClick={hideAlert} className="shrink-0 text-gray-400 hover:text-gray-600 self-start">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </GlobalAlertContext.Provider>
    );
};
