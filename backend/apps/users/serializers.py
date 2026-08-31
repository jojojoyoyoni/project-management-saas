from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    initials = serializers.SerializerMethodField()
    is_email_verified = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "avatar", "bio", "phone", "job_title", "role", "timezone",
            "receives_email_notifications", "receives_push_notifications",
            "last_activity_at", "email_verified_at", "date_joined",
            "initials", "is_email_verified",
        ]
        read_only_fields = ["id", "last_activity_at", "email_verified_at", "date_joined"]
    
    def get_initials(self, obj):
        return obj.get_initials()

class UserListSerializer(serializers.ModelSerializer):
    initials = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "avatar", "job_title", "role", "initials"]
    
    def get_initials(self, obj):
        return obj.get_initials()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "first_name", "last_name"]
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
    
    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})
        return attrs

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["user_id"] = user.id
        token["username"] = user.username
        token["email"] = user.email
        token["role"] = user.role
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
