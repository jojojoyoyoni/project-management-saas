"""
Pagination controls how many items are returned per page.

Without pagination:
GET /api/tasks/ → Returns ALL tasks (could be 10,000!)
Response size: 5MB, slow, crashes browser

With pagination:
GET /api/tasks/ → Returns 20 tasks + metadata
Response size: 10KB, fast, includes "next" URL
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Standard pagination for all list endpoints.
    
    Usage in URL:
      /api/tasks/              → Page 1, 20 items
      /api/tasks/?page=2       → Page 2, 20 items
      /api/tasks/?page_size=50 → Page 1, 50 items
    """
    page_size = 20              # Default items per page
    page_size_query_param = "page_size"  # URL param to change page size
    max_page_size = 100         # Maximum allowed page size
    
    def get_paginated_response(self, data):
        """
        Custom response format.
        
        Default DRF format:
        { "count": 100, "next": "url", "previous": null, "results": [...] }
        
        Our format (adds extra metadata):
        { "count": 100, "next": "url", "previous": null, "results": [...],
          "page_size": 20, "current_page": 1, "total_pages": 5 }
        """
        return Response({
            "count": self.page.paginator.count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
            "page_size": self.get_page_size(self.request),
            "current_page": self.page.number,
            "total_pages": self.page.paginator.num_pages,
        })
