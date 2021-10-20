from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('send_eth/', views.send_eth, name='send_eth'),
]

