#!/bin/sh
rm -rf env
sudo apt-get install libtiff4-dev libjpeg8-dev zlib1g-dev libfreetype6-dev liblcms1-dev libwebp-dev
sudo easy_install pip
sudo pip install --upgrade pip
sudo pip install --upgrade virtualenv
virtualenv --distribute --no-site-packages env
env/bin/pip install --download-cache=~/.pip-cache -r requirements.txt
patch -d env/lib/python2.7/site-packages/ -p1 < mail-local-hostname3-nodocs.patch
