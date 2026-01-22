
import React from 'react';
import { AlertTriangle, X, Check, ShieldAlert, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  showConfirmButton?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  showConfirmButton = true
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const styles = {
    danger: {
      icon: <ShieldAlert className="w-6 h-6 text-red-600" />,
      bgIcon: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-100'
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
      bgIcon: 'bg-orange-100',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
      border: 'border-orange-100'
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      bgIcon: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      border: 'border-blue-100'
    }
  };

  const currentStyle = styles[type];

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full border ${currentStyle.border} overflow-hidden transform transition-all scale-100`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${currentStyle.bgIcon} flex items-center justify-center`}>
              {currentStyle.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {message}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            {cancelLabel}
          </button>
          
          {showConfirmButton && onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors ${currentStyle.button}`}
            >
              {type === 'danger' && <ShieldAlert className="w-4 h-4" />}
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
