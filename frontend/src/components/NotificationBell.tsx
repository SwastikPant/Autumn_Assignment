import React, { useEffect, useRef, useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box
} from '@mui/material';
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
  const accessToken = localStorage.getItem('access_token');

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      if (!isAuthenticated) return;

      const token = localStorage.getItem('access_token');
      if (!token || token.length < 10) return;


      try {
        const data = await notificationsService.list();
        if (mounted) setNotifications(data);
      } catch {}

      const apiRoot = API_BASE_URL.replace(/\/api\/?$/, '');
      const wsProtocol = apiRoot.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${apiRoot.replace(/^https?:\/\//, '')}/ws/notifications/?token=${token}`;


      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(' Notifications WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification' && data.notification && mounted) {
            setNotifications((prev) => [
              data.notification as NotificationPayload,
              ...prev
            ]);
          }
        } catch {}
      };

      ws.onerror = (err) => {
        console.error(' WebSocket error', err);
      };

      ws.onclose = () => {
        if (!mounted) return;

        console.warn(' WebSocket closed, retrying...');
        setTimeout(() => {
          if (mounted && isAuthenticated) {
            start();
          }
        }, 2000);
      };
    };

    start();

    return () => {
      mounted = false;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, accessToken]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleClear = async (id: number) => {
    try {
      await notificationsService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
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
                  <Avatar>
                    {n.actor ? n.actor.charAt(0).toUpperCase() : 'N'}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={n.verb}
                  secondary={
                    n.created_at
                      ? new Date(n.created_at).toLocaleString()
                      : ''
                  }
                />

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
