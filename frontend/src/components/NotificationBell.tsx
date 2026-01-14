import React, { useEffect, useRef, useState } from 'react';
import { Badge, IconButton, Menu, MenuItem, ListItemText, ListItemAvatar, Avatar, Box } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import notificationsService from '../services/notifications';
import { API_BASE_URL } from '../config';
import { useAppSelector } from '../store/hooks';

interface NotificationPayload {
  id: number;
  actor?: string | null;
  verb: string;
  image_id?: number | null;
  comment_id?: number | null;
  unread?: boolean;
  created_at?: string;
}

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    let mounted = true;

    const start = () => {
      loadNotifications();

      const token = localStorage.getItem('access_token');
      if (!token) return;

      const apiRoot = API_BASE_URL.replace(/\/api\/?$/, '');
      const wsProtocol = apiRoot.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${apiRoot.replace(/^https?:\/\//, '')}/ws/notifications/?token=${token}`;

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification' && data.notification) {
            if (!mounted) return;
            setNotifications((prev) => [data.notification as NotificationPayload, ...prev]);
          }
        } catch (e) {
        }
      };

      ws.onopen = () => {
        loadNotifications();
      };

      ws.onclose = () => {
      };
    };

    if (isAuthenticated) start();

    return () => {
      mounted = false;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
        wsRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const data = await notificationsService.list();
      setNotifications(data);
    } catch (e) {
    }
  };

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleClear = async (id: number) => {
    try {
      await notificationsService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
    }
  };

  const unreadCount = notifications.filter((n) => n.unread !== false).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <Box sx={{ maxWidth: 360 }}>
          {notifications.length === 0 ? (
            <MenuItem onClick={handleClose}>No notifications</MenuItem>
          ) : (
            notifications.map((n) => (
              <MenuItem key={n.id}>
                <ListItemAvatar>
                  <Avatar>{n.actor ? n.actor.charAt(0).toUpperCase() : 'N'}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={n.verb} secondary={n.created_at ? new Date(n.created_at).toLocaleString() : ''} />
                <Box>
                  <IconButton size="small" onClick={() => handleClear(n.id)}>
                    Clear
                  </IconButton>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;
