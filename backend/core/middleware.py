"""
Custom middleware for request/response processing.
"""
import time
import logging

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """
    Log every request with timing information.
    
    Output: "GET /api/tasks/ - 200 (0.05s)"
    
    Helps with:
    - Debugging: See which endpoints are being called
    - Performance: Identify slow endpoints
    - Monitoring: Track request patterns
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Record start time BEFORE processing
        start_time = time.time()
        
        # Process the request (calls view, etc.)
        response = self.get_response(request)
        
        # Calculate duration AFTER processing
        duration = time.time() - start_time
        
        # Log it
        logger.info(
            f"{request.method} {request.path} - {response.status_code} ({duration:.2f}s)"
        )
        
        return response
