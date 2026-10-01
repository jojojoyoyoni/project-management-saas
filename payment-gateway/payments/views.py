# import stripe
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response
# from rest_framework import status
# from django.conf import settings

# # A simple permission class to check the Internal API Key
# class IsInternalService(BasePermission):
#     def has_permission(self, request, view):
#         auth_header = request.headers.get('X-Gateway-Key')
#         return auth_header == settings.INTERNAL_API_KEY

# from rest_framework.permissions import BasePermission

# @api_view(['POST'])
# @permission_classes([IsInternalService])
# def create_checkout_session(request):
#     """
#     Receives: { org_id: 8, org_name: "Acme Corp" }
#     Returns: { url: "https://checkout.stripe.com/..." }
#     """
#     org_id = request.data.get('org_id')
#     org_name = request.data.get('org_name', f'Org {org_id}')
    
#     if not org_id:
#         return Response({"error": "org_id is required"}, status=status.HTTP_400_BAD_REQUEST)

#     stripe.api_key = settings.STRIPE_SECRET_KEY

#     try:
#         session = stripe.checkout.Session.create(
#             payment_method_types=['card'],
#             line_items=[{
#                 # Replace with your actual Stripe Price ID for "Pro Plan"
#                 'price': 'price_1Pq...YOUR_STRIPE_PRICE_ID', 
#                 'quantity': 1,
#             }],
#             mode='subscription',
#             client_reference_id=str(org_id), # Pass Org ID so webhook knows who to upgrade
#             success_url='http://localhost:5173/settings?status=success',
#             cancel_url='http://localhost:5173/settings?status=canceled',
#         )
        
#         return Response({"url": session.url})
        
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from rest_framework.permissions import BasePermission

# Security check: Only ProjectFlow can call this gateway
class IsInternalService(BasePermission):
    def has_permission(self, request, view):
        auth_header = request.headers.get('X-Gateway-Key')
        return auth_header == settings.INTERNAL_API_KEY

@api_view(['POST'])
@permission_classes([IsInternalService])
def create_checkout_session(request):
    org_id = request.data.get('org_id')
    
    if not org_id:
        return Response({"error": "org_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    # --- MOCKING STRIPE ---
    # We pretend Stripe gave us a checkout URL.
    # We point it to your frontend settings page with a success status.
    fake_checkout_url = f"http://localhost:5173/settings?status=success&org_id={org_id}"
    
    return Response({"url": fake_checkout_url})