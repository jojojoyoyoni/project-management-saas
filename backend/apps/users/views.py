from django.utils import timezone
from .permissions import IsOwnerOrReadOnly
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.organizations.models import OrganizationInvite, OrganizationMember

from .models import User
from .serializers import (
    UserSerializer, UserListSerializer, RegisterSerializer,
    ChangePasswordSerializer, CustomTokenObtainPairSerializer,
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # NEW: Check for invitation token
        token = request.data.get("token")
        if token:
            try:
                invite = OrganizationInvite.objects.get(token=token, accepted_at__isnull=True)
                
                # Add user to the organization
                OrganizationMember.objects.create(
                    organization=invite.organization,
                    user=user,
                    role=invite.role,
                    invited_by=invite.invited_by
                )
                
                # Mark invite as accepted
                invite.accepted_at = timezone.now()
                invite.save()
                
            except OrganizationInvite.DoesNotExist:
                # If token is invalid, we still register the user, but they just won't be added to an org
                pass
        
        return Response(
            {"success": True, "message": "User registered successfully.", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.tokens import RefreshToken
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({"success": True, "message": "Logged out successfully."})

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        return Response({"success": True, "user": UserSerializer(self.get_object()).data})
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "message": "Profile updated.", "user": serializer.data})
    
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"success": True, "message": "Password changed successfully."})

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    
    # Only Super Admins (is_superuser=True) can access this endpoint
    permission_classes = [IsAdminUser]
    
    filterset_fields = ["role", "is_superuser", "is_active"]
    search_fields = ["username", "first_name", "last_name", "email"]
    
    def get_serializer_class(self):
        return UserListSerializer if self.action == "list" else UserSerializer