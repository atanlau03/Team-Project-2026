import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Notification Portal */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 items-center pointer-events-none w-full max-w-md px-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`
              pointer-events-auto
              flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border
              transition-all duration-500 ease-out
              ${n.type === 'success' ? 'bg-[#513825] border-primary/20 text-white' : 
                n.type === 'error' ? 'bg-[#ba1a1a] border-error/20 text-white' : 
                'bg-surface-container-highest border-outline-variant/30 text-on-surface'}
            `}
            style={{
              animation: 'notification-slide-up 0.5s ease-out'
            }}
          >
            <span className="material-symbols-outlined text-[20px] fill">
              {n.type === 'success' ? 'check_circle' : n.type === 'error' ? 'error' : 'info'}
            </span>
            <p className="font-headline font-bold text-sm tracking-tight">{n.message}</p>
            <button 
              onClick={() => removeNotification(n.id)}
              className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
