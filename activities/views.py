from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Comment
from .serializers import CommentSerializer
from .models import Notification
from .serializers import NotificationSerializer
from rest_framework import mixins


class NotificationViewSet(mixins.ListModelMixin,
                          mixins.DestroyModelMixin,
                          viewsets.GenericViewSet):
   
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def destroy(self, request, pk=None):
        # allow deleting (marking as read) only own notifications
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.delete()
            return Response({'message': 'Deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, pk=None):
        comment = self.get_object()
        
        if comment.user != request.user:
            return Response(
                {'error': 'You can only edit your own comments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        comment = self.get_object()
        
        if comment.user != request.user:
            return Response(
                {'error': 'You can only delete your own comments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        comment.delete()
        return Response(
            {'message': 'Comment deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )