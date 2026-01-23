from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
import random
from django.conf import settings

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']
 
        extra_kwargs = {
            'username': {'validators': []},
        }
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError('Passwords do not match')

        email = data.get('email')
        username = data.get('username')

        existing_user = None

        try:
            user_by_email = User.objects.get(email=email)
            from .models import Profile
            Profile.objects.get_or_create(user=user_by_email)

            if user_by_email.profile.email_verified:
                raise serializers.ValidationError('Email already registered')
            existing_user = user_by_email
        except User.DoesNotExist:
            pass

        
        if existing_user is None:
            try:
                user_by_username = User.objects.get(username=username)
                from .models import Profile
                Profile.objects.get_or_create(user=user_by_username)

                if user_by_username.profile.email_verified:
                    raise serializers.ValidationError('Username already taken')
                existing_user = user_by_username
            except User.DoesNotExist:
                pass

       
        self.existing_user = existing_user
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        existing_user = getattr(self, 'existing_user', None)

        if existing_user:
           
            user = existing_user
            user.username = validated_data['username']
            user.email = validated_data['email']
            user.set_password(password)
            user.is_active = False
            user.save()
        else:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=password,
                is_active=False 
            )
        
        otp = str(random.randint(100000, 999999))
        
        from django.utils import timezone
        user.profile.otp = otp
        user.profile.otp_created_at = timezone.now()
        user.profile.save()
        
        from django.core.mail import send_mail
        send_mail(
            'Verify your email - Event Photo Platform',
            f'Your OTP is: {otp}\n\nThis OTP will expire in 10 minutes.',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return user


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    
    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        
        profile = user.profile
        
        if profile.otp != data['otp']:
            raise serializers.ValidationError("Invalid OTP")
        
        if not profile.is_otp_valid():
            raise serializers.ValidationError("OTP has expired")
        
        data['user'] = user
        return data


class OmniportOAuthSerializer(serializers.Serializer):
    code = serializers.CharField()
    
    def validate(self, data):
        import requests
        from django.conf import settings
        import logging
        
        logger = logging.getLogger(__name__)
        
        code = data['code']
        
        token_data = {
            'client_id': settings.OMNIPORT_OAUTH_CLIENT_ID,
            'client_secret': settings.OMNIPORT_OAUTH_CLIENT_SECRET,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': settings.OMNIPORT_OAUTH_REDIRECT_URI,
        }
        
        try:
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
            
            token_response = requests.post(
                settings.OMNIPORT_OAUTH_TOKEN_URL,
                data=token_data,
                headers=headers,
                timeout=10,
                verify=True
            )
            
            logger.info(f"Token response status: {token_response.status_code}")
            
            if token_response.status_code == 405:
                logger.warning("Got 405 - trying alternative paths...")
                
                alternatives = [
                    settings.OMNIPORT_OAUTH_TOKEN_URL.rstrip('/'),
                    settings.OMNIPORT_OAUTH_TOKEN_URL.replace('/open_auth/', '/api/o/'),
                    settings.OMNIPORT_OAUTH_TOKEN_URL.replace('/open_auth/', '/oauth/'),
                    settings.OMNIPORT_OAUTH_TOKEN_URL.replace('/open_auth/', '/api/auth/'),
                ]
                
                for alt_url in alternatives:
                    if alt_url != settings.OMNIPORT_OAUTH_TOKEN_URL and token_response.status_code == 405:
                        try:
                            logger.info(f"Trying alternative: {alt_url}")
                            token_response = requests.post(
                                alt_url,
                                data=token_data,
                                headers=headers,
                                timeout=10,
                                verify=True
                            )
                            logger.info(f"Alternative attempt - Status: {token_response.status_code}")
                            if token_response.status_code != 405:
                                logger.info(f"Success with alternative URL: {alt_url}")
                                break
                        except Exception as e:
                            logger.error(f"Alternative attempt failed: {str(e)}")
                            continue
            
            token_response.raise_for_status()
            token_json = token_response.json()
            logger.info(f"Successfully exchanged code for tokens")
            
            access_token = token_json.get('access_token')
            if not access_token:
                logger.error(f"No access_token in response: {token_json}")
                raise serializers.ValidationError(f"Failed to get access token from Omniport")
            

            user_headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            user_response = requests.get(
                settings.OMNIPORT_OAUTH_USER_INFO_URL,
                headers=user_headers,
                timeout=10,
                verify=True
            )
            
            user_response.raise_for_status()
            user_info = user_response.json()
            
            data['user_info'] = user_info
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"OAuth request failed: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response text: {e.response.text[:500]}")
            raise serializers.ValidationError(f"OAuth failed: {str(e)}")