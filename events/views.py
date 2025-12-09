from django.shortcuts import render
from rest_framework import viewsets, permissions
from .serializers import EventSerializer
from .models import Event
# Create your views here.

class EventViewSet(viewsets.ModelViewSet):
	queryset = Event.objects.all()
	serializer_class = EventSerializer
	permission_classes = [permissions.IsAuthenticatedOrReadOnly]
