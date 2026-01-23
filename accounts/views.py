from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import RegisterSerializer, VerifyOTPSerializer, OmniportOAuthSerializer
from django.contrib.auth.models import User
from rest_framework.pagination import PageNumberPagination
from django.conf import settings


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_search(request):
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response([])

    users = User.objects.filter(username__icontains=q)[:20]
    results = [{'id': u.id, 'username': u.username, 'email': u.email} for u in users]
    return Response(results)
from django.contrib.auth.models import User
from rest_framework import status


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_search(request):
    q = request.query_params.get('q', '')
    if q:
        users = User.objects.filter(username__icontains=q)[:20]
    else:
        users = User.objects.all()[:20]

    data = [{'id': u.id, 'username': u.username, 'email': u.email} for u in users]
    return Response(data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'Registration successful. Please check your email for OTP.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    serializer = VerifyOTPSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        user.is_active = True
        user.save()
        user.profile.email_verified = True
        user.profile.otp = None  
        user.profile.save()
        
        return Response({
            'message': 'Email verified successfully. You can now login.'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def omniport_authorize(request):
    """
    Returns the Omniport authorization URL that the frontend should redirect the user to.
    """
    import urllib.parse

    params = {
        "client_id": settings.OMNIPORT_OAUTH_CLIENT_ID,
        "redirect_uri": settings.OMNIPORT_OAUTH_REDIRECT_URI,
        "response_type": "code",
    }
    query = urllib.parse.urlencode(params)
    url = f"{settings.OMNIPORT_OAUTH_AUTHORIZATION_URL}?{query}"
    return Response({"authorization_url": url})


@api_view(['POST'])
@permission_classes([AllowAny])
def omniport_login(request):
    serializer = OmniportOAuthSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user_info = serializer.validated_data['user_info']
    
    email = user_info.get('contactInformation', {}).get('instituteWebmailAddress')
    full_name = user_info.get('person', {}).get('fullName', '')
    display_picture = user_info.get('person', {}).get('displayPicture', '')
    
    student = user_info.get('student', {})
    department = student.get('branch name', '') or student.get('branch', {}).get('name', '')
    batch = None
    end_date_str = student.get('endDate')
    start_date_str = student.get('startDate', '')
    
    date_to_parse = end_date_str or start_date_str
    if date_to_parse:
        try:
            from datetime import datetime
            parsed_date = datetime.strptime(date_to_parse, '%Y-%m-%d')
            if not end_date_str and start_date_str:
                batch = parsed_date.year + 4
            else:
                batch = parsed_date.year
        except (ValueError, TypeError):
            batch = None
    
    if not email:
        return Response(
            {'error': 'Invalid user data from Omniport - email not found'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.filter(email=email).first()
    
    if not user:
        username = full_name if full_name else email.split('@')[0]
        
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=full_name.split()[0] if full_name else '',
            last_name=' '.join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else '',
            is_active=True,
        )
        created = True
    else:
        created = False
    
    user.profile.email_verified = True
    user.profile.batch = batch
    user.profile.department = department
    
    if display_picture:
        user.profile.display_picture = display_picture
    
    user.profile.save()
    
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'username': user.username,
            'email': user.email,
            'full_name': full_name,
            'batch': batch,
            'department': department,
            'display_picture': display_picture,
            'is_new': created
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
        'role': request.user.profile.role,
        'is_staff': request.user.is_staff,
    })

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    profile = request.user.profile
    
    if request.method == 'GET':
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'role': profile.role,
            'bio': profile.bio,
            'batch': profile.batch,
            'department': profile.department,
            'email_verified': profile.email_verified,
        })
    
    elif request.method == 'PATCH':
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        if 'batch' in request.data:
            profile.batch = request.data['batch']
        if 'department' in request.data:
            profile.department = request.data['department']
        
        profile.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'bio': profile.bio,
            'batch': profile.batch,
            'department': profile.department,
        })