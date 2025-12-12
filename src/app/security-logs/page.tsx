'use client';

import { useState, useEffect } from 'react';
import { securityLogger } from '@/lib/sessionSecurity';
import { useAuth } from '@/hooks/useAuth';

export default function SecurityLogsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const userEvents = securityLogger.getEvents(user.id);
      setEvents(userEvents);
    }
  }, [user]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('th-TH');
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'session_expired': return '⏰';
      case 'suspicious_activity': return '⚠️';
      default: return '📝';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'login': return 'text-green-600 bg-green-50 border-green-200';
      case 'logout': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'session_expired': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'suspicious_activity': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p>กรุณาเข้าสู่ระบบเพื่อดู Security Logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Security Logs</h1>
        <p className="text-gray-600 mb-8">
          ประวัติการเข้าสู่ระบบและกิจกรรมด้านความปลอดภัยของบัญชีคุณ
        </p>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">ไม่มีข้อมูล Security Logs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getEventColor(event.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getEventIcon(event.type)}</span>
                    <div>
                      <h3 className="font-semibold">
                        {event.type === 'login' && 'เข้าสู่ระบบ'}
                        {event.type === 'logout' && 'ออกจากระบบ'}
                        {event.type === 'session_expired' && 'Session หมดอายุ'}
                        {event.type === 'suspicious_activity' && 'กิจกรรมน่าสงสัย'}
                      </h3>
                      <p className="text-sm opacity-75">
                        {formatTimestamp(event.timestamp)}
                      </p>
                      {event.details && (
                        <div className="mt-2 text-sm">
                          {event.details.email && (
                            <p>อีเมล: {event.details.email}</p>
                          )}
                          {event.details.userAgent && (
                            <p className="truncate max-w-md">
                              Device: {event.details.userAgent}
                            </p>
                          )}
                          {event.details.sessionId && (
                            <p className="font-mono text-xs">
                              Session: {event.details.sessionId.substring(0, 16)}...
                            </p>
                          )}
                          {event.details.reason && (
                            <p>เหตุผล: {event.details.reason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">💡 เกี่ยวกับ Security Logs</h3>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• บันทึกการเข้าสู่ระบบและออกจากระบบทั้งหมด</li>
            <li>• ตรวจจับกิจกรรมที่น่าสงสัย เช่น การเข้าจากอุปกรณ์ใหม่</li>
            <li>• ข้อมูลจะถูกเก็บไว้เพื่อความปลอดภัยของบัญชี</li>
            <li>• หากพบกิจกรรมที่ไม่ปกติ กรุณาเปลี่ยนรหัสผ่านทันที</li>
          </ul>
        </div>
      </div>
    </div>
  );
}