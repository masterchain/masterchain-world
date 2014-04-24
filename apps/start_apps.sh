#!/bin/sh

uwsgi -s 127.0.0.1:1092 -M --vhost --enable-threads --plugin python --logto /var/log/masterchain/mint2b-apps.log
