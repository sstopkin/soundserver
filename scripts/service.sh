#!/bin/bash
echo "arg: $1"
notify-send "Система оповещения $1" "Пример работы" -i gtk-info
#systemctl restart soundserver-backend.service
#exit 0
