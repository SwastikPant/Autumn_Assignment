from rest_framework import serializers
from .models import Reaction, Comment
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'actor', 'verb', 'image', 'comment', 'unread', 'created_at']
        read_only_fields = ['user', 'actor', 'created_at']

class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Reaction
        fields = ['id', 'user', 'image', 'reaction_type', 'created_at']
        read_only_fields = ['user', 'created_at']

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    replies = serializers.SerializerMethodField()
    image = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'image', 'parent', 'text', 'created_at', 'updated_at', 'replies']
        read_only_fields = ['user', 'created_at', 'updated_at', 'image']
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True}
        }       
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []
