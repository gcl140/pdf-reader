from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('read-pdf/', views.read_pdf, name='read_pdf'),
    path('stop-reading/', views.stop_reading, name='stop_reading'),
]
