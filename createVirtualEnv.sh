#!/bin/sh
rm -rf env.bak
mv env env.bak
sudo apt-get install libtiff4-dev libjpeg8-dev zlib1g-dev libfreetype6-dev liblcms1-dev libwebp-dev
sudo easy_install pip
sudo pip install --upgrade pip
sudo pip install --upgrade virtualenv
virtualenv --distribute --no-site-packages env
env/bin/pip install --download-cache=~/.pip-cache -r requirements.txt
