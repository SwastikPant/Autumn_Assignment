import django_filters
from .models import Image

class ImageFilter(django_filters.FilterSet):
	event = django_filters.NumberFilter(field_name='event_id')

	photographer = django_filters.CharFilter(
		field_name='uploaded_by__username',
		lookup_expr='icontains'
	)

	privacy = django_filters.ChoiceFilter(
		choices=Image.PRIV_CHOICES
	)

	uploaded_after = django_filters.DateTimeFilter(
		field_name='uploaded_at',
		lookup_expr='gte'
	)

	uploaded_before = django_filters.DateTimeFilter(
		field_name='uploaded_at',
		lookup_expr='lte'
	)

	class Meta:
		model = Image
		fields = ['event' ,'photographer', 'privacy']