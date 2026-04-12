import { useDispatch, useSelector } from "react-redux";
import { markNotificationRead, clearNotifications, fetchNotifications } from "../redux/slices/notificationSlice";
import { X, Bell, CheckCircle2, Trash2 } from "lucide-react";
import { useEffect } from "react";

export default function NotificationsModal({ onClose }) {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.notifications);
  const userId = useSelector((state) => state.auth.user._id);

  useEffect(() => {
    if(userId) {
      dispatch(fetchNotifications(userId));
    }
  }, [userId, dispatch]);

  const unreadCount = list.filter(n => !n.isRead).length;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute mt-2 bg-white shadow-xl rounded-lg z-50 md:mx-4 mx-0 md:w-96 w-full right-0 top-12"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
              <p className="text-xs text-gray-500">{list.length} total</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {list.length > 0 && (
              <button
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                onClick={() => dispatch(clearNotifications(list[0]?.userId))}
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No notifications</p>
              <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
                {list.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 cursor-pointer transition-all duration-200 group ${
                      notification.isRead 
                        ? "bg-white hover:bg-gray-50" 
                        : "bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500"
                    }`}
                    onClick={() => dispatch(markNotificationRead(notification._id))}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        notification.isRead ? "bg-gray-300" : "bg-blue-500"
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-5 ${
                          notification.isRead ? "text-gray-700" : "text-gray-900 font-medium"
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {!notification.isRead && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-green-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {list.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <button
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
              onClick={() => {
                list.forEach(notification => {
                  if (!notification.isRead) {
                    dispatch(markNotificationRead(notification._id));
                  }
                });
              }}
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}